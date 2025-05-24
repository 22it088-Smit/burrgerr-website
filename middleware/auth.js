const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Higher-order function for authentication
const authenticate = (requiredRole = null) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(401).json({ message: 'Access denied. No token provided.' });
        }
        return res.redirect('/auth/login');
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid token or user not found.' });
      }
      
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      
      req.user = user;
      req.session.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Invalid token.' });
    }
  };
};

module.exports = {
  authenticate,
  requireAuth: authenticate(),
  requireAdmin: authenticate('admin')
};