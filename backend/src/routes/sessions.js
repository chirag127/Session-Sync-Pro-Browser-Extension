const express = require("express");
const { check } = require("express-validator");
const {
    getSessions,
    getSessionsByDomain,
    getSession,
    createSession,
    updateSession,
    updateLastUsed,
    deleteSession,
} = require("../controllers/sessions");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validation");

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all sessions for the authenticated user
router.get("/", getSessions);

// Get sessions for a specific domain
router.get("/domain/:domain", getSessionsByDomain);

// Get a single session by ID
router.get("/:id", getSession);

// Create a new session with validation
router.post(
    "/",
    [
        check("name", "Session name is required").notEmpty(),
        check("domain", "Domain is required").notEmpty(),
    ],
    validate,
    createSession
);

// Update a session with validation
router.put(
    "/:id",
    [check("name", "Session name is required").notEmpty()],
    validate,
    updateSession
);

// Update last used timestamp
router.patch("/:id/lastUsed", updateLastUsed);

// Delete a session
router.delete("/:id", deleteSession);

module.exports = router;
