const Review = require('../models/Review');
const Burger = require('../models/Burger');
const Order = require('../models/Order');

const reviewController = {
  // Create review
  createReview: async (req, res) => {
    try {
      const { burgerId, rating, comment } = req.body;
      
      // Check if user has ordered this burger
      const hasOrdered = await Order.findOne({
        user: req.user._id,
        'items.burger': burgerId,
        status: 'delivered'
      });
      
      if (!hasOrdered) {
        return res.status(400).json({ message: 'You can only review burgers you have ordered' });
      }
      
      // Check if user already reviewed this burger
      const existingReview = await Review.findOne({
        user: req.user._id,
        burger: burgerId
      });
      
      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this burger' });
      }
      
      const review = new Review({
        user: req.user._id,
        burger: burgerId,
        rating: parseInt(rating),
        comment
      });
      
      await review.save();
      
      res.json({ message: 'Review added successfully', review });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ message: 'Error creating review', error: error.message });
    }
  },

  // Get reviews for a burger
  getBurgerReviews: async (req, res) => {
    try {
      const { burgerId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const reviews = await Review.find({ burger: burgerId, isApproved: true })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      
      const totalReviews = await Review.countDocuments({ burger: burgerId, isApproved: true });
      
      res.json({
        reviews,
        totalReviews,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / limit)
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
  }
};

module.exports = reviewController;