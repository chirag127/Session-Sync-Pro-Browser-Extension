/**
 * API utility functions for communicating with the backend
 */

// Default API URL
const DEFAULT_API_URL = "http://localhost:3000";

/**
 * Get the API URL from storage or use default
 * @returns {Promise<string>} The API URL
 */
const getApiUrl = async () => {
    const { apiUrl } = await chrome.storage.local.get("apiUrl");
    return apiUrl || DEFAULT_API_URL;
};

/**
 * Get the authentication token from storage
 * @returns {Promise<string|null>} The authentication token or null if not found
 */
const getAuthToken = async () => {
    const { token } = await chrome.storage.local.get("token");
    return token || null;
};

/**
 * Make an API request
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - The fetch options
 * @returns {Promise<Object>} The response data
 */
const apiRequest = async (endpoint, options = {}) => {
    try {
        const apiUrl = await getApiUrl();
        const token = await getAuthToken();

        const headers = {
            "Content-Type": "application/json",
            ...options.headers,
        };

        // Add authorization header if token exists
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${apiUrl}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong");
        }

        return data;
    } catch (error) {
        console.error("API request error:", error);
        throw error;
    }
};

/**
 * Register a new user
 * @param {Object} userData - The user data (email, password)
 * @returns {Promise<Object>} The response data
 */
const register = async (userData) => {
    return apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
    });
};

/**
 * Login a user
 * @param {Object} credentials - The user credentials (email, password)
 * @returns {Promise<Object>} The response data
 */
const login = async (credentials) => {
    return apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
};

/**
 * Get the current user
 * @returns {Promise<Object>} The user data
 */
const getCurrentUser = async () => {
    return apiRequest("/api/auth/me");
};

/**
 * Get all sessions for the authenticated user
 * @returns {Promise<Array>} The sessions data
 */
const getSessions = async () => {
    return apiRequest("/api/sessions");
};

/**
 * Get sessions for a specific domain
 * @param {string} domain - The domain
 * @returns {Promise<Array>} The sessions data
 */
const getSessionsByDomain = async (domain) => {
    return apiRequest(`/api/sessions/domain/${domain}`);
};

/**
 * Get a single session by ID
 * @param {string} id - The session ID
 * @returns {Promise<Object>} The session data
 */
const getSession = async (id) => {
    return apiRequest(`/api/sessions/${id}`);
};

/**
 * Create a new session
 * @param {Object} sessionData - The session data
 * @returns {Promise<Object>} The response data
 */
const createSession = async (sessionData) => {
    return apiRequest("/api/sessions", {
        method: "POST",
        body: JSON.stringify(sessionData),
    });
};

/**
 * Update a session
 * @param {string} id - The session ID
 * @param {Object} sessionData - The session data
 * @returns {Promise<Object>} The response data
 */
const updateSession = async (id, sessionData) => {
    return apiRequest(`/api/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify(sessionData),
    });
};

/**
 * Update last used timestamp
 * @param {string} id - The session ID
 * @returns {Promise<Object>} The response data
 */
const updateLastUsed = async (id) => {
    return apiRequest(`/api/sessions/${id}/lastUsed`, {
        method: "PATCH",
    });
};

/**
 * Delete a session
 * @param {string} id - The session ID
 * @returns {Promise<Object>} The response data
 */
const deleteSession = async (id) => {
    return apiRequest(`/api/sessions/${id}`, {
        method: "DELETE",
    });
};

module.exports = {
    register,
    login,
    getCurrentUser,
    getSessions,
    getSessionsByDomain,
    getSession,
    createSession,
    updateSession,
    updateLastUsed,
    deleteSession,
};
