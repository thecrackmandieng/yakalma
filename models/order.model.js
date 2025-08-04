const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: false }  // ajout du champ image
});

const orderSchema = new mongoose.Schema({
  items: { type: [itemSchema], required: true },
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  contact: { type: String, required: true },

  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },

  // Infos du restaurant stockées pour garder l'historique (copie au moment de la commande)
  restaurantName: { type: String, required: true },
  restaurantPhone: { type: String, required: true },
  restaurantAddress: { type: String, required: true },

  courierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },  // livreur assigné

  status: { type: String, enum: ['en_attente', 'en_cours', 'livre'], default: 'en_attente' },

  paymentInfo: {
    card: { type: String },
    exp: { type: String },
    cvc: { type: String },
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
