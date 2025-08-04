const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier 'uploads' s'il n'existe pas
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Ici on précise les champs fichiers attendus côté backend,
// en mettant les mêmes noms que ceux dans le formulaire HTML Angular
const uploadFields = upload.fields([
  { name: 'permis', maxCount: 1 },
  { name: 'certificat', maxCount: 1 },
  { name: 'autresDocs', maxCount: 1 },
  { name: 'idCardCopy', maxCount: 1 }, // Ajout du champ idCardCopy
  { name: 'photo', maxCount: 1 } // Ajout du champ insuranceCopy pour les livreurs
]);

module.exports = uploadFields;
