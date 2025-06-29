const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  managerName: { type: String, required: true },
  password: { type: String },
  legalDocuments: { type: String, required: true },
  idCardCopy: { type: String, required: true }, // Chemin vers la copie de la carte d'identité
  photo: { type: String, required: true }, // Chemin vers la photo
  ninea: { type: String, required: true }, // NINEA
  tradeRegister: { type: String, required: true }, // Registre de commerce
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, {
  timestamps: true
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
