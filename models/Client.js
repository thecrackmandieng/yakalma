const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  addresses: [
    {
      name: String,
      street: String,
      city: String,
      postalCode: String,
    },
  ],
  isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model('Client', clientSchema);
