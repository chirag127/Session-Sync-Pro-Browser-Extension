const express = require('express');
const router = express.Router();

// Import controllers
const { register, login, getCurrentUser } = require('../controllers/authController');

// Import middleware
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

// Routes
router.post('/register', authLimiter, validateRegister, validate, register);
router.post('/login', authLimiter, validateLogin, validate, login);
router.get('/me', protect, getCurrentUser);

module.exports = router;
