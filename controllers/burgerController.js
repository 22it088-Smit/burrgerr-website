const Burger = require('../models/Burger');
const Ingredient = require('../models/Ingredient');
const Review = require('../models/Review');

const burgerController = {
  // Get all burgers with filtering using array methods
  getAllBurgers: async (req, res) => {
    try {
      const { category, search, sort } = req.query;
      let query = { isActive: true };
      
      // Filter by category
      if (category && category !== 'all') {
        query.category = category;
      }
      
      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      let burgers = await Burger.find(query).populate('ingredients');
      
      // Sort using array methods
      if (sort) {
        switch (sort) {
          case 'price-low':
            burgers = burgers.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            burgers = burgers.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            burgers = burgers.sort((a, b) => b.rating - a.rating);
            break;
          case 'name':
            burgers = burgers.sort((a, b) => a.name.localeCompare(b.name));
            break;
          default:
            burgers = burgers.sort((a, b) => b.rating - a.rating);
        }
      }
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ burgers });
      }
      
      res.render('user/menu', {
        title: 'Our Menu - Burrrgerr',
        burgers,
        user: req.session.user,
        currentCategory: category || 'all',
        searchTerm: search || '',
        currentSort: sort || 'rating'
      });
    } catch (error) {
      console.error('Error fetching burgers:', error);
      res.status(500).json({ message: 'Error fetching burgers', error: error.message });
    }
  },

  // Get single burger
  getBurger: async (req, res) => {
    try {
      const burger = await Burger.findById(req.params.id)
        .populate('ingredients')
        .populate({
          path: 'reviews',
          populate: { path: 'user', select: 'name' }
        });
      
      if (!burger) {
        return res.status(404).json({ message: 'Burger not found' });
      }
      
      // Get related burgers using array filter
      const relatedBurgers = await Burger.find({
        category: burger.category,
        _id: { $ne: burger._id },
        isActive: true
      }).limit(4);
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ burger, relatedBurgers });
      }
      
      res.render('user/burger-detail', {
        title: `${burger.name} - Burrrgerr`,
        burger,
        relatedBurgers,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error fetching burger:', error);
      res.status(500).json({ message: 'Error fetching burger', error: error.message });
    }
  },

  // Get burger builder page
  getBurgerBuilder: async (req, res) => {
    try {
      // Get ingredients grouped by category using array reduce
      const ingredients = await Ingredient.find({ stock: { $gt: 0 } });
      const groupedIngredients = ingredients.reduce((groups, ingredient) => {
        const category = ingredient.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(ingredient);
        return groups;
      }, {});
      
      res.render('user/burger-builder', {
        title: 'Build Your Burger - Burrrgerr',
        groupedIngredients,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error loading burger builder:', error);
      res.status(500).render('error', { message: 'Error loading burger builder' });
    }
  },

  // Calculate custom burger price
  calculateCustomBurgerPrice: async (req, res) => {
    try {
      const { ingredientIds } = req.body;
      
      if (!Array.isArray(ingredientIds) || ingredientIds.length === 0) {
        return res.status(400).json({ message: 'Invalid ingredients' });
      }
      
      const ingredients = await Ingredient.find({ _id: { $in: ingredientIds } });
      
      // Calculate total price using array reduce
      const totalPrice = ingredients.reduce((total, ingredient) => {
        return total + ingredient.price;
      }, 0);
      
      // Base price for custom burger
      const basePrice = 50;
      const finalPrice = basePrice + totalPrice;
      
      res.json({
        basePrice,
        ingredientsPrice: totalPrice,
        totalPrice: finalPrice,
        ingredients: ingredients.map(ing => ({
          id: ing._id,
          name: ing.name,
          price: ing.price,
          category: ing.category
        }))
      });
    } catch (error) {
      console.error('Error calculating price:', error);
      res.status(500).json({ message: 'Error calculating price', error: error.message });
    }
  }
};

module.exports = burgerController;