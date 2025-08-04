const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Livreur = require("../models/Livreur");
const emailService = require("../services/email");

const JWT_SECRET = process.env.JWT_SECRET || "secret_dev";

// 🔐 Génère un mot de passe aléatoire
function generateRandomPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ✅ Étape 1 : Préinscription
const preRegisterLivreur = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "L'email est requis." });

  try {
    const existing = await Livreur.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email déjà utilisé." });

    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newLivreur = new Livreur({
      email,
      password: hashedPassword,
      role: "livreur",
      status: "incomplete"
    });

    await newLivreur.save();

    try {
      await emailService.sendEmail(email, "clientRegistration", {
        email,
        password: plainPassword
      });
    } catch (err) {
      console.error("❌ Erreur envoi email:", err.message);
    }

    res.status(201).json({ message: "Compte créé. Mot de passe envoyé par email." });
  } catch (err) {
    console.error("❌ Erreur serveur:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Étape 2 : Compléter le profil
const registerLivreur = async (req, res) => {
  const { name, email, phone, vehicleType, vehicleNumber } = req.body;

  if (!name || !email || !phone || !vehicleType || !vehicleNumber ||
    !req.files?.idCardCopy || !req.files?.insuranceCopy) {
    return res.status(400).json({ message: "Tous les champs et fichiers sont requis." });
  }

  try {
    const livreur = await Livreur.findOne({ email });
    if (!livreur) return res.status(404).json({ message: "Compte non trouvé." });

    livreur.name = name;
    livreur.phone = phone;
    livreur.vehicleType = vehicleType;
    livreur.vehicleNumber = vehicleNumber;
    livreur.idCardCopy = req.files.idCardCopy[0].path;
    livreur.insuranceCopy = req.files.insuranceCopy[0].path;
    livreur.status = "pending";

    await livreur.save();

    try {
      await emailService.sendEmail(email, "livreurRegistration", { name });
    } catch (err) {
      console.error("❌ Email non envoyé:", err.message);
    }

    res.status(200).json({ message: "Profil complété avec succès." });
  } catch (error) {
    console.error("❌ Erreur serveur:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Connexion livreur
const loginLivreur = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ message: "Email ou téléphone et mot de passe requis." });
  }

  try {
    const livreur = await Livreur.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });

    if (!livreur) return res.status(404).json({ message: "Livreur non trouvé." });

    const isMatch = await bcrypt.compare(password.trim(), livreur.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe incorrect." });

    const token = jwt.sign(
      { userId: livreur._id, role: livreur.role, status: livreur.status },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        _id: livreur._id,
        email: livreur.email,
        phone: livreur.phone,
        name: livreur.name,
        role: livreur.role,
        status: livreur.status
      }
    });
  } catch (err) {
    console.error("❌ Erreur login:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Récupération du profil connecté
// ✅ Récupération du profil connecté avec champs filtrés
const getLivreurProfile = async (req, res) => {
  try {
    const livreur = await Livreur.findById(req.user.userId).select("-password");
    if (!livreur) return res.status(404).json({ message: "Livreur non trouvé." });

    res.status(200).json({
      livreur: {
        id: livreur._id,
        name: livreur.name,
        email: livreur.email,
        phone: livreur.phone,
        vehicleNumber: livreur.vehicleNumber,
        vehicleType: livreur.vehicleType,
        status: livreur.status,
        idCardCopy: livreur.idCardCopy,
        insuranceCopy: livreur.insuranceCopy,
        createdAt: livreur.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Erreur get profile:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Mise à jour du profil du livreur connecté
const updateCurrentLivreur = async (req, res) => {
  try {
    const livreur = await Livreur.findById(req.user.userId);
    if (!livreur) return res.status(404).json({ message: "Livreur non trouvé." });

    if (req.body.name) livreur.name = req.body.name;
    if (req.body.phone) livreur.phone = req.body.phone;
    if (req.body.email) livreur.email = req.body.email;

    await livreur.save();
    res.status(200).json({ message: "Profil mis à jour." });
  } catch (err) {
    console.error("❌ Erreur updateCurrentLivreur:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Changer mot de passe
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const livreur = await Livreur.findById(req.user.userId);
    if (!livreur) return res.status(404).json({ message: "Livreur non trouvé." });

    const isMatch = await bcrypt.compare(currentPassword, livreur.password);
    if (!isMatch) return res.status(401).json({ message: "Mot de passe actuel incorrect." });

    const hashed = await bcrypt.hash(newPassword, 10);
    livreur.password = hashed;
    await livreur.save();

    res.status(200).json({ message: "Mot de passe mis à jour." });
  } catch (err) {
    console.error("❌ Erreur changement mot de passe:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Mise à jour d'un livreur (admin)
const updateLivreur = async (req, res) => {
  const { id } = req.params;

  try {
    const livreur = await Livreur.findById(id);
    if (!livreur) return res.status(404).json({ message: "Livreur non trouvé." });

    if (req.body.name) livreur.name = req.body.name;
    if (req.body.phone) livreur.phone = req.body.phone;
    if (req.body.vehicleType) livreur.vehicleType = req.body.vehicleType;
    if (req.body.vehicleNumber) livreur.vehicleNumber = req.body.vehicleNumber;

    if (req.files?.idCardCopy?.[0]) livreur.idCardCopy = req.files.idCardCopy[0].path;
    if (req.files?.insuranceCopy?.[0]) livreur.insuranceCopy = req.files.insuranceCopy[0].path;

    await livreur.save();
    res.status(200).json({ message: "Livreur mis à jour avec succès", livreur });
  } catch (error) {
    console.error("❌ Erreur updateLivreur:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Changer le statut d’un livreur
const updateLivreurStatus = async (req, res) => {
  const { livreurId, status } = req.body;
  const allowed = ["pending", "approved", "rejected", "blocked", "incomplete"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const livreur = await Livreur.findById(livreurId);
    if (!livreur) return res.status(404).json({ message: "Livreur non trouvé." });

    livreur.status = status;
    await livreur.save();

    try {
      if (status === "approved") {
        await emailService.sendEmail(livreur.email, "livreurApproval", { name: livreur.name });
      } else if (status === "rejected") {
        await emailService.sendEmail(livreur.email, "livreurRejection", { name: livreur.name });
      }
    } catch (err) {
      console.error("❌ Email non envoyé:", err.message);
    }

    res.status(200).json({ message: `Statut mis à jour: ${status}` });
  } catch (error) {
    console.error("❌ Erreur update status:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Liste des livreurs
const getAllLivreurs = async (req, res) => {
  try {
    const livreurs = await Livreur.find().select("-password");
    res.status(200).json({ livreurs });
  } catch (error) {
    console.error("❌ Erreur getAll:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Supprimer un livreur
const deleteLivreur = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Livreur.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Livreur non trouvé." });
    res.status(200).json({ message: "Livreur supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur delete:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


// ✅ Bloquer / Débloquer
const toggleBlockLivreur = async (req, res) => {
  const { id } = req.params;

  try {
    const livreur = await Livreur.findById(id);
    if (!livreur) return res.status(404).json({ message: "Livreur introuvable." });

    livreur.status = livreur.status === "blocked" ? "approved" : "blocked";
    await livreur.save();

    res.status(200).json({ message: `Livreur ${livreur.status === "blocked" ? "bloqué" : "débloqué"}` });
  } catch (error) {
    console.error("❌ Erreur toggle block:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ✅ Exports
module.exports = {
  preRegisterLivreur,
  registerLivreur,
  loginLivreur,
  getLivreurProfile,
  updateCurrentLivreur,
  changePassword,
  updateLivreurStatus,
  getAllLivreurs,
  updateLivreur,
  deleteLivreur,
  toggleBlockLivreur
};
