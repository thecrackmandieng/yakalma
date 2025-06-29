const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

// Route pour inscription super admin (non protégée, car initialisation)
router.post("/register-super-admin", adminController.registerSuperAdmin);

// Route de login
router.post("/login", adminController.loginAdmin);

// Routes protégées par token et rôle
router.post(
  "/register",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["SuperAdmin"]),
  adminController.registerAdmin
);

router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  adminController.getAdminProfile
);

router.get(
  "/all",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["SuperAdmin"]),
  adminController.getAllAdmins
);

router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["SuperAdmin"]),
  adminController.deleteAdmin
);

module.exports = router;
