const Order = require('../models/Order');
const Burger = require('../models/Burger');
const Ingredient = require('../models/Ingredient');
const { sendOrderConfirmationEmail } = require('../config/email');

const orderController = {
  // Create new order
  createOrder: async (req, res) => {
    try {
      const { items, deliveryAddress, phone, paymentMethod } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'No items in order' });
      }
      
      // Calculate total amount using array methods
      let totalAmount = 0;
      const processedItems = [];
      
      for (const item of items) {
        if (item.burger) {
          // Regular burger
          const burger = await Burger.findById(item.burger);
          if (!burger) {
            return res.status(400).json({ message: `Burger not found: ${item.burger}` });
          }
          
          processedItems.push({
            burger: burger._id,
            quantity: item.quantity,
            price: burger.price * item.quantity
          });
          
          totalAmount += burger.price * item.quantity;
        } else if (item.customBurger) {
          // Custom burger
          const ingredients = await Ingredient.find({ 
            _id: { $in: item.customBurger.ingredients } 
          });
          
          const ingredientsPrice = ingredients.reduce((sum, ing) => sum + ing.price, 0);
          const customPrice = 50 + ingredientsPrice; // Base price + ingredients
          
          processedItems.push({
            customBurger: {
              name: item.customBurger.name,
              ingredients: item.customBurger.ingredients,
              price: customPrice
            },
            quantity: item.quantity,
            price: customPrice * item.quantity
          });
          
          totalAmount += customPrice * item.quantity;
        }
      }
      
      // Add delivery fee if order is below ₹500
      const deliveryFee = totalAmount >= 500 ? 0 : 40;
      totalAmount += deliveryFee;
      
      // Create order
      const order = new Order({
        user: req.user._id,
        items: processedItems,
        totalAmount,
        deliveryAddress,
        phone,
        paymentMethod,
        estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes
      });
      
      await order.save();
      
      // Send confirmation email
      await sendOrderConfirmationEmail(req.user.email, 'Order Confirmation', {
        customerName: req.user.name,
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        estimatedDelivery: order.estimatedDelivery.toLocaleString()
      });
      
      res.json({
        message: 'Order placed successfully',
        order: {
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          estimatedDelivery: order.estimatedDelivery
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Error creating order', error: error.message });
    }
  },

  // Get user orders
  getUserOrders: async (req, res) => {
    try {
      const orders = await Order.find({ user: req.user._id })
        .populate('items.burger')
        .sort({ createdAt: -1 });
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ orders });
      }
      
      res.render('user/order-history', {
        title: 'Order History - Burrrgerr',
        orders,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
  },

  // Get single order
  getOrder: async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        user: req.user._id
      }).populate('items.burger');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ order });
      }
      
      res.render('user/order-tracking', {
        title: `Order ${order.orderId} - Burrrgerr`,
        order,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
  },

  // Get checkout page
  getCheckout: async (req, res) => {
    try {
      res.render('user/checkout', {
        title: 'Checkout - Burrrgerr',
        user: req.session.user
      });
    } catch (error) {
      console.error('Error loading checkout:', error);
      res.status(500).render('error', { message: 'Error loading checkout' });
    }
  }
};

module.exports = orderController;