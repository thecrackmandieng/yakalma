const mongoose = require('mongoose');

const accompanimentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  selected: { type: Boolean, default: false }
});

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  accompaniments: [accompanimentSchema],
  notes: { type: String, default: '' }
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  restaurantName: { type: String, required: true },
  restaurantImage: { type: String, required: true },
  restaurantPhone: { type: String, required: true },
  restaurantAddress: { type: String, required: true },
  
  items: [cartItemSchema],
  
  deliveryFee: { type: Number, default: 0 },
  serviceFee: { type: Number, default: 0 },
  
  subtotal: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    instructions: { type: String, default: '' }
  },
  
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'mobile_money'],
    default: 'card'
  },
  
  status: {
    type: String,
    enum: ['active', 'ordered', 'abandoned'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
