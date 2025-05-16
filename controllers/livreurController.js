const bcrypt = require("bcrypt");
const Livreur = require("../models/Livreur");
const emailService = require("../services/email");

// Inscription d'un livreur avec validation des pièces jointes
exports.registerLivreur = async (req, res) => {
  const { name, email, phone, vehicleType, vehicleNumber, password } = req.body;

  // Validation des champs requis
  if (
    !name ||
    !email ||
    !phone ||
    !vehicleType ||
    !vehicleNumber ||
    !password
  ) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  // Vérifier si les fichiers requis ont été téléchargés
  if (!req.files || !req.files.idCardCopy || !req.files.insuranceCopy) {
    return res.status(400).json({
      message:
        "Les pièces jointes (carte d'identité et assurance) sont requises.",
    });
  }

  try {
    // Vérifier si un livreur avec cet email existe déjà
    const existingLivreur = await Livreur.findOne({ email });
    if (existingLivreur) {
      return res
        .status(400)
        .json({ message: "Un livreur avec cet email existe déjà." });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouveau livreur avec les informations fournies
    const newLivreur = new Livreur({
      name,
      email,
      phone,
      vehicle: {
        type: vehicleType,
        number: vehicleNumber,
      },
      password: hashedPassword,
      documents: {
        idCard: req.files.idCardCopy[0].path,
        insurance: req.files.insuranceCopy[0].path,
      },
      status: "pending", // Le livreur est en attente de validation
    });

    // Enregistrer le livreur dans la base de données
    await newLivreur.save();

    // Envoyer un email de confirmation
    await emailService.sendEmail(
      email,
      "Inscription en attente de validation",
      emailService.emailTemplates.livreurRegistration(name)
    );

    res.status(201).json({
      message:
        "Inscription réussie. Votre compte est en attente de validation par notre équipe.",
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Obtenir le profil d'un livreur
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

// Mettre à jour le statut d'un livreur (pour les administrateurs)
exports.updateLivreurStatus = async (req, res) => {
  const { livreurId, status } = req.body;

  // Vérifier si le statut est valide
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

    // Envoyer un email de notification au livreur
    // Envoyer un email de notification selon le statut
    if (status === "approved") {
      await emailService.sendEmail(
        livreur.email,
        "Votre compte a été approuvé",
        emailService.emailTemplates.livreurApproval(livreur.name)
      );
    } else if (status === "rejected") {
      await emailService.sendEmail(
        livreur.email,
        "Votre demande d'inscription a été rejetée",
        emailService.emailTemplates.livreurRejection(livreur.name)
      );
    }
    res
      .status(200)
      .json({ message: `Le statut du livreur a été mis à jour: ${status}` });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};
