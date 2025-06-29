// ✅ controllers/livreurController.js
const bcrypt = require("bcrypt");
const Livreur = require("../models/Livreur");
const emailService = require("../services/email");

// Register a new Livreur
exports.registerLivreur = async (req, res) => {
  const { name, email, phone, vehicleType, vehicleNumber, password } = req.body;

  if (!name || !email || !phone || !vehicleType || !vehicleNumber || !password || !req.files || !req.files.idCardCopy || !req.files.insuranceCopy) {
    return res.status(400).json({ message: "Tous les champs et fichiers requis doivent être fournis." });
  }

  try {
    const existingLivreur = await Livreur.findOne({ email });
    if (existingLivreur) return res.status(400).json({ message: "Livreur déjà existant." });

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
    await emailService.sendEmail(email, "Inscription en attente", "livreurRegistration", { name });

    res.status(201).json({ message: "Inscription réussie." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.getLivreurProfile = async (req, res) => {
  try {
    const livreur = await Livreur.findById(req.user.userId).select("-password");
    if (!livreur) return res.status(404).json({ message: "Livreur non trouvé." });
    res.status(200).json({ livreur });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.updateLivreurStatus = async (req, res) => {
  const { livreurId, status } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const livreur = await Livreur.findById(livreurId);
    if (!livreur) return res.status(404).json({ message: "Livreur non trouvé." });

    livreur.status = status;
    await livreur.save();

    const subject = status === "approved" ? "Compte approuvé" : "Inscription rejetée";
    const template = status === "approved" ? "livreurApproval" : "livreurRejection";
    await emailService.sendEmail(livreur.email, subject, template, { name: livreur.name });

    res.status(200).json({ message: `Statut mis à jour: ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.getAllLivreurs = async (req, res) => {
  try {
    const livreurs = await Livreur.find().select("-password");
    res.status(200).json({ livreurs });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.updateLivreur = async (req, res) => {
  const { id } = req.params;
  const { name, phone, vehicleType, vehicleNumber } = req.body;

  try {
    const livreur = await Livreur.findByIdAndUpdate(id, { name, phone, vehicleType, vehicleNumber }, { new: true });
    if (!livreur) return res.status(404).json({ message: "Livreur non trouvé." });
    res.status(200).json({ message: "Livreur mis à jour", livreur });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.deleteLivreur = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Livreur.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ message: "Livreur non trouvé." });
    res.status(200).json({ message: "Livreur supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.toggleBlockLivreur = async (req, res) => {
  const { id } = req.params;

  try {
    const livreur = await Livreur.findById(id);
    if (!livreur) return res.status(404).json({ message: "Livreur introuvable." });

    livreur.status = livreur.status === "blocked" ? "approved" : "blocked";
    await livreur.save();

    res.status(200).json({ message: `Livreur ${livreur.status === "blocked" ? "bloqué" : "débloqué"}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};