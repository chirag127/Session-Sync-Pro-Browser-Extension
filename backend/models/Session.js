const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  cookies: {
    type: Array,
    default: []
  },
  localStorage: {
    type: Object,
    default: {}
  },
  sessionStorage: {
    type: Object,
    default: {}
  },
  hasHttpOnlyCookies: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: null
  }
});

// Update the updatedAt field before saving
sessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
