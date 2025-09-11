const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // l'admin peut ne pas avoir de userId
  },
  role: {
    type: String,
    enum: ["restaurant", "livreur", "admin"],
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: "XOF",
  },
}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);
