const Session = require('../models/Session');

/**
 * Get all sessions for the authenticated user
 * @route GET /api/sessions
 * @access Private
 */
const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .sort({ lastUsed: -1 });
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sessions for a specific domain
 * @route GET /api/sessions/domain/:domain
 * @access Private
 */
const getSessionsByDomain = async (req, res, next) => {
  try {
    const { domain } = req.params;
    
    const sessions = await Session.find({
      user: req.user._id,
      domain
    }).sort({ lastUsed: -1 });
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single session by ID
 * @route GET /api/sessions/:id
 * @access Private
 */
const getSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new session
 * @route POST /api/sessions
 * @access Private
 */
const createSession = async (req, res, next) => {
  try {
    const {
      name,
      domain,
      faviconUrl,
      cookies,
      localStorage,
      sessionStorage,
      hasHttpOnlyCookies
    } = req.body;
    
    // Create session
    const session = await Session.create({
      user: req.user._id,
      name,
      domain,
      faviconUrl,
      cookies,
      localStorage,
      sessionStorage,
      hasHttpOnlyCookies,
      lastUsed: Date.now()
    });
    
    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a session
 * @route PUT /api/sessions/:id
 * @access Private
 */
const updateSession = async (req, res, next) => {
  try {
    const {
      name,
      faviconUrl,
      cookies,
      localStorage,
      sessionStorage,
      hasHttpOnlyCookies
    } = req.body;
    
    // Find session
    let session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Update session
    session.name = name || session.name;
    session.faviconUrl = faviconUrl || session.faviconUrl;
    
    if (cookies) session.cookies = cookies;
    if (localStorage) session.localStorage = localStorage;
    if (sessionStorage) session.sessionStorage = sessionStorage;
    if (hasHttpOnlyCookies !== undefined) session.hasHttpOnlyCookies = hasHttpOnlyCookies;
    
    session.lastUsed = Date.now();
    
    await session.save();
    
    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update last used timestamp
 * @route PATCH /api/sessions/:id/lastUsed
 * @access Private
 */
const updateLastUsed = async (req, res, next) => {
  try {
    // Find session
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Update last used timestamp
    session.lastUsed = Date.now();
    await session.save();
    
    res.status(200).json({
      success: true,
      message: 'Session last used timestamp updated',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a session
 * @route DELETE /api/sessions/:id
 * @access Private
 */
const deleteSession = async (req, res, next) => {
  try {
    // Find session
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Delete session
    await session.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  getSessionsByDomain,
  getSession,
  createSession,
  updateSession,
  updateLastUsed,
  deleteSession
};
