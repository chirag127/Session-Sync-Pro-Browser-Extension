const express = require('express');
const router = express.Router();

// Import controllers
const {
  getSessions,
  getSessionsByDomain,
  getSession,
  createSession,
  updateSession,
  updateLastUsed,
  deleteSession
} = require('../controllers/sessionController');

// Import middleware
const { protect } = require('../middleware/auth');
const { validateSession, validate } = require('../middleware/validator');

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getSessions)
  .post(validateSession, validate, createSession);

router.route('/domain/:domain')
  .get(getSessionsByDomain);

router.route('/:id')
  .get(getSession)
  .put(validateSession, validate, updateSession)
  .delete(deleteSession);

router.route('/:id/lastUsed')
  .patch(updateLastUsed);

module.exports = router;
