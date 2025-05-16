const express = require("express");
const clientController = require("../controllers/clientController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

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
