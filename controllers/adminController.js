const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const { sendEmail, emailTemplates } = require("../services/email");

// Inscription d'un administrateur
exports.registerAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validation des champs requis
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    // Vérifier si un admin avec cet email existe déjà
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Un administrateur avec cet email existe déjà." });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création d'un nouvel administrateur avec le mot de passe haché
    const newAdmin = new Admin({ name, email, password: hashedPassword, role });
    await newAdmin.save(); // Enregistrement dans la base de données

    // Envoi de l'email de confirmation via le service
    try {
      await sendEmail(
        email,
        "Confirmation d'inscription",
        emailTemplates.adminRegistration(name, email, role)
      );
    } catch (emailError) {
      console.error(
        "Erreur lors de l'envoi de l'email de confirmation:",
        emailError
      );
      // Ne bloque pas l'inscription si l'email échoue
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
