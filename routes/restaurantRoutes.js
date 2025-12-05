const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const authMiddleware = require("../middlewares/authMiddleware");

// 📂 Configuration CloudinaryStorage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folderName = "yakalma/restaurants";
    const fieldName = file.fieldname;

    return {
      folder: `${folderName}/${fieldName}`,
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
      public_id: `${fieldName}-${Date.now()}`,
      resource_type: "auto",
    };
  },
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
    { name: "photo", maxCount: 1 },
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
    { name: "photo", maxCount: 1 },
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

// ========== ADMIN / SUPERADMIN ==========
router.get("/all", restaurantController.getAllRestaurants);

router.put(
  "/update/:id",
  upload.fields([
    { name: "permis", maxCount: 1 },
    { name: "certificat", maxCount: 1 },
    { name: "autresDocs", maxCount: 1 },
    { name: "idCardCopy", maxCount: 1 },
    { name: "photo", maxCount: 1 },
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

// ========== MENU ==========
router.get("/menu/restaurant/:restaurantId", restaurantController.getMenuByRestaurantId);

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

router.put(
  "/menu/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  upload.single("image"),
  restaurantController.updateMenuItem
);

// ========== TABLES (PLACÉ AVANT /:id POUR ÉVITER LE BUG) ==========
router.post(
  "/tables",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.createTable
);

router.get(
  "/tables",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.getTables
);

router.delete(
  "/tables/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.deleteTable
);

// ========== FIN — ROUTE DYNAMIQUE À LA FIN ==========
router.get("/:id", restaurantController.getRestaurantById);

module.exports = router;
