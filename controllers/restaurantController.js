// controllers/restaurantController.js
const bcrypt = require("bcrypt");
const Restaurant = require("../models/Restaurant");
const { sendEmail } = require("../services/email");

// Inscription restaurant
exports.registerRestaurant = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ message: "L'email est requis." });
  }

  try {
    const restaurantExists = await Restaurant.findOne({ email });
    if (restaurantExists) {
      return res.status(400).json({ message: "Restaurant déjà inscrit." });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newRestaurant = new Restaurant({
      name: req.body.name || '',
      address: req.body.address || '',
      phone: req.body.phone || '',
      email,
      managerName: req.body.managerName || '',
      password: hashedPassword,
      ninea: req.body.ninea || '',
      tradeRegister: req.files.tradeRegister ? req.files.tradeRegister[0].path : '',
      idCardCopy: req.files.idCardCopy ? req.files.idCardCopy[0].path : '',
      photo: req.files.photo ? req.files.photo[0].path : '',
      legalDocuments: req.files.legalDocuments ? req.files.legalDocuments[0].path : '',
      status: "pending",
    });

    await newRestaurant.save();

    await sendEmail(
      email,
      "Inscription réussie",
      "clientRegistration",
      { name: newRestaurant.name, email: newRestaurant.email, password: password }
    );

    res.status(201).json({
      message: "Restaurant inscrit, en attente de validation par un administrateur."
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur du serveur", error: err.message });
  }
};

// Obtenir le profil d'un restaurant
exports.getRestaurantProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.userId).select("-password");
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé." });
    }
    res.status(200).json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Mettre à jour le statut d'un restaurant
exports.updateRestaurantStatus = async (req, res) => {
  const { restaurantId, status } = req.body;

  if (!['pending', 'approved', 'rejected', 'blocked'].includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé." });
    }

    restaurant.status = status;
    await restaurant.save();

    res.status(200).json({ message: `Statut mis à jour: ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// ✅ Lister tous les restaurants
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().select("-password");
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// ✅ Modifier un restaurant
exports.updateRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(id, req.body, { new: true });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé." });
    }
    res.status(200).json({ message: "Restaurant mis à jour.", restaurant });
  } catch (error) {
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// ✅ Supprimer un restaurant
exports.deleteRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Restaurant.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Restaurant non trouvé." });
    }
    res.status(200).json({ message: "Restaurant supprimé." });
  } catch (error) {
    res.status(500).json({ message: "Erreur du serveur." });
  }
};
