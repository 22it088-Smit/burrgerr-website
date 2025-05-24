const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');
const { validationRules, handleValidation } = require('../middleware/validation');

// Create review (requires authentication)
router.post('/', requireAuth, validationRules.review, handleValidation, reviewController.createReview);

// Get reviews for a burger
router.get('/burger/:burgerId', reviewController.getBurgerReviews);

module.exports = router;