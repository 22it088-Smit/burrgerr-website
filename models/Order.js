const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    burger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Burger'
    },
    customBurger: {
      name: String,
      ingredients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }],
      price: Number
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  phone: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['placed', 'preparing', 'packaging', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  estimatedDelivery: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Generate unique order ID
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `BRG${Date.now()}${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);