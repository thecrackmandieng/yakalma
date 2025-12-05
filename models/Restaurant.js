const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  managerName: { type: String, default: '' },
  password: { type: String, required: true },

  permis: { type: String, default: '' },
  certificat: { type: String, default: '' },
  autresDocs: { type: String, default: '' },
  idCardCopy: { type: String, default: '' },
  photo: { type: String, default: '' },
  ninea: { type: String, default: '' },

  role: {
    type: String,
    enum: ['restaurant', 'livreur', 'client', 'admin', 'superadmin'],
    default: 'restaurant',
  },

  status: {
    type: String,
    enum: ['incomplete', 'pending', 'approved', 'rejected', 'blocked'],
    default: 'incomplete',
    required: true,
  },

  isBlocked: { type: Boolean, default: false },

  // ✅ Nouveau champ pour la relation avec les plats
  menu: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }
  ],

  // ✅ Nouveau champ pour la relation avec les tables
  tables: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table'
    }
  ]
}, {
  timestamps: true
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
