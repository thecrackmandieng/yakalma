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

// 📌 Obtenir le profil du restaurant connecté
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.getRestaurantProfile
);

// ✅ Lister tous les restaurants (Admin ou SuperAdmin)
router.get(
  "/all",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.getAllRestaurants
);

// ✅ Modifier un restaurant (Admin ou SuperAdmin)
router.put(
  "/update/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.updateRestaurant
);

// ✅ Supprimer un restaurant (Admin ou SuperAdmin)
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.deleteRestaurant
);

// ✅ Approuver / Rejeter / Bloquer un restaurant (Admin ou SuperAdmin)
router.put(
  "/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  restaurantController.updateRestaurantStatus
);

module.exports = router;
