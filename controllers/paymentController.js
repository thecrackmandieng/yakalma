require('dotenv').config();
const axios = require("axios");
const Order = require("../models/order.model");
const Wallet = require("../models/wallet.model");

// --- Fonction helper pour envoyer sur Mobile Money ---
async function sendToMobileMoney(phone, amount, description, provider) {
  if (!phone || amount <= 0) {
    console.warn(`⚠️ Données Mobile Money invalides: ${provider} ${phone} ${amount}`);
    return false;
  }
  try {
    if (provider === "wave") {
      const res = await axios.post("https://api.wave.com/v1/payments", {
        phone,
        amount,
        currency: "XOF",
        description
      }, { headers: { "Authorization": `Bearer ${process.env.WAVE_API_KEY}` } });
      console.log(`✅ Wave transfer: ${amount} XOF to ${phone}`);
      return res.data;
    } else if (provider === "orange") {
      const res = await axios.post("https://api.orange.com/momo/v1/transfers", {
        phone,
        amount,
        currency: "XOF",
        description
      }, { headers: { "Authorization": `Bearer ${process.env.ORANGE_API_KEY}` } });
      console.log(`✅ Orange Money transfer: ${amount} XOF to ${phone}`);
      return res.data;
    }
  } catch (err) {
    console.error(`❌ Erreur transfert ${provider} pour ${phone}:`, err.message);
    return false;
  }
}

// --- Initialisation du paiement ---
exports.initPayment = async (req, res) => {
  try {
    const { breakdown, currency, description, customerName, customerEmail, restaurantId, livreurId, adminId } = req.body;

    if (!breakdown || !breakdown.restaurantAmount || !breakdown.deliveryAmount || !breakdown.serviceAmount) {
      return res.status(400).json({ error: "Breakdown incomplet (restaurant, delivery, service requis)" });
    }

    const totalAmount = breakdown.restaurantAmount + breakdown.deliveryAmount + breakdown.serviceAmount;

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

    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "API_KEY": process.env.API_KEY,
      "API_SECRET": process.env.API_SECRET
    };

    const response = await axios.post(process.env.API_URL, payload, { headers });

    if (response.data && response.data.success) {
      const newOrder = await Order.create({
        restaurantId,
        livreurId,
        adminId,
        customerName,
        customerEmail,
        ref_command: payload.ref_command,
        total: totalAmount,
        amounts: breakdown,
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

// --- Webhook PayTech ---
exports.notifyPayment = async (req, res) => {
  try {
    console.log("📩 Notification PayTech :", req.body);

    const { ref_command, status } = req.body;
    if (!ref_command) return res.status(400).send("❌ ref_command manquant");

    const order = await Order.findOne({ ref_command });
    if (!order) return res.status(404).send("❌ Commande introuvable");

    order.status = status === "completed" ? "paid" : "failed";
    await order.save();

    if (status === "completed") {
      // --- Création / mise à jour wallets ---
      const restaurantWallet = await Wallet.findOneAndUpdate(
        { userId: order.restaurantId },
        { $setOnInsert: { balance: 0 } },
        { upsert: true, new: true }
      );
      const livreurWallet = await Wallet.findOneAndUpdate(
        { userId: order.livreurId },
        { $setOnInsert: { balance: 0 } },
        { upsert: true, new: true }
      );
      const adminWallet = await Wallet.findOneAndUpdate(
        { userId: order.adminId },
        { $setOnInsert: { balance: 0 } },
        { upsert: true, new: true }
      );

      // --- Crédit interne ---
      restaurantWallet.balance += order.amounts.restaurantAmount;
      livreurWallet.balance += order.amounts.deliveryAmount;
      adminWallet.balance += order.amounts.serviceAmount;

      await restaurantWallet.save();
      await livreurWallet.save();
      await adminWallet.save();

      console.log(`💰 Crédit restaurant: ${order.amounts.restaurantAmount} XOF`);
      console.log(`🚚 Crédit livreur: ${order.amounts.deliveryAmount} XOF`);
      console.log(`🏛️ Crédit admin: ${order.amounts.serviceAmount} XOF`);

      // --- Transferts Mobile Money ---
      await sendToMobileMoney(restaurantWallet.phone, order.amounts.restaurantAmount, "Paiement Restaurant", "wave");
      await sendToMobileMoney(livreurWallet.phone, order.amounts.deliveryAmount, "Frais livraison", "orange");
      await sendToMobileMoney(adminWallet.phone, order.amounts.serviceAmount, "Frais service", "wave");
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Erreur notify:", error.message);
    res.status(500).send("Erreur");
  }
};

// --- Callback retour utilisateur ---
exports.returnPayment = async (req, res) => {
  try {
    console.log("↩️ Retour PayTech:", req.query);
    res.redirect(process.env.RETURN_URL + "?status=" + req.query.status);
  } catch (error) {
    res.status(500).send("Erreur retour paiement");
  }
};
