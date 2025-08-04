const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const emailService = require("../services/email");

// 🔐 Génère un mot de passe aléatoire
function generateRandomPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ✅ Pré-inscription
const preRegisterRestaurant = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "L'email est requis." });

  try {
    const existing = await Restaurant.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email déjà utilisé." });

    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newRestaurant = new Restaurant({
      email,
      password: hashedPassword,
      role: 'restaurant',
      status: "incomplete",
      isBlocked: false,
    });

    await newRestaurant.save();

    try {
      await emailService.sendEmail(email, "restaurantRegistration", { email, password: plainPassword });
    } catch (err) {
      console.error("Erreur envoi email :", err.message);
    }

    res.status(201).json({ message: "Compte créé. Vérifiez votre email." });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ✅ Enregistrement des infos du restaurant
const registerRestaurant = async (req, res) => {
  const { name, address, phone, email, managerName, ninea } = req.body;

  if (!name || !address || !phone || !managerName || !ninea ||
    !req.files?.permis || !req.files?.certificat || !req.files?.autresDocs ||
    !req.files?.idCardCopy || !req.files?.photo) {
    return res.status(400).json({ message: "Tous les champs et fichiers sont requis." });
  }

  try {
    const restaurant = await Restaurant.findOne({ email });
    if (!restaurant) return res.status(404).json({ message: "Compte non trouvé." });

    restaurant.name = name;
    restaurant.address = address;
    restaurant.phone = phone;
    restaurant.managerName = managerName;
    restaurant.ninea = ninea;

    // Fichiers
    restaurant.permis = req.files.permis[0].path;
    restaurant.certificat = req.files.certificat[0].path;
    restaurant.autresDocs = req.files.autresDocs[0].path;
    restaurant.idCardCopy = req.files.idCardCopy[0].path;
    restaurant.photo = req.files.photo[0].path;

    restaurant.status = "pending";
    await restaurant.save();

    try {
      await emailService.sendEmail(email, "restaurantProfileCompleted", { name });
    } catch (err) {
      console.error("Erreur envoi email (register):", err.message);
    }

    res.status(200).json({ message: "Profil complété avec succès." });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Connexion
const loginRestaurant = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email et mot de passe requis." });

  try {
    const restaurant = await Restaurant.findOne({ email });
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });

    const isMatch = await bcrypt.compare(password.trim(), restaurant.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect." });

    if (restaurant.isBlocked) {
      return res.status(403).json({ message: "Compte bloqué. Contactez le support." });
    }

    const token = jwt.sign(
      { userId: restaurant._id, role: "restaurant", status: restaurant.status },
      process.env.JWT_SECRET || "secret_dev",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        _id: restaurant._id,
        email: restaurant.email,
        role: "restaurant",
        status: restaurant.status,
      }
    });
  } catch (err) {
    console.error("❌ Erreur login:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
// Récupérer un restaurant par ID (sans le mot de passe)
const getRestaurantById = async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await Restaurant.findById(id).select("-password");
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });
    res.status(200).json(restaurant);
  } catch (error) {
    console.error("Erreur getRestaurantById:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// ✅ Récupérer le profil
const getRestaurantProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.userId).select("-password");
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });
    res.status(200).json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Mise à jour statut (admin)
const updateRestaurantStatus = async (req, res) => {
  const { restaurantId, status } = req.body;

  if (!["pending", "approved", "rejected", "blocked", "incomplete"].includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });

    restaurant.status = status;
    await restaurant.save();

    try {
      if (status === "approved") {
        await emailService.sendEmail(restaurant.email, "restaurantApproved", { name: restaurant.name });
      } else if (status === "rejected") {
        await emailService.sendEmail(restaurant.email, "restaurantRejected", { name: restaurant.name });
      }
    } catch (err) {
      console.error("❌ Email non envoyé (status):", err.message);
    }

    res.status(200).json({ message: `Statut mis à jour: ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Lister tous les restaurants
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().select("-password");
    res.status(200).json({ restaurants });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Modifier restaurant
const updateRestaurant = async (req, res) => {
  const { id } = req.params;

  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });

    if (req.body.name) restaurant.name = req.body.name;
    if (req.body.phone) restaurant.phone = req.body.phone;
    if (req.body.address) restaurant.address = req.body.address;
    if (req.body.managerName) restaurant.managerName = req.body.managerName;
    if (req.body.ninea) restaurant.ninea = req.body.ninea;

    if (req.files?.permis?.[0]) restaurant.permis = req.files.permis[0].path;
    if (req.files?.certificat?.[0]) restaurant.certificat = req.files.certificat[0].path;
    if (req.files?.autresDocs?.[0]) restaurant.autresDocs = req.files.autresDocs[0].path;
    if (req.files?.idCardCopy?.[0]) restaurant.idCardCopy = req.files.idCardCopy[0].path;
    if (req.files?.photo?.[0]) restaurant.photo = req.files.photo[0].path;

    await restaurant.save();
    res.status(200).json({ message: "Restaurant mis à jour avec succès", restaurant });
  } catch (error) {
    console.error("Erreur serveur (updateRestaurant):", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Supprimer restaurant
const deleteRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Restaurant.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Restaurant non trouvé." });
    res.status(200).json({ message: "Restaurant supprimé." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Bloquer / débloquer
const toggleBlockRestaurant = async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant introuvable." });

    restaurant.isBlocked = !restaurant.isBlocked;
    await restaurant.save();

    res.status(200).json({ message: `Restaurant ${restaurant.isBlocked ? "bloqué" : "débloqué"}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Récupérer le menu
const getRestaurantMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.userId).populate('menu');
    if (!restaurant) return res.status(404).json({ message: 'Restaurant non trouvé.' });

    res.status(200).json({ menu: restaurant.menu || [] });
  } catch (error) {
    console.error('Erreur getRestaurantMenu:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
// ✅ Ajouter un plat au menu
const addMenuItem = async (req, res) => {
  const { name, description, price } = req.body;
  const file = req.file || (req.files?.image ? req.files.image[0] : null);
  if (!name || !description || !price || !file)
    return res.status(400).json({ message: 'Tous les champs sont requis.' });

  try {
    const restaurantId = req.user.userId;  // Récupérer ID restaurant connecté
    if (!restaurantId) return res.status(401).json({ message: "Non autorisé." });

    const menuItem = new MenuItem({
      name,
      description,
      price,
      image: file.path,
      restaurantId  // On lie le menu au restaurant
    });
    await menuItem.save();

    // Ajouter l'id du menu à la liste des menus du restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant non trouvé.' });

    restaurant.menu.push(menuItem._id);
    await restaurant.save();

    res.status(201).json({ message: 'Plat ajouté avec succès.', menuItem });
  } catch (error) {
    console.error('Erreur addMenuItem:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
const updateRestaurantProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.userId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });

    const { managerName, email, phone } = req.body;

    if (managerName) restaurant.managerName = managerName;
    if (email) restaurant.email = email;
    if (phone) restaurant.phone = phone;

    if (req.files?.permis) restaurant.permis = req.files.permis[0].path;
    if (req.files?.certificat) restaurant.certificat = req.files.certificat[0].path;
    if (req.files?.autresDocs) restaurant.autresDocs = req.files.autresDocs[0].path;
    if (req.files?.idCardCopy) restaurant.idCardCopy = req.files.idCardCopy[0].path;
    if (req.files?.photo) restaurant.photo = req.files.photo[0].path;

    await restaurant.save();
    res.status(200).json({ message: "Profil mis à jour avec succès", restaurant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// ✅ Changer le mot de passe
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Les deux mots de passe sont requis." });

  try {
    const restaurant = await Restaurant.findById(req.user.userId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });

    const isMatch = await bcrypt.compare(currentPassword, restaurant.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe actuel incorrect." });

    const hashedNew = await bcrypt.hash(newPassword, 10);
    restaurant.password = hashedNew;
    await restaurant.save();

    res.status(200).json({ message: "Mot de passe modifié avec succès." });
  } catch (err) {
    console.error("Erreur changement mot de passe:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

const getMenuByRestaurantId = async (req, res) => {
  const { restaurantId } = req.params;

  try {
    const menuItems = await MenuItem.find({ restaurantId });

    res.status(200).json({ menu: menuItems });
  } catch (error) {
    console.error('Erreur getMenuByRestaurantId:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};



// ✅ Supprimer un plat
const deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) return res.status(404).json({ message: 'Plat non trouvé.' });

    if (fs.existsSync(menuItem.image)) fs.unlinkSync(menuItem.image);

    await MenuItem.findByIdAndDelete(id);
    await Restaurant.findByIdAndUpdate(req.user.userId, { $pull: { menu: id } });

    res.status(200).json({ message: 'Plat supprimé.' });
  } catch (error) {
    console.error('Erreur deleteMenuItem:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ✅ Exports
module.exports = {
  preRegisterRestaurant,
  registerRestaurant,
  loginRestaurant,
  getRestaurantProfile,
  updateRestaurantStatus,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  toggleBlockRestaurant,
  getRestaurantMenu,
  addMenuItem,
  getMenuByRestaurantId,
  deleteMenuItem,
  updateRestaurantProfile,
  changePassword,
};
