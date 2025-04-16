const express = require("express");
const { check } = require("express-validator");
const { register, login, getMe } = require("../controllers/auth");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validation");

const router = express.Router();

// Register route with validation
router.post(
    "/register",
    [
        check("email", "Please include a valid email").isEmail(),
        check(
            "password",
            "Password must be at least 8 characters long"
        ).isLength({
            min: 8,
        }),
    ],
    validate,
    register
);

// Login route with validation
router.post(
    "/login",
    [
        check("email", "Please include a valid email").isEmail(),
        check("password", "Password is required").exists(),
    ],
    validate,
    login
);

// Get current user route (protected)
router.get("/me", protect, getMe);

module.exports = router;
