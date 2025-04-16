const Session = require("../models/Session");

/**
 * @desc    Get all sessions for the authenticated user
 * @route   GET /api/sessions
 * @access  Private
 */
exports.getSessions = async (req, res, next) => {
    try {
        const sessions = await Session.find({ user: req.user._id }).sort({
            domain: 1,
            lastUsed: -1,
        });

        res.status(200).json(sessions);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get sessions for a specific domain
 * @route   GET /api/sessions/domain/:domain
 * @access  Private
 */
exports.getSessionsByDomain = async (req, res, next) => {
    try {
        const { domain } = req.params;

        const sessions = await Session.find({
            user: req.user._id,
            domain,
        }).sort({ lastUsed: -1 });

        res.status(200).json(sessions);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single session by ID
 * @route   GET /api/sessions/:id
 * @access  Private
 */
exports.getSession = async (req, res, next) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({
                message: "Session not found",
            });
        }

        // Check if the session belongs to the authenticated user
        if (session.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to access this session",
            });
        }

        res.status(200).json(session);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new session
 * @route   POST /api/sessions
 * @access  Private
 */
exports.createSession = async (req, res, next) => {
    try {
        const {
            name,
            domain,
            cookies,
            localStorage,
            sessionStorage,
            hasHttpOnlyCookies,
        } = req.body;

        // Create new session
        const session = await Session.create({
            user: req.user._id,
            name,
            domain,
            cookies,
            localStorage,
            sessionStorage,
            hasHttpOnlyCookies,
        });

        res.status(201).json({
            message: "Session created successfully",
            session,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a session
 * @route   PUT /api/sessions/:id
 * @access  Private
 */
exports.updateSession = async (req, res, next) => {
    try {
        const {
            name,
            cookies,
            localStorage,
            sessionStorage,
            hasHttpOnlyCookies,
        } = req.body;

        // Find session by ID
        let session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({
                message: "Session not found",
            });
        }

        // Check if the session belongs to the authenticated user
        if (session.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to update this session",
            });
        }

        // Update session
        session = await Session.findByIdAndUpdate(
            req.params.id,
            {
                name,
                cookies,
                localStorage,
                sessionStorage,
                hasHttpOnlyCookies,
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Session updated successfully",
            session,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update last used timestamp
 * @route   PATCH /api/sessions/:id/lastUsed
 * @access  Private
 */
exports.updateLastUsed = async (req, res, next) => {
    try {
        // Find session by ID
        let session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({
                message: "Session not found",
            });
        }

        // Check if the session belongs to the authenticated user
        if (session.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to update this session",
            });
        }

        // Update last used timestamp
        session = await Session.findByIdAndUpdate(
            req.params.id,
            {
                lastUsed: Date.now(),
            },
            { new: true }
        );

        res.status(200).json({
            message: "Session last used timestamp updated",
            session,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a session
 * @route   DELETE /api/sessions/:id
 * @access  Private
 */
exports.deleteSession = async (req, res, next) => {
    try {
        // Find session by ID
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({
                message: "Session not found",
            });
        }

        // Check if the session belongs to the authenticated user
        if (session.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized to delete this session",
            });
        }

        // Delete session
        await session.deleteOne();

        res.status(200).json({
            message: "Session deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};
