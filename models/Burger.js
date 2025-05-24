const mongoose = require('mongoose');

const burgerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan'],
    required: true
  },
  ingredients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient'
  }],
  image: {
    type: String,
    default: '/images/burgers/default.jpg'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15 // minutes
  }
}, {
  timestamps: true
});

// Calculate average rating using aggregation
burgerSchema.methods.updateRating = async function() {
  const Review = require('./Review');
  const stats = await Review.aggregate([
    { $match: { burger: this._id } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  if (stats.length > 0) {
    this.rating = Math.round(stats[0].avgRating * 10) / 10;
    this.reviewCount = stats[0].count;
  } else {
    this.rating = 0;
    this.reviewCount = 0;
  }
  
  await this.save();
};

module.exports = mongoose.model('Burger', burgerSchema);