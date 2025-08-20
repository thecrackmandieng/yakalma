const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { sendEmail } = require("../services/email");

// Ajoute ces modèles pour les stats dashboard :
const Order = require("../models/order.model");
const Restaurant = require("../models/Restaurant");
const Livreur = require("../models/Livreur");
const Client = require("../models/Client");

const JWT_SECRET = process.env.JWT_SECRET || "secretKey";

function generateRandomPassword(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// =====================
// Auth Admin
// =====================

// Connexion Admin
exports.loginAdmin = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ message: "Email/téléphone et mot de passe requis." });
  }

  try {
    const admin = await Admin.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!admin) return res.status(401).json({ message: "Administrateur non trouvé." });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect." });

    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Connexion réussie.",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Inscription Super Admin
exports.registerSuperAdmin = async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) return res.status(400).json({ message: "Tous les champs sont requis." });

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Un administrateur avec cet email existe déjà." });

    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ name, email, password: hashedPassword, role });
    await newAdmin.save();

    try {
      await sendEmail(email, "adminRegistration", { name, email, role, password });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", emailError);
    }

    res.status(201).json({ message: "Super administrateur inscrit avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Inscription Admin normal
exports.registerAdmin = async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) return res.status(400).json({ message: "Tous les champs sont requis." });

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Un administrateur avec cet email existe déjà." });

    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ name, email, password: hashedPassword, role });
    await newAdmin.save();

    try {
      await sendEmail(email, "adminRegistration", { name, email, role, password });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", emailError);
    }

    res.status(201).json({ message: "Administrateur inscrit avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// =====================
// Admin Profil & Gestion
// =====================

// Récupérer profil admin
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId).select("-password");
    if (!admin) return res.status(404).json({ message: "Administrateur non trouvé." });
    res.status(200).json({ admin });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Modifier profil admin
exports.updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { name, email, phone } = req.body;

    if (!name || !email) return res.status(400).json({ message: "Le nom et l'email sont requis." });

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { name, email, phone },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedAdmin) return res.status(404).json({ message: "Administrateur non trouvé." });

    res.status(200).json({ message: "Profil mis à jour avec succès.", admin: updatedAdmin });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Changer mot de passe admin
exports.changePasswordAdmin = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Ancien et nouveau mot de passe requis." });

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Administrateur non trouvé." });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Ancien mot de passe incorrect." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({ message: "Mot de passe modifié avec succès." });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Supprimer un admin
exports.deleteAdmin = async (req, res) => {
  const adminId = req.params.id;

  try {
    const deleted = await Admin.findByIdAndDelete(adminId);
    if (!deleted) return res.status(404).json({ message: "Administrateur non trouvé." });

    res.status(200).json({ message: "Administrateur supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'admin :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer tous les admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.status(200).json({ admins });
  } catch (error) {
    console.error("Erreur lors de la récupération des administrateurs:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Modifier un admin (par superadmin)
exports.updateAdmin = async (req, res) => {
  const adminId = req.params.id;
  const { name, email, role, phone } = req.body;

  if (!name || !email ) return res.status(400).json({ message: "Tous les champs sont requis." });

  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { name, email, role, phone },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedAdmin) return res.status(404).json({ message: "Administrateur non trouvé." });

    res.status(200).json({ message: "Administrateur mis à jour avec succès.", admin: updatedAdmin });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'admin :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// =====================
// Dashboard Admin
// =====================
exports.getAdminDashboardData = async (req, res) => {
  try {
    // Statistiques globales
    const totalOrders = await Order.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalCouriers = await Livreur.countDocuments();
    const totalUsers = await Client.countDocuments();
    const totalAdmins = await Admin.countDocuments();

    // Liste des admins
    const admins = await Admin.find().select('name email role isActive');

    // Historique des commandes (nombre de commandes par mois)
    const ordersHistory = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Répartition utilisateurs (clients, livreurs, admins)
    const userDistribution = [
      { role: 'admin', count: totalAdmins },
      { role: 'livreur', count: totalCouriers },
      { role: 'client', count: totalUsers }
    ];

    // 🔹 Montant total des commandes livrées
    const totalPaymentsAgg = await Order.aggregate([
      { $match: { status: 'livre' } },
      { $group: { _id: null, totalPayments: { $sum: '$totalAmount' } } }
    ]);
    const totalPayments = totalPaymentsAgg[0]?.totalPayments || 0;

    res.json({
      stats: {
        totalOrders,
        totalRestaurants,
        totalCouriers,
        totalUsers,
        totalAdmins,
        totalPayments // <- ajouté pour le dashboard
      },
      admins,
      ordersHistory,
      userDistribution
    });
  } catch (error) {
    console.error("Erreur getAdminDashboardData:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
