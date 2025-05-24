const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['protein', 'vegetable', 'sauce', 'cheese', 'bread'],
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  minStock: {
    type: Number,
    default: 10
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: '/images/ingredients/default.jpg'
  }
}, {
  timestamps: true
});

// Check if ingredient is low in stock
ingredientSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStock;
});

module.exports = mongoose.model('Ingredient', ingredientSchema);