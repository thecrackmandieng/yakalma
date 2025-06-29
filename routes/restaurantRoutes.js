// routes/restaurantRoutes.js
const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload"); // Importez le middleware upload

const router = express.Router();

// Route pour l'inscription d'un restaurant
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

// Route protégée pour obtenir le profil d'un restaurant
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.getRestaurantProfile
);

// Route administrateur pour mettre à jour le statut d'un restaurant
router.put(
  "/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["admin"]),
  restaurantController.updateRestaurantStatus
);

module.exports = router;
