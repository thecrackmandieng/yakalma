const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

// 📌 Enregistrement d'un restaurant
router.post(
  "/register",
  upload.fields([
    { name: 'idCardCopy', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'legalDocuments', maxCount: 1 },
    { name: 'tradeRegister', maxCount: 1 }
  ]),
  restaurantController.registerRestaurant
);

// 📌 Obtenir le profil (restaurant connecté)
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.getRestaurantProfile
);

// ✅ Lister tous les restaurants (admin only)
router.get(
  "/all",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.getAllRestaurants
);

// ✅ Modifier un restaurant (admin only)
router.put(
  "/block/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.updateRestaurant
);

// ✅ Supprimer un restaurant (admin only)
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.deleteRestaurant
);

// ✅ Bloquer un restaurant (admin only)
router.put(
  "/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["admin"]),
  restaurantController.updateRestaurantStatus // <-- est-ce bien importé ?
);


// ✅ Mettre à jour le statut d’un restaurant
router.put(
  "/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.updateRestaurantStatus
);

module.exports = router;
