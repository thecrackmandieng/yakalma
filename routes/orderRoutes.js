const express = require('express');
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const ctrl = require('../controllers/orderController');

// Route accessible au client pour passer une commande (non protégée)
router.post('/', ctrl.createOrder);

// Middleware d’authentification pour les routes suivantes
router.use(authMiddleware.verifyToken);

// Récupérer les commandes du restaurant connecté
router.get('/my', ctrl.getRestaurantOrders);

// Modifier le statut (accepter, livrer)
router.patch('/:id/status', ctrl.updateOrderStatus);
router.patch('/:id/assign', ctrl.assignOrderToCourier);

/**
 * Route pour que le livreur récupère toutes les commandes livrées (status = "livre")
 * On ajoute un middleware supplémentaire pour vérifier que l'utilisateur est un livreur
 */
router.get('/delivered', authMiddleware.verifyLivreurRole, ctrl.getDeliveredOrdersForLivreur);

module.exports = router;
