/**
 * API Service for Session Sync Pro
 * Handles all communication with the backend server
 */

class ApiService {
  constructor() {
    // API base URL - should be configurable in production
    this.baseUrl = 'http://localhost:3000/api';
    this.token = null;
  }

  /**
   * Initialize the API service
   * Loads the authentication token from storage if available
   */
  async init() {
    try {
      const data = await chrome.storage.local.get('authToken');
      if (data.authToken) {
        this.token = data.authToken;
      }
    } catch (error) {
      console.error('Error initializing API service:', error);
    }
  }

  /**
   * Set the authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    chrome.storage.local.set({ authToken: token });
  }

  /**
   * Clear the authentication token
   */
  clearToken() {
    this.token = null;
    chrome.storage.local.remove('authToken');
  }

  /**
   * Get request headers
   * @returns {Object} Headers object
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make an API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Response with token and user data
   */
  async register(email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Response with token and user data
   */
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * Get current user data
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  /**
   * Get all sessions
   * @returns {Promise<Array>} Array of session objects
   */
  async getAllSessions() {
    return await this.request('/sessions');
  }

  /**
   * Get sessions for a specific domain
   * @param {string} domain - Website domain
   * @returns {Promise<Array>} Array of session objects for the domain
   */
  async getSessionsByDomain(domain) {
    return await this.request(`/sessions/domain/${encodeURIComponent(domain)}`);
  }

  /**
   * Get a session by ID
   * @param {string} id - Session ID
   * @returns {Promise<Object>} Session object
   */
  async getSessionById(id) {
    return await this.request(`/sessions/${id}`);
  }

  /**
   * Create a new session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Created session
   */
  async createSession(sessionData) {
    return await this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  /**
   * Update a session
   * @param {string} id - Session ID
   * @param {Object} sessionData - Updated session data
   * @returns {Promise<Object>} Updated session
   */
  async updateSession(id, sessionData) {
    return await this.request(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData)
    });
  }

  /**
   * Update last used timestamp for a session
   * @param {string} id - Session ID
   * @returns {Promise<Object>} Updated session
   */
  async updateLastUsed(id) {
    return await this.request(`/sessions/${id}/lastUsed`, {
      method: 'PATCH'
    });
  }

  /**
   * Delete a session
   * @param {string} id - Session ID
   * @returns {Promise<Object>} Response message
   */
  async deleteSession(id) {
    return await this.request(`/sessions/${id}`, {
      method: 'DELETE'
    });
  }
}

// Create and export a singleton instance
const api = new ApiService();
export default api;
