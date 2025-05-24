const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendRegistrationEmail } = require('../config/email');

// Higher-order function for generating JWT tokens
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const authController = {
  // Register user with validation
  register: async (req, res) => {
    try {
      const { name, email, password, phone, address } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      
      // Create new user
      const user = new User({
        name,
        email,
        password,
        phone,
        address
      });
      
      await user.save();
      
      // Generate token
      const token = generateToken(user._id);
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Send welcome email
      await sendRegistrationEmail(email, 'Welcome to Burrrgerr!', { name });
      
      req.session.user = user;
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ message: 'Registration successful', user: { name: user.name, email: user.email } });
      }
      
      res.redirect('/');
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email });
      if (!user || !await user.comparePassword(password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }
      
      // Generate token
      const token = generateToken(user._id);
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      req.session.user = user;
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ 
          message: 'Login successful', 
          user: { name: user.name, email: user.email, role: user.role },
          redirectUrl: user.role === 'admin' ? '/admin/dashboard' : '/'
        });
      }
      
      res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/');
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  },

  // Logout user
  logout: (req, res) => {
    res.clearCookie('token');
    req.session.destroy();
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ message: 'Logout successful' });
    }
    
    res.redirect('/');
  },

  // Get current user
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
  }
};

module.exports = authController;