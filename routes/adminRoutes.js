const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

// Route spéciale pour l'inscription initiale du super administrateur
router.post(
  "/register-super-admin",
  adminController.registerSuperAdmin
);

// Routes protégées
router.post(
  "/register",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["SuperAdmin"]),
  adminController.registerAdmin
);

router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin"]),
  adminController.getAdminProfile
);

router.get(
  "/all",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["SuperAdmin"]),
  adminController.getAllAdmins
);

module.exports = router;
