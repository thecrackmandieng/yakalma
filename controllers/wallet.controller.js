const Wallet = require("../models/wallet.model");
const WalletTransaction = require("../models/walletTransaction.model"); // Historique des mouvements

// --- Récupérer le solde d’un utilisateur ---
exports.getWalletByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Aucun wallet trouvé pour cet utilisateur" });
    }

    res.json({
      userId: wallet.userId,
      role: wallet.role,
      balance: wallet.balance,
      currency: wallet.currency,
      updatedAt: wallet.updatedAt,
    });
  } catch (error) {
    console.error("❌ Erreur getWalletByUser:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// --- Historique des transactions ---
exports.getWalletHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await WalletTransaction.find({ userId }).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    console.error("❌ Erreur getWalletHistory:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// --- Créditer ou débiter un wallet (admin ou corrections) ---
exports.updateWallet = async (req, res) => {
  try {
    const { userId, role, amount, type, description } = req.body;
    // type = "credit" | "debit"

    if (!["credit", "debit"].includes(type)) return res.status(400).json({ message: "Type invalide" });

    const wallet = await Wallet.findOneAndUpdate(
      { userId, role },
      { $inc: { balance: type === "credit" ? amount : -amount } },
      { upsert: true, new: true }
    );

    // Sauvegarder dans historique
    await WalletTransaction.create({
      userId,
      role,
      type,
      amount,
      description: description || "Mouvement manuel",
      balanceAfter: wallet.balance
    });

    res.json({ message: "Wallet mis à jour", wallet });
  } catch (error) {
    console.error("❌ Erreur updateWallet:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
