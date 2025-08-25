const axios = require("axios");

// Initialisation du paiement
exports.initPayment = async (req, res) => {
  try {
    const { amount, currency, description, customerName, customerEmail } = req.body;

    // Payload attendu par PayTech
    const payload = {
      item_name: description || "Paiement Yakalma",
      item_price: amount,
      currency: currency || "XOF",
      command_name: "Paiement commande",
      ref_command: "CMD-" + Date.now(),
      env: "test", // "test" ou "prod"
      success_url: process.env.RETURN_URL,
      cancel_url: process.env.RETURN_URL,
      ipn_url: process.env.NOTIFY_URL,
      custom_field: {
        client: customerName,
        email: customerEmail
      }
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
      return res.json({
        checkout_url: response.data.redirect_url,
        token: response.data.token
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

    // Vérifier et sauvegarder le statut en base
    // Exemple: req.body.status == "completed"

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
