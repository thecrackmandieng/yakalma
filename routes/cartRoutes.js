const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');

// ------------------------
// Routes pour le panier
// ------------------------

// Ajouter un produit au panier
router.post('/add', authMiddleware.verifyToken, cartController.addToCart);

// Voir le panier actif
router.get('/view', authMiddleware.verifyToken, cartController.getActiveCart);

// Mettre à jour la quantité d'un produit dans le panier
router.put('/update-item/:itemId', authMiddleware.verifyToken, cartController.updateItemQuantity);

// Supprimer un produit du panier
router.delete('/remove-item/:productId', authMiddleware.verifyToken, cartController.removeFromCart);

// Passer la commande (checkout)
router.post('/checkout', authMiddleware.verifyToken, cartController.placeOrder);

// Vider le panier
router.delete('/clear', authMiddleware.verifyToken, cartController.clearCart);

module.exports = router;
