const mongoose = require("mongoose");

const supplementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  supplements: [supplementSchema],
  quantity: { type: Number, default: 1 } // Ajout de la quantité (stock)
}, { timestamps: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);