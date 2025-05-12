const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Ajout du champ `password`
  role: { 
    type: String, 
    enum: ['Admin', 'SuperAdmin'], // Définir les valeurs valides pour `role`
    required: true 
  },
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;