const mongoose = require('mongoose');

const livreurSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },

  vehicleType: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  idCardCopy: { type: String, required: true }, // Chemin de la photocopie de la carte d'identité
  insuranceCopy: { type: String, required: true }, // Chemin de la copie de l'assurance
}, {
  timestamps: true // Ajoute les champs createdAt et updatedAt
});

const Livreur = mongoose.model('Livreur', livreurSchema);

module.exports = Livreur;