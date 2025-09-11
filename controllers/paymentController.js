const axios = require("axios");
const Order = require("../models/order.model"); // Assure-toi d'avoir un modèle Order

// Initialisation du paiement
exports.initPayment = async (req, res) => {
  try {
    const { breakdown, currency, description, customerName, customerEmail, restaurantId } = req.body;

    if (!breakdown || !breakdown.restaurantAmount || !breakdown.deliveryAmount || !breakdown.serviceAmount) {
      return res.status(400).json({ error: "Breakdown incomplet (restaurant, delivery, service requis)" });
    }

    // ✅ Calcul du total à payer
    const totalAmount = breakdown.restaurantAmount + breakdown.deliveryAmount + breakdown.serviceAmount;

    // Payload attendu par PayTech
    const payload = {
      item_name: description || "Paiement Yakalma",
      item_price: Number(totalAmount),
      currency: currency || "XOF",
      ref_command: "CMD-" + Date.now(),
      env: "test",
      success_url: process.env.RETURN_URL,
      cancel_url: process.env.RETURN_URL,
      ipn_url: process.env.NOTIFY_URL,
      customer_name: customerName,
      customer_email: customerEmail
    };

    // Headers pour l'API
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "API_KEY": process.env.API_KEY,
      "API_SECRET": process.env.API_SECRET
    };

    // Appel API PayTech
    const response = await axios.post(process.env.API_URL, payload, { headers });

    if (response.data && response.data.success) {
      // ✅ Sauvegarde en base la commande avec breakdown
      const newOrder = await Order.create({
        restaurantId,
        customerName,
        customerEmail,
        ref_command: payload.ref_command,
        total: totalAmount,
        amounts: breakdown, // { restaurant: X, delivery: Y, service: Z }
        status: "pending"
      });

      return res.json({
        checkout_url: response.data.redirect_url,
        token: response.data.token,
        ref_command: payload.ref_command,
        orderId: newOrder._id
      });
    } else {
      return res.status(400).json({ error: response.data.message || "Erreur PayTech" });
    }
  } catch (error) {
    console.error("❌ Erreur initPayment:", error.message);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

// Webhook (notify_url)
exports.notifyPayment = async (req, res) => {
  try {
    console.log("📩 Notification PayTech :", req.body);

    const { ref_command, status } = req.body;

    if (!ref_command) {
      return res.status(400).send("❌ ref_command manquant");
    }

    // Récupération de la commande
    const order = await Order.findOne({ ref_command });
    if (!order) {
      return res.status(404).send("❌ Commande introuvable");
    }

    // Mise à jour du statut
    order.status = status === "completed" ? "paid" : "failed";
    await order.save();

    if (status === "completed") {
      // ⚡ Dispatch interne : créditer les wallets
      // Exemple: tu peux avoir une collection Wallet avec type: "restaurant", "livreur", "admin"
      // Ici on simule avec des logs :
      console.log(`💰 Crédit restaurant: ${order.amounts.restaurantAmount} XOF`);
      console.log(`🚚 Crédit livreur: ${order.amounts.deliveryAmount} XOF`);
      console.log(`🏛️ Crédit admin: ${order.amounts.serviceAmount} XOF`);
    }

    res.status(200).send("OK"); // PayTech attend un 200
  } catch (error) {
    console.error("❌ Erreur notify:", error.message);
    res.status(500).send("Erreur");
  }
};

// Callback retour utilisateur (return_url)
exports.returnPayment = async (req, res) => {
  try {
    console.log("↩️ Retour PayTech:", req.query);

    // Rediriger l’utilisateur vers Angular avec query params
    res.redirect(process.env.RETURN_URL + "?status=" + req.query.status);
  } catch (error) {
    res.status(500).send("Erreur retour paiement");
  }
};
