const bcrypt = require("bcrypt");
const Restaurant = require("../models/Restaurant");

// Inscription restaurant
exports.registerRestaurant = async (req, res) => {
  const { name, address, phone, email, managerName, password, legalDocuments } =
    req.body;

  try {
    const restaurantExists = await Restaurant.findOne({ email });
    if (restaurantExists)
      return res.status(400).json({ message: "Restaurant déjà inscrit" });

    // Hacher le mot de passe si fourni
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newRestaurant = new Restaurant({
      name,
      address,
      phone,
      email,
      managerName,
      password: hashedPassword,
      legalDocuments,
      status: "pending", // Le restaurant est en attente de validation
    });
    await newRestaurant.save();

    res
      .status(201)
      .json({
        message:
          "Restaurant inscrit, en attente de validation par un administrateur.",
      });
  } catch (err) {
    res.status(500).json({ message: "Erreur du serveur", error: err.message });
  }
};

// Obtenir le profil d'un restaurant
exports.getRestaurantProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.userId).select(
      "-password"
    );
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé." });
    }
    res.status(200).json({ restaurant });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Mettre à jour le statut d'un restaurant (pour les administrateurs)
exports.updateRestaurantStatus = async (req, res) => {
  const { restaurantId, status } = req.body;

  // Vérifier si le statut est valide
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant non trouvé." });
    }

    restaurant.status = status;
    await restaurant.save();

    res
      .status(200)
      .json({ message: `Le statut du restaurant a été mis à jour: ${status}` });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};
