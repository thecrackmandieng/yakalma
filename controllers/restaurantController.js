const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const Table = require("../models/Table");
const emailService = require("../services/email");
const cloudinary = require("../config/cloudinary");
const QRCode = require('qrcode');

// 🔐 Génère un mot de passe aléatoire
function generateRandomPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Helper : récupère l'URL Cloudinary depuis le fichier uploadé
const getCloudinaryUrl = (file) => {
  if (!file) {
    throw new Error('Fichier manquant');
  }
  
  // Avec CloudinaryStorage, le fichier a déjà l'URL dans file.path
  return file.path;
};

// ==========================
// ✅ Pré-inscription
// ==========================
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

// ==========================
// ✅ Enregistrement des infos du restaurant
// ==========================
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

    // Les fichiers sont automatiquement uploadés vers Cloudinary via CloudinaryStorage
    restaurant.permis = getCloudinaryUrl(req.files.permis[0]);
    restaurant.certificat = getCloudinaryUrl(req.files.certificat[0]);
    restaurant.autresDocs = getCloudinaryUrl(req.files.autresDocs[0]);
    restaurant.idCardCopy = getCloudinaryUrl(req.files.idCardCopy[0]);
    restaurant.photo = getCloudinaryUrl(req.files.photo[0]);

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

// ==========================
// ✅ Connexion
// ==========================
const loginRestaurant = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email et mot de passe requis." });

  try {
    const restaurant = await Restaurant.findOne({ email });
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });

    const isMatch = await bcrypt.compare(password.trim(), restaurant.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect." });

    if (restaurant.isBlocked) return res.status(403).json({ message: "Compte bloqué. Contactez le support." });

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

// ==========================
// ✅ Récupérer le profil du restaurant par ID
// ==========================
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

// ==========================
// ✅ Récupérer profil restaurant
// ==========================
const getRestaurantProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.userId).select("-password");
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });
    res.status(200).json({ restaurant });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ==========================
// ✅ Mise à jour statut (admin)
// ==========================
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
      if (status === "approved") await emailService.sendEmail(restaurant.email, "restaurantApproved", { name: restaurant.name });
      else if (status === "rejected") await emailService.sendEmail(restaurant.email, "restaurantRejected", { name: restaurant.name });
    } catch (err) {
      console.error("❌ Email non envoyé (status):", err.message);
    }

    res.status(200).json({ message: `Statut mis à jour: ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ==========================
// ✅ Tous les restaurants
// ==========================
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().select("-password");
    res.status(200).json({ restaurants });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ==========================
// ✅ Modifier restaurant
// ==========================
const updateRestaurant = async (req, res) => {
  const { id } = req.params;

  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });

    const { name, phone, address, managerName, ninea } = req.body;
    if (name) restaurant.name = name;
    if (phone) restaurant.phone = phone;
    if (address) restaurant.address = address;
    if (managerName) restaurant.managerName = managerName;
    if (ninea) restaurant.ninea = ninea;

    if (req.files?.permis?.[0]) restaurant.permis = getCloudinaryUrl(req.files.permis[0]);
    if (req.files?.certificat?.[0]) restaurant.certificat = getCloudinaryUrl(req.files.certificat[0]);
    if (req.files?.autresDocs?.[0]) restaurant.autresDocs = getCloudinaryUrl(req.files.autresDocs[0]);
    if (req.files?.idCardCopy?.[0]) restaurant.idCardCopy = getCloudinaryUrl(req.files.idCardCopy[0]);
    if (req.files?.photo?.[0]) restaurant.photo = getCloudinaryUrl(req.files.photo[0]);

    await restaurant.save();
    res.status(200).json({ message: "Restaurant mis à jour avec succès", restaurant });
  } catch (error) {
    console.error("Erreur serveur (updateRestaurant):", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ==========================
// ✅ Supprimer / Bloquer / Débloquer
// ==========================
const deleteRestaurant = async (req, res) => {
  try {
    const deleted = await Restaurant.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Restaurant non trouvé." });
    res.status(200).json({ message: "Restaurant supprimé." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

const toggleBlockRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant introuvable." });

    restaurant.isBlocked = !restaurant.isBlocked;
    await restaurant.save();

    res.status(200).json({ message: `Restaurant ${restaurant.isBlocked ? "bloqué" : "débloqué"}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ==========================
// ✅ Gestion menu
// ==========================
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

const addMenuItem = async (req, res) => {
  const { name, description, price, supplements, quantity } = req.body;
  const file = req.file || (req.files?.image ? req.files.image[0] : null);

  if (!name || !description || !price || !file) {
    return res.status(400).json({ message: 'Tous les champs (nom, description, prix, image) sont requis.' });
  }

  let supplementsArray = [];
  if (supplements) {
    try {
      supplementsArray = typeof supplements === 'string' ? JSON.parse(supplements) : supplements;
    } catch (err) {
      return res.status(400).json({ message: 'Format des suppléments invalide.' });
    }
  }

  try {
    const restaurantId = req.user.userId;
    if (!restaurantId) return res.status(401).json({ message: "Non autorisé." });

    // Utilisation directe de l'URL Cloudinary depuis le fichier uploadé
    const imageUrl = file.path;

    const menuItem = new MenuItem({ 
      name, 
      description, 
      price: parseFloat(price), 
      image: imageUrl, 
      restaurantId,
      supplements: supplementsArray, // Ajout des suppléments ici
      quantity: quantity ? parseInt(quantity) : 1 // Ajout de la quantité (stock), défaut 1
    });
    
    await menuItem.save();

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      // Si le restaurant n'existe pas, supprimer l'item créé
      await MenuItem.findByIdAndDelete(menuItem._id);
      return res.status(404).json({ message: 'Restaurant non trouvé.' });
    }

    restaurant.menu.push(menuItem._id);
    await restaurant.save();

    res.status(201).json({ message: 'Plat ajouté.', menuItem });
  } catch (error) {
    console.error('Erreur addMenuItem:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getMenuByRestaurantId = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.params.restaurantId });
    res.status(200).json({ menu: menuItems });
  } catch (error) {
    console.error('Erreur getMenuByRestaurantId:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) return res.status(404).json({ message: 'Plat non trouvé.' });

    await MenuItem.findByIdAndDelete(req.params.id);
    await Restaurant.findByIdAndUpdate(req.user.userId, { $pull: { menu: req.params.id } });

    res.status(200).json({ message: 'Plat supprimé.' });
  } catch (error) {
    console.error('Erreur deleteMenuItem:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  const file = req.file || (req.files?.image ? req.files.image[0] : null);

  try {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) return res.status(404).json({ message: 'Plat non trouvé.' });

    // Vérifier que le plat appartient au restaurant connecté
    if (menuItem.restaurantId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Non autorisé à modifier ce plat.' });
    }

    // Mettre à jour les champs
    if (name) menuItem.name = name;
    if (description) menuItem.description = description;
    if (price) menuItem.price = parseFloat(price);
    
    // Mettre à jour l'image si un nouveau fichier est fourni
    if (file) {
      menuItem.image = file.path;
    }

    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Plat mis à jour avec succès.',
      menuItem
    });
  } catch (error) {
    console.error('Erreur updateMenuItem:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du plat.',
      error: error.message
    });
  }
};

// ==========================
// ✅ Mise à jour profil / mot de passe
// ====================
const updateRestaurantProfile = async (req, res) => {
  try {
    console.log("Corps de la requête:", req.body);
    console.log("Fichiers de la requête:", req.files);

    const restaurant = await Restaurant.findById(req.user.userId);
    if (!restaurant) return res.status(404).json({ message: "Restaurants non trouvé." });

    const { managerName, email, phone } = req.body;
    if (managerName) restaurant.managerName = managerName;
    if (email) restaurant.email = email;
    if (phone) restaurant.phone = phone;

    // Les fichiers sont automatiquement uploadés vers Cloudinary via CloudinaryStorage
    if (req.files?.permis?.[0]) {
      restaurant.permis = getCloudinaryUrl(req.files.permis[0]);
    }
    if (req.files?.certificat?.[0]) {
      restaurant.certificat = getCloudinaryUrl(req.files.certificat[0]);
    }
    if (req.files?.autresDocs?.[0]) {
      restaurant.autresDocs = getCloudinaryUrl(req.files.autresDocs[0]);
    }
    if (req.files?.idCardCopy?.[0]) {
      restaurant.idCardCopy = getCloudinaryUrl(req.files.idCardCopy[0]);
    }
    if (req.files?.photo?.[0]) {
      restaurant.photo = getCloudinaryUrl(req.files.photo[0]);
    }

    await restaurant.save();
    res.status(200).json({ message: "Profil mis à jour avec succès", restaurant });
  } catch (err) {
    console.error("Erreur updateRestaurantProfile:", err);
    res.status(500).json({ message: err.message || "Erreur serveur" });
  }
};


const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "Les deux mots de passe sont requis." });

  try {
    const restaurant = await Restaurant.findById(req.user.userId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant non trouvé." });

    const isMatch = await bcrypt.compare(currentPassword, restaurant.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe actuel incorrect." });

    restaurant.password = await bcrypt.hash(newPassword, 10);
    await restaurant.save();

    res.status(200).json({ message: "Mot de passe modifié avec succès." });
  } catch (err) {
    console.error("Erreur changement mot de passe:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ==========================
// ✅ Gestion tables
// ==========================
const createTable = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Le nom de la table est requis.' });

  try {
    const restaurantId = req.user.userId;

    // Générer l'URL pour le QR code
    const frontendUrl = process.env.FRONTEND_URL ; // Ajuster selon l'environnement
    const menuUrl = `${frontendUrl}/restaurant/${restaurantId}`; // Rediriger vers la liste des menus du restaurant client
    // const menuUrl1 = `${frontendUrl}/restaurant/${restaurantId}/menu`; 


    // Générer le QR code en base64
    const qrCodeDataURL = await QRCode.toDataURL(menuUrl);

    // Créer la table
    const newTable = new Table({
      name,
      qrCode: qrCodeDataURL,
      restaurantId
    });

    await newTable.save();

    // Ajouter la table au restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant non trouvé.' });

    restaurant.tables.push(newTable._id);
    await restaurant.save();

    res.status(201).json({ message: 'Table créée avec succès.', table: newTable });
  } catch (error) {
    console.error('Erreur createTable:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getTables = async (req, res) => {
  try {
    console.log('USER:', req.user);  // <-- Ajoute ça
    const restaurantId = req.user.userId;
    const tables = await Table.find({ restaurantId }).sort({ createdAt: -1 });
    res.status(200).json({ tables });
  } catch (error) {
    console.error('Erreur getTables:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};


const deleteTable = async (req, res) => {
  const { id } = req.params;

  try {
    const restaurantId = req.user.userId;

    // Vérifier que la table appartient au restaurant
    const table = await Table.findOne({ _id: id, restaurantId });
    if (!table) return res.status(404).json({ message: 'Table non trouvée.' });

    // Supprimer la table
    await Table.findByIdAndDelete(id);

    // Retirer la table du restaurant
    await Restaurant.findByIdAndUpdate(restaurantId, { $pull: { tables: id } });

    res.status(200).json({ message: 'Table supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur deleteTable:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ==========================
// ✅ Exports
// ==========================
module.exports = {
  preRegisterRestaurant,
  registerRestaurant,
  loginRestaurant,
  getRestaurantProfile,
  updateRestaurantStatus,
  getAllRestaurants,
  updateRestaurant,
  deleteRestaurant,
  toggleBlockRestaurant,
  getRestaurantMenu,
  addMenuItem,
  getMenuByRestaurantId,
  deleteMenuItem,
  updateRestaurantProfile,
  changePassword,
  getRestaurantById,
  updateMenuItem,
  createTable,
  getTables,
  deleteTable,
};
