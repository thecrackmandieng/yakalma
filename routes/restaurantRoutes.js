const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Routes publiques
router.post("/register", restaurantController.registerRestaurant);

// Routes protégées
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["restaurant"]),
  restaurantController.getRestaurantProfile
);

// Routes administrateur
router.put(
  "/status",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["admin"]),
  restaurantController.updateRestaurantStatus
);

module.exports = router;
