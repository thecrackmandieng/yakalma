const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middlewares/authMiddleware');

// ✅ Inscription
router.post('/register', clientController.registerClient);

// ✅ Adresse (réservée aux clients)
router.post(
  '/add-address',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['client']),
  clientController.addAddress
);

// ✅ Liste des clients (admin/superadmin)
router.get(
  '/all',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['Admin', 'SuperAdmin']),
  clientController.getAllClients
);

// ✅ Modifier un client
router.put(
  '/:id',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['Admin', 'SuperAdmin']),
  clientController.updateClient
);

// ✅ Supprimer un client
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['Admin', 'SuperAdmin']),
  clientController.deleteClient
);

// ✅ Bloquer / Débloquer un client
router.put(
  '/status/:id',
  authMiddleware.verifyToken,
  authMiddleware.checkRole(['Admin', 'SuperAdmin']),
  clientController.toggleClientStatus
);

module.exports = router;
