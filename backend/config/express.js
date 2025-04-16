const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./env');

/**
 * Configure Express app
 * @param {Object} app - Express app
 * @returns {Object} - Configured Express app
 */
const configureExpress = (app) => {
  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // CORS middleware
  app.use(cors({
    origin: env.clientUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Security middleware
  app.use(helmet());
  
  // Logging middleware
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
  
  // Rate limiting middleware
  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  });
  
  // Apply rate limiting to all requests
  app.use(limiter);
  
  return app;
};

module.exports = configureExpress;
