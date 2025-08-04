const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ Transporteur SMTP via Gmail (ou autre si configuré)
const transporter = nodemailer.createTransport({
  service: "gmail", // ou 'smtp.mailtrap.io', 'hotmail', etc.
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ Template HTML de base
const baseEmailTemplate = (title, content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;">
    <div style="background: #5407e4; padding: 20px; text-align: center; color: white;">
      <h1>Yakalma</h1>
      <p>Commande de restaurants & services</p>
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

// ✅ Templates d’emails
const emailTemplates = {
  // --- CLIENT ---
  clientRegistration: (data) =>
    baseEmailTemplate(
      `Bienvenue ${data.email} !`,
      `
        <p>Votre compte a été créé avec succès sur <strong>Yakalma</strong>.</p>
        <p>Voici votre mot de passe temporaire :</p>
        <pre style="font-weight: bold; font-size: 18px; background: #eee; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-break: break-word;">
${data.password}
        </pre>
        <p>Merci de le changer dès votre première connexion.</p>
      `
    ),

  // --- LIVREUR ---
  livreurRegistration: (data) =>
    baseEmailTemplate(
      `Inscription reçue, ${data.name || "livreur"}`,
      `
        <p>Nous avons bien reçu votre inscription en tant que <strong>livreur</strong>.</p>
        <p>Notre équipe examine votre profil.</p>
      `
    ),

  livreurApproval: (data) =>
    baseEmailTemplate(
      `Félicitations ${data.name} !`,
      `
        <p>Votre inscription a été <strong>approuvée</strong>.</p>
        <p>Bienvenue dans l'équipe <strong>Yakalma</strong> 🎉</p>
      `
    ),

  livreurRejection: (data) =>
    baseEmailTemplate(
      `Inscription refusée`,
      `
        <p>Bonjour ${data.name || "livreur"},</p>
        <p>Votre inscription a été <strong>rejetée</strong>.</p>
        <p>Merci de contacter notre support si besoin.</p>
      `
    ),

  // --- RESTAURANT ---
  restaurantRegistration: (data) =>
    baseEmailTemplate(
      `Bienvenue ${data.email} !`,
      `
        <p>Votre compte restaurant a été créé sur <strong>Yakalma</strong>.</p>
        <p>Mot de passe temporaire :</p>
        <pre style="font-weight: bold; font-size: 18px; background: #eee; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-break: break-word;">
${data.password}
        </pre>
        <p>Merci de le changer dès votre première connexion.</p>
      `
    ),

  restaurantProfileCompleted: (data) =>
    baseEmailTemplate(
      `Inscription en attente, ${data.name || "restaurant"}`,
      `
        <p>Nous avons bien reçu tous vos documents.</p>
        <p>Votre inscription est en attente de validation.</p>
      `
    ),

  restaurantApproved: (data) =>
    baseEmailTemplate(
      `Inscription validée 🎉`,
      `
        <p>Bonjour ${data.name},</p>
        <p>Votre restaurant est désormais <strong>approuvé</strong>.</p>
        <p>Vous pouvez maintenant accéder à votre espace.</p>
      `
    ),

  restaurantRejected: (data) =>
    baseEmailTemplate(
      `Inscription refusée`,
      `
        <p>Bonjour ${data.name || "restaurant"},</p>
        <p>Votre demande d'inscription a été <strong>rejetée</strong>.</p>
        <p>Merci de contacter notre support pour en savoir plus.</p>
      `
    ),
};

// ✅ Sujets d'emails
const emailSubjects = {
  // CLIENT
  clientRegistration: "Votre mot de passe pour finaliser votre inscription",

  // LIVREUR
  livreurRegistration: "Votre inscription est en cours de traitement",
  livreurApproval: "Votre inscription a été approuvée !",
  livreurRejection: "Mise à jour de votre inscription",

  // RESTAURANT
  restaurantRegistration: "Votre mot de passe pour compléter votre inscription",
  restaurantProfileCompleted: "Votre profil est en cours de validation",
  restaurantApproved: "Votre restaurant est validé 🎉",
  restaurantRejected: "Inscription restaurant rejetée",
};

// ✅ Fonction d'envoi d’email
const sendEmail = async (to, templateKey, templateData) => {
  try {
    const templateFn = emailTemplates[templateKey];
    if (!templateFn) throw new Error(`Template email "${templateKey}" introuvable.`);

    const htmlContent = templateFn(templateData);
    const subject = emailSubjects[templateKey] || "Notification Yakalma";

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Yakalma" <no-reply@yakalma.com>',
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Email envoyé à ${to} : ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error.message);
    throw error;
  }
};

module.exports = { sendEmail };
