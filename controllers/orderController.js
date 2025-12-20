const Order = require("../models/order.model");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const Client = require("../models/Client");
const { sendEmail } = require('../services/email');
const generator = require('generate-password');
const bcrypt = require('bcrypt');

// Fonction pour générer un code de validation aléatoire
function generateValidationCode() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

/// Création d'une commande par le client
exports.createOrder = async (req, res) => {
  const {
    items,
    customerName,
    email,
    address,
    contact,
    location,
    restaurantId: restaurantIdFromBody,
    card,
    exp,
    cvc
  } = req.body;

  const restaurantId = req.user?.userId || restaurantIdFromBody;

  if (
    !items || !Array.isArray(items) || items.length === 0 ||
    !customerName || !contact || !location || location.latitude == null ||
    location.longitude == null
  ) {
    return res.status(400).json({ message: "Informations de commande ou GPS manquantes." });
  }

  try {
    // Vérifier si le client existe
    let client = await Client.findOne({ email });
    let generatedPassword = null;

    if (!client) {
      // Créer un compte automatiquement
      generatedPassword = generator.generate({
        length: 10,
        numbers: true,
        symbols: true,
        uppercase: true,
        excludeSimilarCharacters: true,
      });

      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      client = new Client({
        fullName: customerName,
        email,
        phone: contact,
        password: hashedPassword,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      if (address) {
        client.addresses.push({ label: 'Position GPS', address, location });
      }

      await client.save();

      // Envoyer le mot de passe par email
      await sendEmail(email, 'clientRegistration', {
        name: customerName,
        email,
        password: generatedPassword
      });
    }

    // Récupérer le restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant introuvable." });

    // Préparer les items
    const itemsWithSupplements = items.map(item => ({
      dishId: item.dishId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || '',
      supplements: Array.isArray(item.supplements)
        ? item.supplements.map(s => ({ name: s.name, price: s.price }))
        : []
    }));

    // Création de la commande
    const newOrder = new Order({
      items: itemsWithSupplements,
      customerName,
      address,
      contact,
      clientId: client._id,
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      restaurantId,
      status: 'en_attente',
      paymentInfo: { card, exp, cvc },
      restaurantName: restaurant.name,
      restaurantPhone: restaurant.phone,
      restaurantAddress: restaurant.address,
      courierLocation: null, // Pour suivi temps réel
      validationCode: null   // Pour code de validation lors de la livraison
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "Commande créée avec succès",
      order: savedOrder,
      clientCreated: generatedPassword ? true : false,
      passwordSentToEmail: generatedPassword ? true : false
    });
  } catch (err) {
    console.error("❌ Erreur createOrder:", err);
    res.status(500).json({ message: "Erreur serveur.", error: err.message });
  }
};

/// Récupérer toutes les commandes du restaurant connecté
exports.getRestaurantOrders = async (req, res) => {
  try {
    const restaurantId = req.user.userId;
    const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Erreur getRestaurantOrders:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/// Mettre à jour le statut d'une commande
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["en_attente", "en_cours", "livre"].includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const order = await Order.findOne({ _id: id, restaurantId: req.user.userId });
    if (!order) return res.status(404).json({ message: "Commande non trouvée." });

    order.status = status;

    // Générer le code de validation si la commande est acceptée et qu'il n'existe pas déjà
    if (status === 'en_cours' && !order.validationCode) {
      order.validationCode = generateValidationCode();
    }

    await order.save();

    res.status(200).json({ message: "Statut mis à jour.", order });
  } catch (err) {
    console.error("❌ Erreur updateOrderStatus:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/// Récupérer toutes les commandes livrées pour le livreur
exports.getDeliveredOrdersForLivreur = async (req, res) => {
  try {
    const deliveredOrders = await Order.find({ status: 'livre' }).sort({ createdAt: -1 });
    res.status(200).json(deliveredOrders);
  } catch (err) {
    console.error("❌ Erreur getDeliveredOrdersForLivreur:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/// Assigner une commande à un livreur
exports.assignOrderToCourier = async (req, res) => {
  const { id } = req.params;
  const courierId = req.user.userId;

  try {
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ message: "Commande non trouvée." });

    if (order.status !== 'livre') {
      return res.status(400).json({ message: "Commande déjà prise ou non disponible." });
    }

    order.status = 'en_cours';
    order.courierId = courierId;
    order.courierLocation = null; // initialiser le suivi

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error("❌ Erreur assignOrderToCourier:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/// Mise à jour position du livreur pour suivi temps réel
exports.updateCourierLocation = async (req, res) => {
  const { orderId, latitude, longitude } = req.body;
  const courierId = req.user.userId;

  if (!latitude || !longitude) return res.status(400).json({ message: "GPS requis." });

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Commande non trouvée." });
    if (order.courierId.toString() !== courierId) return res.status(403).json({ message: "Non autorisé." });

    order.courierLocation = { latitude, longitude, updatedAt: new Date() };
    await order.save();

    res.status(200).json({ message: "Position mise à jour.", courierLocation: order.courierLocation, customerLocation: order.location });
  } catch (err) {
    console.error("❌ Erreur updateCourierLocation:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/// Valider une commande avec le code de validation
exports.validateOrderWithCode = async (req, res) => {
  const { validationCode } = req.body;

  if (!validationCode) {
    return res.status(400).json({ message: "Code de validation requis." });
  }

  try {
    const order = await Order.findOne({ validationCode: validationCode.toUpperCase() });

    if (!order) return res.status(404).json({ message: "Commande non trouvée ou code incorrect." });

    order.status = 'livre';
    await order.save();

    res.status(200).json({ message: "Commande validée avec succès.", order });
  } catch (err) {
    console.error("❌ Erreur validateOrderWithCode:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
