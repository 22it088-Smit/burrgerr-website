const { body, validationResult } = require('express-validator');

// Validation rules using arrays and higher-order functions
const validationRules = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please enter a valid Indian phone number')
  ],
  
  login: [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  
  review: [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Comment must be between 10 and 500 characters')
  ]
};

// Higher-order function to handle validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ errors: errorMessages });
    }
    
    req.session.errors = errorMessages;
    return res.redirect('back');
  }
  next();
};

module.exports = {
  validationRules,
  handleValidation
};