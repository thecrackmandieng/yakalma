const Cart = require('../models/cart.model');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// ✅ Ajouter un produit au panier
const addToCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { restaurantId, productId, quantity, accompaniments = [], notes = '' } = req.body;

    if (!restaurantId || !productId || !quantity) {
      return res.status(400).json({ message: 'Restaurant ID, product ID et quantité sont requis' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant non trouvé' });

    const product = await MenuItem.findById(productId);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

    if (product.restaurantId.toString() !== restaurantId) {
      return res.status(400).json({ message: 'Ce produit n\'appartient pas au restaurant sélectionné' });
    }

    let cart = await Cart.findOne({ userId, restaurantId, status: 'active' });

    if (!cart) {
      cart = new Cart({
        userId,
        restaurantId,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.image || '',
        restaurantPhone: restaurant.phone,
        restaurantAddress: restaurant.address,
        items: [],
        deliveryFee: restaurant.deliveryFee || 0,
        serviceFee: 0,
        subtotal: 0,
        totalAmount: 0,
      });
    }

    const formattedAccompaniments = accompaniments.map(acc => ({
      name: acc.name,
      price: acc.price || 0,
      selected: acc.selected || false
    }));

    const accompanimentsPrice = formattedAccompaniments
      .filter(acc => acc.selected)
      .reduce((total, acc) => total + acc.price, 0);

    const itemTotalPrice = (product.price + accompanimentsPrice) * quantity;

    const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      existingItem.quantity += quantity;
      existingItem.totalPrice = (product.price + accompanimentsPrice) * existingItem.quantity;
      existingItem.accompaniments = formattedAccompaniments;
      existingItem.notes = notes;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        image: product.image,
        quantity,
        unitPrice: product.price,
        totalPrice: itemTotalPrice,
        accompaniments: formattedAccompaniments,
        notes
      });
    }

    cart.subtotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
    cart.serviceFee = cart.subtotal * 0.05;
    cart.totalAmount = cart.subtotal + cart.deliveryFee + cart.serviceFee;

    await cart.save();

    res.status(200).json({ message: 'Produit ajouté au panier avec succès', cart });

  } catch (error) {
    console.error('Erreur lors de l\'ajout au panier:', error);
    res.status(500).json({ message: 'Erreur interne', error: error.message });
  }
};

// ✅ Voir le panier actif
const getActiveCart = async (req, res) => {
  try {
    const { userId } = req.user;

    const cart = await Cart.findOne({ userId, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Aucun panier actif trouvé' });

    res.status(200).json(cart);

  } catch (error) {
    console.error('Erreur lors de la récupération du panier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Mettre à jour la quantité d’un produit
const updateItemQuantity = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ userId, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Aucun panier actif trouvé' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Article non trouvé dans le panier' });

    item.quantity = quantity;
    item.totalPrice = (item.unitPrice + (item.accompaniments || []).reduce((sum, acc) => acc.selected ? sum + acc.price : sum, 0)) * quantity;

    cart.subtotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
    cart.serviceFee = cart.subtotal * 0.05;
    cart.totalAmount = cart.subtotal + cart.deliveryFee + cart.serviceFee;

    await cart.save();
    res.status(200).json({ message: 'Quantité mise à jour', cart });

  } catch (error) {
    console.error('Erreur mise à jour quantité:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Supprimer un produit du panier
const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Aucun panier actif trouvé' });

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);

    cart.subtotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
    cart.serviceFee = cart.subtotal * 0.05;
    cart.totalAmount = cart.subtotal + cart.deliveryFee + cart.serviceFee;

    await cart.save();

    res.status(200).json({ message: 'Produit supprimé du panier', cart });

  } catch (error) {
    console.error('Erreur suppression produit du panier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Passer commande
const placeOrder = async (req, res) => {
  try {
    const { userId } = req.user;
    const { deliveryAddress, paymentMethod } = req.body;

    const cart = await Cart.findOne({ userId, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Aucun panier actif trouvé' });

    if (!deliveryAddress?.street || !deliveryAddress?.city || !deliveryAddress?.zipCode) {
      return res.status(400).json({ message: 'Adresse de livraison incomplète' });
    }

    cart.deliveryAddress = deliveryAddress;
    cart.paymentMethod = paymentMethod || 'card';
    cart.status = 'ordered';
    cart.orderedAt = new Date();

    await cart.save();

    res.status(200).json({ message: 'Commande enregistrée avec succès', order: cart });

  } catch (error) {
    console.error('Erreur lors de la commande:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// ✅ Vider le panier
const clearCart = async (req, res) => {
  try {
    const { userId } = req.user;

    const cart = await Cart.findOne({ userId, status: 'active' });
    if (!cart) return res.status(404).json({ message: 'Aucun panier actif trouvé' });

    cart.items = [];
    cart.subtotal = 0;
    cart.serviceFee = 0;
    cart.totalAmount = cart.deliveryFee;

    await cart.save();

    res.status(200).json({ message: 'Panier vidé avec succès', cart });

  } catch (error) {
    console.error('Erreur nettoyage panier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  addToCart,
  getActiveCart,
  updateItemQuantity,
  removeFromCart,
  placeOrder,
  clearCart
};
