// middleware/upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Créer un dossier dynamique selon le champ (ex: permis, certificat, etc.)
    return {
      folder: "yakalma/" + file.fieldname,
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

const upload = multer({ storage });

// Définir les champs multiples comme tu l'avais fait
const uploadFields = upload.fields([
  { name: "permis", maxCount: 1 },
  { name: "certificat", maxCount: 1 },
  { name: "autresDocs", maxCount: 1 },
  { name: "idCardCopy", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);

module.exports = uploadFields;
