/**
 * API Utilities
 * Helper functions for making API requests to the backend
 */

// Base URL for API requests
export const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Make an API request
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - The response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // Get auth token from storage
    const { authToken } = await chrome.storage.local.get('authToken');
    
    // Set default options
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add auth token if available
    if (authToken) {
      defaultOptions.headers.Authorization = `Bearer ${authToken}`;
    }
    
    // Merge options
    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    // Make request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    
    // Parse response
    const data = await response.json();
    
    // Check for errors
    if (!response.ok) {
      throw new Error(data.error || `API error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - The response data
 */
export const register = async (email, password) => {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - The response data
 */
export const login = async (email, password) => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

/**
 * Get the current user
 * @returns {Promise<Object>} - The response data
 */
export const getCurrentUser = async () => {
  return apiRequest('/auth/me');
};

/**
 * Get all sessions
 * @returns {Promise<Object>} - The response data
 */
export const getSessions = async () => {
  return apiRequest('/sessions');
};

/**
 * Get sessions for a specific domain
 * @param {string} domain - The domain to get sessions for
 * @returns {Promise<Object>} - The response data
 */
export const getSessionsByDomain = async (domain) => {
  return apiRequest(`/sessions/domain/${domain}`);
};

/**
 * Create a new session
 * @param {Object} session - The session to create
 * @returns {Promise<Object>} - The response data
 */
export const createSession = async (session) => {
  return apiRequest('/sessions', {
    method: 'POST',
    body: JSON.stringify(session)
  });
};

/**
 * Update a session
 * @param {string} id - The ID of the session to update
 * @param {Object} session - The updated session data
 * @returns {Promise<Object>} - The response data
 */
export const updateSession = async (id, session) => {
  return apiRequest(`/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(session)
  });
};

/**
 * Update the last used timestamp for a session
 * @param {string} id - The ID of the session to update
 * @returns {Promise<Object>} - The response data
 */
export const updateSessionLastUsed = async (id) => {
  return apiRequest(`/sessions/${id}/lastUsed`, {
    method: 'PATCH'
  });
};

/**
 * Delete a session
 * @param {string} id - The ID of the session to delete
 * @returns {Promise<Object>} - The response data
 */
export const deleteSession = async (id) => {
  return apiRequest(`/sessions/${id}`, {
    method: 'DELETE'
  });
};
