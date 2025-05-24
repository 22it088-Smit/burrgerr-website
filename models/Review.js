const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  burger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Burger',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure one review per user per burger
reviewSchema.index({ user: 1, burger: 1 }, { unique: true });

// Update burger rating after review save
reviewSchema.post('save', async function() {
  const Burger = require('./Burger');
  const burger = await Burger.findById(this.burger);
  if (burger) {
    await burger.updateRating();
  }
});

module.exports = mongoose.model('Review', reviewSchema);