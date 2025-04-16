const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
    },
    cookies: {
      type: Array,
      default: [],
    },
    localStorage: {
      type: Object,
      default: {},
    },
    sessionStorage: {
      type: Object,
      default: {},
    },
    hasHttpOnlyCookies: {
      type: Boolean,
      default: false,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for user and domain for faster queries
sessionSchema.index({ user: 1, domain: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
