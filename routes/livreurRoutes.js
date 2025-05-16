const express = require("express");
const multer = require("multer"); // Pour gérer les fichiers téléchargés
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const livreurController = require("../controllers/livreurController");

// Configuration de Multer pour le téléchargement des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Dossier où les fichiers seront enregistrés
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Routes publiques
router.post(
  "/register",
  upload.fields([
    { name: "idCardCopy", maxCount: 1 }, // Photocopie de la carte d'identité
    { name: "insuranceCopy", maxCount: 1 }, // Copie de l'assurance
  ]),
  livreurController.registerLivreur
);

// Routes protégées
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["livreur"]),
  livreurController.getLivreurProfile
);

// Routes administrateur
router.put(
  "/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  livreurController.updateLivreurStatus
);

module.exports = router;
