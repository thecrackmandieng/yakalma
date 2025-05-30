const bcrypt = require("bcrypt");
const Livreur = require("../models/Livreur");
const emailService = require("../services/email");

// Register a new Livreur with document validation
exports.registerLivreur = async (req, res) => {
  const { name, email, phone, vehicleType, vehicleNumber, password } = req.body;

  // Validation des champs requis
  if (!name || !email || !phone || !vehicleType || !vehicleNumber || !password) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  // Vérifie que les fichiers requis sont présents
  if (!req.files || !req.files.idCardCopy || !req.files.insuranceCopy) {
    return res.status(400).json({
      message: "Les pièces jointes (carte d'identité et assurance) sont requises.",
    });
  }

  try {
    const existingLivreur = await Livreur.findOne({ email });
    if (existingLivreur) {
      return res.status(400).json({ message: "Un livreur avec cet email existe déjà." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newLivreur = new Livreur({
      name,
      email,
      phone,
      password: hashedPassword,
      vehicleType,
      vehicleNumber,
      idCardCopy: req.files.idCardCopy[0].path,
      insuranceCopy: req.files.insuranceCopy[0].path,
      status: "pending",
    });

    await newLivreur.save();

    // ✅ Appel correct du service d'email
    await emailService.sendEmail(
      email,
      "Inscription en attente de validation",
      "livreurRegistration",
      { name }
    );

    res.status(201).json({
      message: "Inscription réussie. Votre compte est en attente de validation par notre équipe.",
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Get the profile of a Livreur
exports.getLivreurProfile = async (req, res) => {
  try {
    const livreur = await Livreur.findById(req.user.userId).select("-password");
    if (!livreur) {
      return res.status(404).json({ message: "Livreur non trouvé." });
    }
    res.status(200).json({ livreur });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Update the status of a Livreur (admin only)
exports.updateLivreurStatus = async (req, res) => {
  const { livreurId, status } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const livreur = await Livreur.findById(livreurId);
    if (!livreur) {
      return res.status(404).json({ message: "Livreur non trouvé." });
    }

    livreur.status = status;
    await livreur.save();

    // Notification par email
    if (status === "approved") {
      await emailService.sendEmail(
        livreur.email,
        "Votre compte a été approuvé",
        "livreurApproval",
        { name: livreur.name }
      );
    } else if (status === "rejected") {
      await emailService.sendEmail(
        livreur.email,
        "Votre demande d'inscription a été rejetée",
        "livreurRejection",
        { name: livreur.name }
      );
    }

    res.status(200).json({ message: `Statut mis à jour: ${status}` });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};
