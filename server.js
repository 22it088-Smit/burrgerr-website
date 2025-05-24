const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const app = express();

// Database connection
require('./config/database');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/burgers', require('./routes/burgers'));
app.use('/orders', require('./routes/orders'));
app.use('/admin', require('./routes/admin'));
app.use('/reviews', require('./routes/reviews'));

// Home route
app.get('/', async (req, res) => {
  try {
    const Burger = require('./models/Burger');
    const Review = require('./models/Review');
    
    // Get top-rated burgers using higher-order functions
    const topBurgers = await Burger.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(6);
    
    // Get recent reviews
    const recentReviews = await Review.find()
      .populate('user', 'name')
      .populate('burger', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.render('user/home', {
      title: 'Burrrgerr - Best Burgers in Town',
      user: req.session.user,
      topBurgers,
      recentReviews
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Server Error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍔 Burrrgerr server running on port ${PORT}`);
});