const mongoose = require('mongoose');

// Schéma pour les suppléments
const supplementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }
});

// Schéma pour chaque item/plat commandé
const itemSchema = new mongoose.Schema({
  dishId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: false },
  price: { type: Number, required: true },
  supplements: { type: [supplementSchema], default: [] } // <-- ajout des suppléments
});

// Schéma de la commande
const orderSchema = new mongoose.Schema({
  items: { type: [itemSchema], required: true },
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  contact: { type: String, required: true },

  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },

  // Infos du restaurant stockées pour garder l'historique
  restaurantName: { type: String, required: true },
  restaurantPhone: { type: String, required: true },
  restaurantAddress: { type: String, required: true },

  courierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // livreur assigné

  status: { type: String, enum: ['en_attente', 'en_cours', 'livre'], default: 'en_attente' },

  paymentInfo: {
    card: { type: String },
    exp: { type: String },
    cvc: { type: String },
  },

  validationCode: { type: String, default: null }, // code de validation généré lors de l'acceptation

  total: { type: Number } // total de la commande
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
