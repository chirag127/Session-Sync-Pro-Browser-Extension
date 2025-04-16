const { body, validationResult } = require('express-validator');

// Validation middleware for registration
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
];

// Validation middleware for login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation middleware for session creation
const validateSession = [
  body('name')
    .notEmpty()
    .withMessage('Session name is required')
    .trim(),
  body('domain')
    .notEmpty()
    .withMessage('Domain is required')
    .trim(),
  body('cookies')
    .isArray()
    .withMessage('Cookies must be an array'),
  body('localStorage')
    .isObject()
    .withMessage('localStorage must be an object'),
  body('sessionStorage')
    .isObject()
    .withMessage('sessionStorage must be an object')
];

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateSession,
  validate
};
