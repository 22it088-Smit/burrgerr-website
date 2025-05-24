const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Orders management
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:orderId/status', adminController.updateOrderStatus);

// Inventory management
router.get('/inventory', adminController.getInventory);
router.put('/inventory/:ingredientId/stock', adminController.updateStock);

// Analytics
router.get('/analytics', adminController.getAnalytics);

module.exports = router;