const Session = require('../models/Session');

// Get all sessions for the authenticated user
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.userId })
      .sort({ domain: 1, updatedAt: -1 });
    
    res.json(sessions);
  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({ message: 'Server error fetching sessions' });
  }
};

// Get sessions for a specific domain
exports.getSessionsByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    
    const sessions = await Session.find({ 
      user: req.userId,
      domain
    }).sort({ updatedAt: -1 });
    
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions by domain error:', error);
    res.status(500).json({ message: 'Server error fetching sessions for domain' });
  }
};

// Get a single session by ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Get session by ID error:', error);
    res.status(500).json({ message: 'Server error fetching session' });
  }
};

// Create a new session
exports.createSession = async (req, res) => {
  try {
    const { name, domain, cookies, localStorage, sessionStorage, hasHttpOnlyCookies } = req.body;
    
    const session = new Session({
      user: req.userId,
      name,
      domain,
      cookies,
      localStorage,
      sessionStorage,
      hasHttpOnlyCookies
    });
    
    await session.save();
    
    res.status(201).json({
      message: 'Session saved successfully',
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error creating session' });
  }
};

// Update a session
exports.updateSession = async (req, res) => {
  try {
    const { name, cookies, localStorage, sessionStorage, hasHttpOnlyCookies } = req.body;
    
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    // Update fields
    if (name) session.name = name;
    if (cookies) session.cookies = cookies;
    if (localStorage) session.localStorage = localStorage;
    if (sessionStorage) session.sessionStorage = sessionStorage;
    if (hasHttpOnlyCookies !== undefined) session.hasHttpOnlyCookies = hasHttpOnlyCookies;
    
    session.updatedAt = Date.now();
    
    await session.save();
    
    res.json({
      message: 'Session updated successfully',
      session
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Server error updating session' });
  }
};

// Update last used timestamp
exports.updateLastUsed = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    session.lastUsed = Date.now();
    await session.save();
    
    res.json({
      message: 'Session last used timestamp updated',
      session
    });
  } catch (error) {
    console.error('Update last used error:', error);
    res.status(500).json({ message: 'Server error updating session' });
  }
};

// Delete a session
exports.deleteSession = async (req, res) => {
  try {
    const result = await Session.deleteOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Session not found or already deleted' });
    }
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error deleting session' });
  }
};
