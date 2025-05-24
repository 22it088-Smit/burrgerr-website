const express = require('express');
const router = express.Router();
const burgerController = require('../controllers/burgerController');

// Get all burgers / menu page
router.get('/', burgerController.getAllBurgers);

// Get burger builder
router.get('/builder', burgerController.getBurgerBuilder);

// Calculate custom burger price
router.post('/builder/calculate', burgerController.calculateCustomBurgerPrice);

// Get single burger
router.get('/:id', burgerController.getBurger);

module.exports = router;