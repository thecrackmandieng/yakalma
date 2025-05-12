const Restaurant = require('../models/Restaurant');

// Inscription restaurant
exports.registerRestaurant = async (req, res) => {
  const { name, address, phone, email, managerName, legalDocuments } = req.body;

  try {
    const restaurantExists = await Restaurant.findOne({ email });
    if (restaurantExists) return res.status(400).json({ message: 'Restaurant déjà inscrit' });

    const newRestaurant = new Restaurant({ name, address, phone, email, managerName, legalDocuments });
    await newRestaurant.save();

    res.status(201).json({ message: 'Restaurant inscrit, en attente de validation par un administrateur.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur du serveur', error: err.message });
  }
};
