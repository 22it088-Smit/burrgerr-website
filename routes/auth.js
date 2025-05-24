const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validationRules, handleValidation } = require('../middleware/validation');
const { requireAuth } = require('../middleware/auth');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login', {
    title: 'Login - Burrrgerr',
    user: null,
    errors: req.session.errors || []
  });
  req.session.errors = null;
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/register', {
    title: 'Register - Burrrgerr',
    user: null,
    errors: req.session.errors || []
  });
  req.session.errors = null;
});

// Register user
router.post('/register', validationRules.register, handleValidation, authController.register);

// Login user
router.post('/login', validationRules.login, handleValidation, authController.login);

// Logout user
router.post('/logout', authController.logout);

// Get profile
router.get('/profile', requireAuth, authController.getProfile);

module.exports = router;