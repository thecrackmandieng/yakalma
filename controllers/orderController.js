const Order = require("../models/order.model");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");

/// Création d'une commande par le client
exports.createOrder = async (req, res) => {
  const {
    items,
    customerName,
    address,
    contact,
    restaurantId: restaurantIdFromBody,
    card,
    exp,
    cvc
  } = req.body;

  const restaurantId = req.user?.userId || restaurantIdFromBody;

  if (
    !items || !Array.isArray(items) || items.length === 0 ||
    !customerName || !address || !contact || !restaurantId
  ) {
    return res.status(400).json({ message: "Données invalides." });
  }

  try {
    // Récupérer le restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant introuvable." });

    // Assurer que chaque item contient bien les suppléments
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
      restaurantId,
      status: 'en_attente',
      paymentInfo: { card, exp, cvc },
      restaurantName: restaurant.name,
      restaurantPhone: restaurant.phone,
      restaurantAddress: restaurant.address
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "Commande créée avec succès",
      order: savedOrder
    });
  } catch (err) {
    console.error("❌ Erreur createOrder:", err);
    res.status(500).json({ message: "Erreur serveur." });
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

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error("❌ Erreur assignOrderToCourier:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
