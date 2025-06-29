// ✅ models/Livreur.js
const mongoose = require('mongoose');

const livreurSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String },
  vehicleType: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  idCardCopy: { type: String, required: true },
  insuranceCopy: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "blocked"], default: "pending" },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Livreur', livreurSchema);
