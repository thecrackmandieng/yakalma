const nodemailer = require("nodemailer");
require("dotenv").config();

// Configuration du transporteur Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Style de base pour tous les emails
const baseEmailTemplate = (title, content) => `
  <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background: #5407e4; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0;">Yakalma</h1>
      <p style="margin: 5px 0 0;">Commande de restaurants & services</p>
    </div>
    <div style="padding: 30px; color: #333;">
      <h2 style="color: #5407e4;">${title}</h2>
      ${content}
      <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe Yakalma</strong></p>
    </div>
    <div style="background: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #888;">
      © ${new Date().getFullYear()} Yakalma. Tous droits réservés.
    </div>
  </div>
`;

// Templates d'emails
const emailTemplates = {
  adminRegistration: (data) =>
    baseEmailTemplate(
      `Bienvenue ${data.name} !`,
      `
        <p>Votre compte administrateur a été créé avec succès sur <strong>Yakalma</strong>.</p>
        <p>Voici les détails de votre compte :</p>
        <ul style="padding-left: 20px;">
          <li><strong>Nom :</strong> ${data.name}</li>
          <li><strong>Email :</strong> ${data.email}</li>
          <li><strong>Rôle :</strong> ${data.role}</li>
          <li><strong>Mot de passe temporaire :</strong> ${data.password}</li>
        </ul>
        <p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>
      `
    ),

  clientRegistration: (data) =>
    baseEmailTemplate(
      `Bienvenue ${data.name} !`,
      `
        <p>Votre compte a été créé avec succès sur <strong>Yakalma</strong>.</p>
        <p>Voici les détails de votre compte :</p>
        <ul style="padding-left: 20px;">
          <li><strong>Nom :</strong> ${data.name}</li>
          <li><strong>Email :</strong> ${data.email}</li>
          <li><strong>Mot de passe temporaire :</strong> ${data.password}</li>
        </ul>
        <p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>
      `
    ),

  livreurRegistration: (data) =>
    baseEmailTemplate(
      `Inscription reçue, ${data.name}`,
      `
        <p>Nous avons bien reçu votre inscription en tant que <strong>livreur</strong>.</p>
        <p>Notre équipe va examiner votre dossier dans les plus brefs délais.</p>
        <p>Nous vous contacterons une fois le processus terminé.</p>
      `
    ),

  livreurApproval: (data) =>
    baseEmailTemplate(
      `Félicitations ${data.name} !`,
      `
        <p>Votre inscription en tant que <strong>livreur</strong> a été approuvée avec succès !</p>
        <p>Vous pouvez désormais vous connecter à l'application et commencer à livrer les commandes.</p>
        <p>Bienvenue dans l'équipe <strong>Yakalma</strong> 🎉</p>
      `
    ),
};

// Service d'envoi d'email
const sendEmail = async (to, subject, templateKey, templateData) => {
  try {
    if (!emailTemplates[templateKey]) {
      throw new Error(`Le template d'email "${templateKey}" est introuvable.`);
    }

    // Utilisez le templateKey pour obtenir le bon template
    const emailContent = emailTemplates[templateKey](templateData);

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Yakalma" <no-reply@yakalma.com>',
      to,
      subject,
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email envoyé:", info.messageId);
    return info;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error.message);
    throw error;
  }
};

module.exports = {
  sendEmail,
  emailTemplates,
};
