const mongoose = require('mongoose');

const livreurSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  password: { type: String, required: true }, // obligatoire pour login
  vehicleType: { type: String, required: false },
  vehicleNumber: { type: String, required: false },
  idCardCopy: { type: String, required: false },
    role: { type: String, default: "livreur" }, // ✅ ce champ doit exister

  insuranceCopy: { type: String, required: false },
  status: { 
    type: String, 
    enum: ["incomplete", "pending", "approved", "rejected", "blocked"], 
    default: "incomplete" 
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Livreur', livreurSchema);
