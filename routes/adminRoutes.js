const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

// Routes publiques (accessibles uniquement par les super-admins)
router.post(
  "/register",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["SuperAdmin"]), // ← au lieu de "admin"
  adminController.registerAdmin
);

// Routes protégées
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  adminController.getAdminProfile
);
router.get(
  "/all",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  adminController.getAllAdmins
);

module.exports = router;
