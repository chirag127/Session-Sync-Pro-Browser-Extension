/**
 * Storage Utilities
 * Helper functions for working with chrome.storage
 */

/**
 * Get all sessions from storage
 * @returns {Promise<Array>} - Array of sessions
 */
export const getSessions = async () => {
  const { sessions } = await chrome.storage.local.get('sessions');
  return sessions || [];
};

/**
 * Get sessions for a specific domain
 * @param {string} domain - The domain to get sessions for
 * @returns {Promise<Array>} - Array of sessions for the domain
 */
export const getSessionsByDomain = async (domain) => {
  const sessions = await getSessions();
  return sessions.filter(session => session.domain === domain);
};

/**
 * Get a session by ID
 * @param {string} id - The ID of the session to get
 * @returns {Promise<Object|null>} - The session or null if not found
 */
export const getSessionById = async (id) => {
  const sessions = await getSessions();
  return sessions.find(session => session.id === id) || null;
};

/**
 * Save a session to storage
 * @param {Object} session - The session to save
 * @returns {Promise<void>}
 */
export const saveSession = async (session) => {
  const sessions = await getSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  
  if (existingIndex !== -1) {
    // Update existing session
    sessions[existingIndex] = session;
  } else {
    // Add new session
    sessions.push(session);
  }
  
  await chrome.storage.local.set({ sessions });
};

/**
 * Delete a session from storage
 * @param {string} id - The ID of the session to delete
 * @returns {Promise<void>}
 */
export const deleteSession = async (id) => {
  const sessions = await getSessions();
  const updatedSessions = sessions.filter(session => session.id !== id);
  await chrome.storage.local.set({ sessions: updatedSessions });
};

/**
 * Get the blacklist from storage
 * @returns {Promise<Array>} - Array of blacklisted domains
 */
export const getBlacklist = async () => {
  const { blacklist } = await chrome.storage.local.get('blacklist');
  return blacklist || [];
};

/**
 * Add a domain to the blacklist
 * @param {string} domain - The domain to add to the blacklist
 * @returns {Promise<void>}
 */
export const addToBlacklist = async (domain) => {
  const blacklist = await getBlacklist();
  
  // Check if domain is already in blacklist
  if (!blacklist.includes(domain)) {
    blacklist.push(domain);
    await chrome.storage.local.set({ blacklist });
  }
};

/**
 * Remove a domain from the blacklist
 * @param {string} domain - The domain to remove from the blacklist
 * @returns {Promise<void>}
 */
export const removeFromBlacklist = async (domain) => {
  const blacklist = await getBlacklist();
  const updatedBlacklist = blacklist.filter(d => d !== domain);
  await chrome.storage.local.set({ blacklist: updatedBlacklist });
};

/**
 * Check if a domain is blacklisted
 * @param {string} domain - The domain to check
 * @returns {Promise<boolean>} - Whether the domain is blacklisted
 */
export const isDomainBlacklisted = async (domain) => {
  const blacklist = await getBlacklist();
  return blacklist.includes(domain);
};

/**
 * Get the auth token from storage
 * @returns {Promise<string|null>} - The auth token or null if not found
 */
export const getAuthToken = async () => {
  const { authToken } = await chrome.storage.local.get('authToken');
  return authToken || null;
};

/**
 * Save the auth token to storage
 * @param {string} token - The auth token to save
 * @returns {Promise<void>}
 */
export const saveAuthToken = async (token) => {
  await chrome.storage.local.set({ authToken: token });
};

/**
 * Clear the auth token from storage
 * @returns {Promise<void>}
 */
export const clearAuthToken = async () => {
  await chrome.storage.local.remove('authToken');
};
