const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a session name'],
    trim: true
  },
  domain: {
    type: String,
    required: [true, 'Please provide a domain'],
    trim: true
  },
  faviconUrl: {
    type: String,
    default: null
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
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for user and domain for faster queries
SessionSchema.index({ user: 1, domain: 1 });

// Method to sanitize session data for response
SessionSchema.methods.toJSON = function() {
  const session = this.toObject();
  
  // Ensure we're not exposing sensitive cookie data in logs
  if (process.env.NODE_ENV === 'production') {
    // In production, we might want to redact cookie values in logs
    // This doesn't affect the actual stored data, just the logged output
    session.cookies = session.cookies.map(cookie => ({
      ...cookie,
      value: '[REDACTED]'
    }));
  }
  
  return session;
};

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;
