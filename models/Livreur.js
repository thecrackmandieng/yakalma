const mongoose = require('mongoose');

const livreurSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  vehicleType: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  idCardCopy: { type: String, required: true }, // Path to the copy of the ID card
  insuranceCopy: { type: String, required: true }, // Path to the copy of the insurance
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

const Livreur = mongoose.model('Livreur', livreurSchema);

module.exports = Livreur;
