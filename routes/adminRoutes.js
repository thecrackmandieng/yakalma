const express = require('express');
const bcrypt = require('bcrypt'); // Importer bcrypt pour le hachage
const nodemailer = require('nodemailer'); // Importer Nodemailer pour l'envoi d'emails
const Admin = require('../models/Admin'); // Importer le modèle Admin
const router = express.Router();

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Utilisez 'gmail', 'outlook', ou un autre service
  auth: {
    user: 'moustaphadieng0405@gmail.com', // Remplacez par votre email
    pass: 'urdcyxdkubgalvrf', // Remplacez par votre clé d'application
  },
});

// Exemple : Inscription d'un administrateur
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validation des champs requis
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    // Hacher le mot de passe avant de l'enregistrer
    const hashedPassword = await bcrypt.hash(password, 10); // 10 est le nombre de "salt rounds"

    // Création d'un nouvel administrateur avec le mot de passe haché
    const newAdmin = new Admin({ name, email, password: hashedPassword, role });
    await newAdmin.save(); // Enregistrer dans la base de données

    // Envoyer un email de confirmation
    const mailOptions = {
      from: 'votre-email@gmail.com', // Remplacez par votre email
      to: email, // Email de l'administrateur
      subject: 'Confirmation d\'inscription',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color:rgba(84, 7, 228, 0.79);">Bonjour ${name},</h2>
          <p>Votre compte a été créé avec succès sur la plateforme <strong>Yakalma</strong>.</p>
          <p>Voici les détails de votre compte :</p>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Nom :</strong> ${name}</li>
            <li><strong>Email :</strong> ${email}</li>
            <li><strong>Mot de passe :</strong> ${password}</li>
            <li><strong>Rôle :</strong> ${role}</li>
          </ul>
          <p>Vous pouvez maintenant vous connecter et commencer à utiliser nos services.</p>
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
      res.status(201).json({ message: 'Administrateur enregistré avec succès. Un email de confirmation a été envoyé.', admin: newAdmin });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'administrateur.', error });
  }
});

// Exemple : Liste des administrateurs
router.get('/', async (req, res) => {
  try {
    const admins = await Admin.find(); // Récupérer tous les administrateurs
    res.status(200).json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des administrateurs.', error });
  }
});

module.exports = router;