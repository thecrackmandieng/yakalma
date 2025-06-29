const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const { sendEmail, emailTemplates } = require("../services/email");

// Fonction pour générer un mot de passe aléatoire
function generateRandomPassword(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Inscription initiale du super administrateur
exports.registerSuperAdmin = async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Un administrateur avec cet email existe déjà." });
    }

    // Générer un mot de passe aléatoire
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ name, email, password: hashedPassword, role });
    await newAdmin.save();

    // Envoyer un email de confirmation avec le mot de passe généré
    try {
      await sendEmail(
        email,
        "Confirmation d'inscription",
        emailTemplates.adminRegistration(name, email, role, password)
      );
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", emailError);
    }

    res.status(201).json({ message: "Super administrateur inscrit avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Inscription d'un administrateur
exports.registerAdmin = async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Un administrateur avec cet email existe déjà." });
    }

    // Générer un mot de passe aléatoire
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ name, email, password: hashedPassword, role });
    await newAdmin.save();

    // Envoyer un email de confirmation avec le mot de passe généré
    try {
      await sendEmail(
        email,
        "Confirmation d'inscription",
        emailTemplates.adminRegistration(name, email, role, password)
      );
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", emailError);
    }

    res.status(201).json({ message: "Administrateur inscrit avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Obtenir le profil d'un administrateur
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.userId).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Administrateur non trouvé." });
    }
    res.status(200).json({ admin });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Obtenir la liste des administrateurs (pour super admin)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.status(200).json({ admins });
  } catch (error) {
    console.error("Erreur lors de la récupération des administrateurs:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};
