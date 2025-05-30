// routes/clientRoutes.js

const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const authMiddleware = require("../middlewares/authMiddleware");

// Routes publiques
router.post("/register", clientController.registerClient);

// Routes protégées
router.post(
  "/add-address",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["client"]),
  clientController.addAddress
);

module.exports = router;
