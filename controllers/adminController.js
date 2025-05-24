const Order = require('../models/Order');
const Burger = require('../models/Burger');
const Ingredient = require('../models/Ingredient');
const User = require('../models/User');

const adminController = {
  // Dashboard with analytics
  getDashboard: async (req, res) => {
    try {
      // Get analytics data using aggregation and array methods
      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      
      const totalUsers = await User.countDocuments({ role: 'user' });
      
      // Recent orders
      const recentOrders = await Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10);
      
      // Low stock ingredients
      const lowStockIngredients = await Ingredient.find({
        $expr: { $lte: ['$stock', '$minStock'] }
      });
      
      // Top selling burgers
      const topBurgers = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.burger': { $exists: true } } },
        { $group: { 
          _id: '$items.burger', 
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.price' }
        }},
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        { $lookup: { 
          from: 'burgers', 
          localField: '_id', 
          foreignField: '_id', 
          as: 'burger' 
        }},
        { $unwind: '$burger' }
      ]);
      
      res.render('admin/dashboard', {
        title: 'Admin Dashboard - Burrrgerr',
        user: req.session.user,
        stats: {
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalUsers,
          lowStockCount: lowStockIngredients.length
        },
        recentOrders,
        lowStockIngredients,
        topBurgers
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      res.status(500).render('error', { message: 'Error loading dashboard' });
    }
  },

  // Get all orders for admin
  getAllOrders: async (req, res) => {
    try {
      const { status, page = 1 } = req.query;
      const limit = 20;
      const skip = (page - 1) * limit;
      
      let query = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      
      const orders = await Order.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const totalOrders = await Order.countDocuments(query);
      const totalPages = Math.ceil(totalOrders / limit);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ orders, totalPages, currentPage: page });
      }
      
      res.render('admin/orders', {
        title: 'Manage Orders - Burrrgerr',
        orders,
        user: req.session.user,
        currentStatus: status || 'all',
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
  },

  // Update order status
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['placed', 'preparing', 'packaging', 'out-for-delivery', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      ).populate('user', 'name email');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
  },

  // Inventory management
  getInventory: async (req, res) => {
    try {
      const ingredients = await Ingredient.find().sort({ category: 1, name: 1 });
      
      // Group ingredients by category using array reduce
      const groupedIngredients = ingredients.reduce((groups, ingredient) => {
        const category = ingredient.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(ingredient);
        return groups;
      }, {});
      
      res.render('admin/inventory', {
        title: 'Inventory Management - Burrrgerr',
        groupedIngredients,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error loading inventory:', error);
      res.status(500).render('error', { message: 'Error loading inventory' });
    }
  },

  // Update ingredient stock
  updateStock: async (req, res) => {
    try {
      const { ingredientId } = req.params;
      const { stock } = req.body;
      
      if (stock < 0) {
        return res.status(400).json({ message: 'Stock cannot be negative' });
      }
      
      const ingredient = await Ingredient.findByIdAndUpdate(
        ingredientId,
        { stock: parseInt(stock) },
        { new: true }
      );
      
      if (!ingredient) {
        return res.status(404).json({ message: 'Ingredient not found' });
      }
      
      res.json({ message: 'Stock updated successfully', ingredient });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ message: 'Error updating stock', error: error.message });
    }
  },

  // Analytics page
  getAnalytics: async (req, res) => {
    try {
      // Sales analytics using aggregation
      const salesByDay = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }},
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ]);
      
      // Popular ingredients
      const ingredientUsage = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.customBurger': { $exists: true } } },
        { $unwind: '$items.customBurger.ingredients' },
        { $group: {
          _id: '$items.customBurger.ingredients',
          usage: { $sum: '$items.quantity' }
        }},
        { $sort: { usage: -1 } },
        { $limit: 10 },
        { $lookup: {
          from: 'ingredients',
          localField: '_id',
          foreignField: '_id',
          as: 'ingredient'
        }},
        { $unwind: '$ingredient' }
      ]);
      
      res.render('admin/analytics', {
        title: 'Analytics - Burrrgerr',
        salesByDay,
        ingredientUsage,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      res.status(500).render('error', { message: 'Error loading analytics' });
    }
  }
};

module.exports = adminController;