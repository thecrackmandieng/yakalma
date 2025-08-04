const express = require("express");
const multer = require("multer");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const authMiddleware = require("../middlewares/authMiddleware");

// 📂 Multer configuration pour upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ========== PHASE 1: Préinscription ==========
router.post("/pre-register", restaurantController.preRegisterRestaurant);


// ========== PHASE 2: Enregistrement complet ==========
router.post(
  "/register",
  upload.fields([
    { name: "permis", maxCount: 1 },
    { name: "certificat", maxCount: 1 },
    { name: "autresDocs", maxCount: 1 },
    { name: "idCardCopy", maxCount: 1 }, 
    { name: "photo", maxCount: 1 }
  ]),
  restaurantController.registerRestaurant
);

// ========== AUTH - PROFIL RESTAURANT ==========
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.getRestaurantProfile
);

router.put(
  "/profile",
  upload.fields([
    { name: "permis", maxCount: 1 },
    { name: "certificat", maxCount: 1 },
    { name: "autresDocs", maxCount: 1 },
    { name: "idCardCopy", maxCount: 1 },
    { name: "photo", maxCount: 1 }
  ]),
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.updateRestaurantProfile
);

router.put(
  "/password/change",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.changePassword
);

// ========== ADMIN / SUPERADMIN - GESTION DES RESTAURANTS ==========
router.get(
  "/all",

  restaurantController.getAllRestaurants
);

router.put(
  "/update/:id",
  upload.fields([
    { name: "permis", maxCount: 1 },
    { name: "certificat", maxCount: 1 },
    { name: "autresDocs", maxCount: 1 },
    { name: "idCardCopy", maxCount: 1 },
    { name: "photo", maxCount: 1 }
  ]),
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.updateRestaurant
);

router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.deleteRestaurant
);

router.put(
  "/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.updateRestaurantStatus
);

router.put(
  "/block/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.toggleBlockRestaurant
);

// ========== MENU - POUR LES RESTAURANTS CONNECTÉS ==========
router.get(
  "/menu/restaurant/:restaurantId",
  restaurantController.getMenuByRestaurantId
);
router.get(
  "/menu",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.getRestaurantMenu
);

router.post(
  "/menu",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  upload.single("image"),
  restaurantController.addMenuItem
);

router.delete(
  "/menu/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.deleteMenuItem
);
// --- Ajout de la route pour récupérer un restaurant par ID ---
router.get(
  "/:id",
  restaurantController.getRestaurantById
);

module.exports = router;