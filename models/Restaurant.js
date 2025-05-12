const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  managerName: { type: String, required: true },
  legalDocuments: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  menu: [
    {
      dishName: String,
      description: String,
      price: Number,
      photoUrl: String,
    },
  ],
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
