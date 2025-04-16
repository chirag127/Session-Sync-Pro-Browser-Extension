const express = require("express");
const env = require("./config/env");
const connectDB = require("./config/db");
const configureExpress = require("./config/express");
const logger = require("./utils/logger");

// Import routes
const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

// Create Express app
const app = express();

// Configure Express
configureExpress(app);

// Define routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
});

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB();

        // Start the server
        const server = app.listen(env.port, () => {
            logger.info(
                `Server running in ${env.nodeEnv} mode on port ${env.port}`
            );
        });

        // Handle unhandled rejections
        process.on("unhandledRejection", (err) => {
            logger.error("Unhandled Promise Rejection:", err);
            // Close server & exit process
            server.close(() => process.exit(1));
        });

        return server;
    } catch (error) {
        logger.error("Failed to start server:", error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app;
