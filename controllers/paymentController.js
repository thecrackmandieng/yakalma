const axios = require("axios");

// Initialisation du paiement
exports.initPayment = async (req, res) => {
  try {
    const { amount, currency, description, customerName, customerEmail } = req.body;

    if (!amount || !customerName || !customerEmail) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }

    const totalAmount = Math.round(amount); // s'assurer que c'est un entier

    // Payload attendu par PayTech
    const payload = {
      item_name: description || "Paiement Yakalma",
      item_price: totalAmount,
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

    // Headers pour l'API PayTech
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "API_KEY": process.env.API_KEY,
      "API_SECRET": process.env.API_SECRET
    };

    // Appel API PayTech
    const response = await axios.post(process.env.API_URL, payload, { headers });

    if (response.data) {
      // PayTech renvoie généralement redirect_url et token
      const redirect_url = response.data.redirect_url || response.data.checkout_url;
      const token = response.data.token || null;

      if (redirect_url) {
        return res.json({ redirect_url, token });
      } else {
        console.error("❌ PayTech: redirect_url manquante", response.data);
        return res.status(500).json({ error: "Erreur PayTech: redirect_url manquante" });
      }
    } else {
      return res.status(500).json({ error: "Erreur PayTech: réponse vide" });
    }

  } catch (error) {
    console.error("❌ Erreur initPayment:", error.response?.data || error.message);
    return res.status(500).json({ error: "Erreur serveur lors de l'initiation du paiement" });
  }
};

// Webhook (notify_url)
exports.notifyPayment = async (req, res) => {
  try {
    console.log("📩 Notification PayTech :", req.body);

    // Ici, tu peux vérifier et sauvegarder le statut de la commande en base
    // Exemple: req.body.status == "completed"

    res.status(200).send("OK"); // PayTech attend un 200
  } catch (error) {
    console.error("❌ Erreur notify:", error.message);
    res.status(500).send("Erreur serveur notification");
  }
};

// Callback retour utilisateur (return_url)
exports.returnPayment = async (req, res) => {
  try {
    console.log("↩️ Retour PayTech:", req.query);

    // Rediriger l’utilisateur vers Angular avec query params
    const status = req.query.status || "unknown";
    res.redirect(`${process.env.RETURN_URL}?status=${status}`);
  } catch (error) {
    console.error("❌ Erreur returnPayment:", error.message);
    res.status(500).send("Erreur retour paiement");
  }
};
