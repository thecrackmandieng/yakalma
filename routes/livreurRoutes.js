const express = require('express');
const multer = require('multer'); // Pour gérer les fichiers téléchargés
const bcrypt = require('bcrypt'); // Pour hacher les mots de passe
const nodemailer = require('nodemailer'); // Pour envoyer des emails
const Livreur = require('../models/Livreur'); // Importer le modèle Livreur
const router = express.Router();

// Configuration de Multer pour le téléchargement des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier où les fichiers seront enregistrés
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'moustaphadieng0405@gmail.com', // Remplacez par votre email
    pass: 'urdcyxdkubgalvrf', // Remplacez par votre clé d'application
  },
});

// Exemple : Inscription d'un livreur avec validation des pièces jointes
router.post('/register', upload.fields([
  { name: 'idCardCopy', maxCount: 1 }, // Photocopie de la carte d'identité
  { name: 'insuranceCopy', maxCount: 1 } // Copie de l'assurance
]), async (req, res) => {
  const { name, email, phone, vehicleType, vehicleNumber, password } = req.body;

  // Validation des champs requis
  if (!name || !email || !phone || !vehicleType || !vehicleNumber || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  // Vérifier si les fichiers requis ont été téléchargés
  if (!req.files || !req.files.idCardCopy || !req.files.insuranceCopy) {
    return res.status(400).json({ message: 'Les pièces jointes (carte d\'identité et assurance) sont requises.' });
  }

  try {
    // Vérifier si un livreur avec cet email existe déjà
    const existingLivreur = await Livreur.findOne({ email });
    if (existingLivreur) {
      return res.status(400).json({ message: 'Un livreur avec cet email existe déjà.' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10); // 10 est le nombre de "salt rounds"

    // Création d'un nouveau livreur
    const newLivreur = new Livreur({
      name,
      email,
      phone,
      vehicleType,
      vehicleNumber,
      password: hashedPassword, // Enregistrer le mot de passe haché
      idCardCopy: req.files.idCardCopy[0].path, // Chemin de la photocopie de la carte d'identité
      insuranceCopy: req.files.insuranceCopy[0].path, // Chemin de la copie de l'assurance
    });

    await newLivreur.save(); // Enregistrer dans la base de données

// Envoyer un email de confirmation
const mailOptions = {
  from: 'votre-email@gmail.com', // Remplacez par votre email
  to: email, // Email du livreur
  subject: 'Inscription réussie',
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color:rgba(84, 7, 228, 0.79);">Bonjour ${name},</h2>
      <p>Votre compte de livreur a été créé avec succès sur la plateforme <strong>Yakalma</strong>.</p>
      <p>Voici vos informations de connexion :</p>
      <ul>
        <li><strong>Email :</strong> ${email}</li>
        <li><strong>Mot de passe :</strong> ${password}</li>
      </ul>
      <p>Vous pouvez maintenant vous connecter avec ces informations.</p>
      <p style="margin-top: 20px;">Cordialement,</p>
      <p><strong>L'équipe Yakalma</strong></p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">Cet email est généré automatiquement, merci de ne pas y répondre.</p>
    </div>
  `,
};


    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur lors de l\'envoi de l\'email :', error);
        return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de confirmation.', error });
      }
      console.log('Email envoyé :', info.response);
      res.status(201).json({ message: 'Livreur enregistré avec succès. Un email de confirmation a été envoyé.', livreur: newLivreur });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement du livreur.', error });
  }
});

module.exports = router;