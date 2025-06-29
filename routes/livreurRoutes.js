// ✅ routes/livreurRoutes.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const livreurController = require("../controllers/livreurController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// 📌 Inscription
router.post("/register",
  upload.fields([
    { name: "idCardCopy", maxCount: 1 },
    { name: "insuranceCopy", maxCount: 1 },
  ]),
  livreurController.registerLivreur
);

// 📌 Profil
router.get("/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["livreur"]),
  livreurController.getLivreurProfile
);

// 📌 Admin seulement
router.put("/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  livreurController.updateLivreurStatus
);

router.get("/all",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  livreurController.getAllLivreurs
);

router.put("/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  livreurController.updateLivreur
);

router.delete("/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  livreurController.deleteLivreur
);

router.put("/block/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  livreurController.toggleBlockLivreur
);

module.exports = router;
