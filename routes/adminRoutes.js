const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

// Route pour inscription super admin (non protégée)
router.post("/register-super-admin", adminController.registerSuperAdmin);

// Route de login
router.post("/login", adminController.loginAdmin);

// Route inscription admin (protégée)
router.post(
  "/register",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  adminController.registerAdmin
);

// Profil admin connecté
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  adminController.getAdminProfile
);

// Mise à jour profil admin connecté (PUT)
router.put(
  "/profile",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  adminController.updateAdminProfile
);

// Changement mot de passe (PUT)
router.put(
  "/change-password",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  adminController.changePasswordAdmin
);

// Récupérer tous les admins (GET)
router.get(
  "/all",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  adminController.getAllAdmins
);

// Supprimer un admin (DELETE)
router.delete(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  adminController.deleteAdmin
);

// Modifier un admin par superadmin (PUT)
router.put(
  "/:id",
  authMiddleware.verifyToken,
  authMiddleware.checkRole(["Admin", "SuperAdmin"]),
  adminController.updateAdmin
);

// =====================
// Route Dashboard Admin
// =====================
router.get(
  "/dashboard-data",
 
  adminController.getAdminDashboardData
);

module.exports = router;