const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, loginValidation, validate } = require('../middleware/validate');
const auth = require('../middleware/auth');

// Register a new user
router.post('/register', registerValidation, validate, authController.register);

// Login user
router.post('/login', loginValidation, validate, authController.login);

// Get current user (protected route)
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
