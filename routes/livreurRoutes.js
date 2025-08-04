const express = require("express");
const multer = require("multer");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const livreurController = require("../controllers/livreurController");

// Configuration multer pour upload fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// PHASE 1 - Préinscription
router.post("/pre-register", livreurController.preRegisterLivreur);

// PHASE 2 - Compléter inscription avec fichiers
router.post(
  "/register",
  upload.fields([
    { name: "idCardCopy", maxCount: 1 },
    { name: "insuranceCopy", maxCount: 1 },
  ]),
  livreurController.registerLivreur
);

// Profil livreur (token + rôle)
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["livreur"]),
  livreurController.getLivreurProfile
);
// Changer mot de passe livreur (livreur connecté)
router.put(
  '/password/change',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['livreur']),
  livreurController.changePassword
);



// Changer statut (admin)
router.put(
  "/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin", "livreur"]),
  livreurController.updateLivreurStatus
);
router.put(
  "/:id",
  upload.fields([
    { name: "idCardCopy", maxCount: 1 },
    { name: "insuranceCopy", maxCount: 1 },
  ]),
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin", "livreur"]),
  livreurController.updateLivreur
);

// Sans upload (doublon)
router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin", "livreur"]),
  livreurController.updateLivreur
);

// Récupérer tous les livreurs (admin)
router.get(
  "/all",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin", "livreur"]),
  livreurController.getAllLivreurs
);

// Modifier un livreur (admin)
router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin", "livreur"]),
  livreurController.updateLivreur
);

// Supprimer un livreur (admin)
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  livreurController.deleteLivreur
);

// Bloquer/débloquer un livreur (admin)
router.put(
  "/block/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  livreurController.toggleBlockLivreur
);

module.exports = router;
