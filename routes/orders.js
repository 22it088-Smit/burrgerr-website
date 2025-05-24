const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Get checkout page
router.get('/checkout', orderController.getCheckout);

// Create order
router.post('/', orderController.createOrder);

// Get user orders
router.get('/', orderController.getUserOrders);

// Get single order
router.get('/:id', orderController.getOrder);

module.exports = router;