const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { sessionValidation, validate } = require('../middleware/validate');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all sessions for the authenticated user
router.get('/', sessionController.getAllSessions);

// Get sessions for a specific domain
router.get('/domain/:domain', sessionController.getSessionsByDomain);

// Get a single session by ID
router.get('/:id', sessionController.getSessionById);

// Create a new session
router.post('/', sessionValidation, validate, sessionController.createSession);

// Update a session
router.put('/:id', sessionController.updateSession);

// Update last used timestamp
router.patch('/:id/lastUsed', sessionController.updateLastUsed);

// Delete a session
router.delete('/:id', sessionController.deleteSession);

module.exports = router;
