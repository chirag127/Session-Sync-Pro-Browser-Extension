/**
 * Session Manager Service for Session Sync Pro
 * Handles saving, restoring, and managing browser sessions
 */

import api from './api.js';

class SessionManager {
  constructor() {
    // Local cache of sessions
    this.sessions = [];
    this.isOffline = false;
    this.pendingSync = [];
  }

  /**
   * Initialize the session manager
   * Loads sessions from local storage and syncs with backend if online
   */
  async init() {
    try {
      // Load sessions from local storage
      const data = await chrome.storage.local.get('sessions');
      if (data.sessions) {
        this.sessions = data.sessions;
      }

      // Check network status
      this.isOffline = !navigator.onLine;
      
      // Set up network status listeners
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Load pending sync operations
      const pendingData = await chrome.storage.local.get('pendingSync');
      if (pendingData.pendingSync) {
        this.pendingSync = pendingData.pendingSync;
      }
      
      // If online, sync with backend
      if (!this.isOffline) {
        await this.syncWithBackend();
      }
    } catch (error) {
      console.error('Error initializing session manager:', error);
    }
  }

  /**
   * Handle online event
   */
  async handleOnline() {
    this.isOffline = false;
    await this.syncWithBackend();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOffline = true;
  }

  /**
   * Save sessions to local storage
   */
  async saveToLocalStorage() {
    await chrome.storage.local.set({ sessions: this.sessions });
  }

  /**
   * Save pending sync operations to local storage
   */
  async savePendingSync() {
    await chrome.storage.local.set({ pendingSync: this.pendingSync });
  }

  /**
   * Add a pending sync operation
   * @param {string} operation - Operation type (create, update, delete)
   * @param {Object} data - Operation data
   */
  async addPendingSync(operation, data) {
    this.pendingSync.push({
      operation,
      data,
      timestamp: Date.now()
    });
    await this.savePendingSync();
  }

  /**
   * Sync with backend
   * Uploads local changes and downloads remote changes
   */
  async syncWithBackend() {
    try {
      // Process pending sync operations
      if (this.pendingSync.length > 0) {
        for (const item of [...this.pendingSync]) {
          try {
            if (item.operation === 'create') {
              await api.createSession(item.data);
            } else if (item.operation === 'update') {
              await api.updateSession(item.data.id, item.data.sessionData);
            } else if (item.operation === 'delete') {
              await api.deleteSession(item.data.id);
            }
            
            // Remove from pending queue if successful
            this.pendingSync = this.pendingSync.filter(i => i !== item);
          } catch (error) {
            console.error('Error processing sync operation:', error);
            // Keep in queue to retry later
          }
        }
        
        // Save updated pending queue
        await this.savePendingSync();
      }
      
      // Get all sessions from backend
      const remoteSessions = await api.getAllSessions();
      
      // Simple last-write-wins conflict resolution
      // For each remote session, check if it exists locally
      // If it does, compare timestamps and keep the newer one
      // If it doesn't, add it to local sessions
      
      const mergedSessions = [...this.sessions];
      
      for (const remoteSession of remoteSessions) {
        const localIndex = mergedSessions.findIndex(s => s._id === remoteSession._id);
        
        if (localIndex >= 0) {
          // Session exists locally, compare timestamps
          const localSession = mergedSessions[localIndex];
          const remoteUpdatedAt = new Date(remoteSession.updatedAt).getTime();
          const localUpdatedAt = new Date(localSession.updatedAt).getTime();
          
          if (remoteUpdatedAt > localUpdatedAt) {
            // Remote is newer, replace local
            mergedSessions[localIndex] = remoteSession;
          }
        } else {
          // Session doesn't exist locally, add it
          mergedSessions.push(remoteSession);
        }
      }
      
      // Update local sessions
      this.sessions = mergedSessions;
      await this.saveToLocalStorage();
      
      return true;
    } catch (error) {
      console.error('Error syncing with backend:', error);
      return false;
    }
  }

  /**
   * Get all sessions
   * @returns {Array} Array of session objects
   */
  getAllSessions() {
    return this.sessions;
  }

  /**
   * Get sessions for a specific domain
   * @param {string} domain - Website domain
   * @returns {Array} Array of session objects for the domain
   */
  getSessionsByDomain(domain) {
    return this.sessions.filter(session => session.domain === domain);
  }

  /**
   * Get a session by ID
   * @param {string} id - Session ID
   * @returns {Object|null} Session object or null if not found
   */
  getSessionById(id) {
    return this.sessions.find(session => session._id === id) || null;
  }

  /**
   * Create a new session
   * @param {Object} sessionData - Session data
   * @returns {Object} Created session
   */
  async createSession(sessionData) {
    try {
      // Generate a temporary ID for offline mode
      const tempId = 'temp_' + Date.now();
      const newSession = {
        ...sessionData,
        _id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsed: null
      };
      
      // Add to local sessions
      this.sessions.push(newSession);
      await this.saveToLocalStorage();
      
      // If online, sync with backend
      if (!this.isOffline) {
        try {
          const response = await api.createSession(sessionData);
          
          // Replace temporary session with the one from the server
          this.sessions = this.sessions.map(s => 
            s._id === tempId ? response.session : s
          );
          await this.saveToLocalStorage();
          
          return response.session;
        } catch (error) {
          // If sync fails, add to pending queue
          await this.addPendingSync('create', sessionData);
          console.error('Error creating session on backend:', error);
          return newSession;
        }
      } else {
        // If offline, add to pending queue
        await this.addPendingSync('create', sessionData);
        return newSession;
      }
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update a session
   * @param {string} id - Session ID
   * @param {Object} sessionData - Updated session data
   * @returns {Object} Updated session
   */
  async updateSession(id, sessionData) {
    try {
      // Find session in local cache
      const index = this.sessions.findIndex(s => s._id === id);
      if (index === -1) {
        throw new Error('Session not found');
      }
      
      // Update session
      const updatedSession = {
        ...this.sessions[index],
        ...sessionData,
        updatedAt: new Date().toISOString()
      };
      
      this.sessions[index] = updatedSession;
      await this.saveToLocalStorage();
      
      // If online, sync with backend
      if (!this.isOffline) {
        try {
          const response = await api.updateSession(id, sessionData);
          return response.session;
        } catch (error) {
          // If sync fails, add to pending queue
          await this.addPendingSync('update', { id, sessionData });
          console.error('Error updating session on backend:', error);
          return updatedSession;
        }
      } else {
        // If offline, add to pending queue
        await this.addPendingSync('update', { id, sessionData });
        return updatedSession;
      }
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Update last used timestamp for a session
   * @param {string} id - Session ID
   * @returns {Object} Updated session
   */
  async updateLastUsed(id) {
    try {
      // Find session in local cache
      const index = this.sessions.findIndex(s => s._id === id);
      if (index === -1) {
        throw new Error('Session not found');
      }
      
      // Update last used timestamp
      const updatedSession = {
        ...this.sessions[index],
        lastUsed: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.sessions[index] = updatedSession;
      await this.saveToLocalStorage();
      
      // If online, sync with backend
      if (!this.isOffline) {
        try {
          await api.updateLastUsed(id);
        } catch (error) {
          // If sync fails, add to pending queue
          await this.addPendingSync('update', { 
            id, 
            sessionData: { lastUsed: updatedSession.lastUsed } 
          });
          console.error('Error updating last used on backend:', error);
        }
      } else {
        // If offline, add to pending queue
        await this.addPendingSync('update', { 
          id, 
          sessionData: { lastUsed: updatedSession.lastUsed } 
        });
      }
      
      return updatedSession;
    } catch (error) {
      console.error('Error updating last used:', error);
      throw error;
    }
  }

  /**
   * Delete a session
   * @param {string} id - Session ID
   * @returns {boolean} Success status
   */
  async deleteSession(id) {
    try {
      // Remove from local cache
      this.sessions = this.sessions.filter(s => s._id !== id);
      await this.saveToLocalStorage();
      
      // If online, sync with backend
      if (!this.isOffline) {
        try {
          await api.deleteSession(id);
        } catch (error) {
          // If sync fails, add to pending queue
          await this.addPendingSync('delete', { id });
          console.error('Error deleting session on backend:', error);
        }
      } else {
        // If offline, add to pending queue
        await this.addPendingSync('delete', { id });
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Capture the current session for a domain
   * @param {string} domain - Website domain
   * @param {string} name - Session name
   * @returns {Promise<Object>} Captured session data
   */
  async captureSession(domain, name) {
    try {
      // Get all cookies for the domain
      const cookies = await this.getCookiesForDomain(domain);
      
      // Check if any cookies are HttpOnly
      const hasHttpOnlyCookies = cookies.some(cookie => cookie.httpOnly);
      
      // Get localStorage and sessionStorage
      const storageData = await this.getStorageForDomain(domain);
      
      // Create session data
      const sessionData = {
        name,
        domain,
        cookies,
        localStorage: storageData.localStorage,
        sessionStorage: storageData.sessionStorage,
        hasHttpOnlyCookies
      };
      
      return await this.createSession(sessionData);
    } catch (error) {
      console.error('Error capturing session:', error);
      throw error;
    }
  }

  /**
   * Restore a session
   * @param {string} id - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async restoreSession(id) {
    try {
      // Get session data
      const session = this.getSessionById(id);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if domain matches
      const tabDomain = new URL(tab.url).hostname;
      if (tabDomain !== session.domain) {
        // Open a new tab with the correct domain
        const newTab = await chrome.tabs.create({ url: `https://${session.domain}` });
        
        // Wait for the tab to load
        await new Promise(resolve => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === newTab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          });
        });
        
        // Update tab reference
        const [updatedTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tab = updatedTab;
      }
      
      // Clear existing cookies
      await this.clearCookiesForDomain(session.domain);
      
      // Set new cookies
      await this.setCookiesForDomain(session.cookies);
      
      // Clear and set localStorage and sessionStorage
      await this.setStorageForDomain(tab.id, session.domain, session.localStorage, session.sessionStorage);
      
      // Update last used timestamp
      await this.updateLastUsed(id);
      
      // Reload the page
      await chrome.tabs.reload(tab.id);
      
      return true;
    } catch (error) {
      console.error('Error restoring session:', error);
      throw error;
    }
  }

  /**
   * Auto-save the current session before restoring another
   * @param {string} domain - Website domain
   * @returns {Promise<Object>} Saved session
   */
  async autoSaveCurrentSession(domain) {
    try {
      const timestamp = new Date().toLocaleString();
      const name = `Pre-Restore Auto-Save (${timestamp})`;
      return await this.captureSession(domain, name);
    } catch (error) {
      console.error('Error auto-saving session:', error);
      throw error;
    }
  }

  /**
   * Get all cookies for a domain
   * @param {string} domain - Website domain
   * @returns {Promise<Array>} Array of cookie objects
   */
  async getCookiesForDomain(domain) {
    try {
      return await chrome.cookies.getAll({ domain });
    } catch (error) {
      console.error('Error getting cookies:', error);
      throw error;
    }
  }

  /**
   * Clear all cookies for a domain
   * @param {string} domain - Website domain
   * @returns {Promise<void>}
   */
  async clearCookiesForDomain(domain) {
    try {
      const cookies = await this.getCookiesForDomain(domain);
      
      for (const cookie of cookies) {
        const url = `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({
          url,
          name: cookie.name
        });
      }
    } catch (error) {
      console.error('Error clearing cookies:', error);
      throw error;
    }
  }

  /**
   * Set cookies for a domain
   * @param {Array} cookies - Array of cookie objects
   * @returns {Promise<void>}
   */
  async setCookiesForDomain(cookies) {
    try {
      for (const cookie of cookies) {
        // Create a new cookie object with the required properties
        const newCookie = {
          url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
          expirationDate: cookie.expirationDate
        };
        
        await chrome.cookies.set(newCookie);
      }
    } catch (error) {
      console.error('Error setting cookies:', error);
      throw error;
    }
  }

  /**
   * Get localStorage and sessionStorage for a domain
   * @param {string} domain - Website domain
   * @returns {Promise<Object>} Object with localStorage and sessionStorage
   */
  async getStorageForDomain(domain) {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Execute content script to get storage data
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Get localStorage
          const localStorage = {};
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            localStorage[key] = window.localStorage.getItem(key);
          }
          
          // Get sessionStorage
          const sessionStorage = {};
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const key = window.sessionStorage.key(i);
            sessionStorage[key] = window.sessionStorage.getItem(key);
          }
          
          return { localStorage, sessionStorage };
        }
      });
      
      return result[0].result;
    } catch (error) {
      console.error('Error getting storage:', error);
      throw error;
    }
  }

  /**
   * Set localStorage and sessionStorage for a domain
   * @param {number} tabId - Tab ID
   * @param {string} domain - Website domain
   * @param {Object} localStorage - localStorage data
   * @param {Object} sessionStorage - sessionStorage data
   * @returns {Promise<void>}
   */
  async setStorageForDomain(tabId, domain, localStorage, sessionStorage) {
    try {
      // Execute content script to set storage data
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (localStorage, sessionStorage) => {
          // Clear existing storage
          window.localStorage.clear();
          window.sessionStorage.clear();
          
          // Set localStorage
          for (const [key, value] of Object.entries(localStorage)) {
            window.localStorage.setItem(key, value);
          }
          
          // Set sessionStorage
          for (const [key, value] of Object.entries(sessionStorage)) {
            window.sessionStorage.setItem(key, value);
          }
        },
        args: [localStorage, sessionStorage]
      });
    } catch (error) {
      console.error('Error setting storage:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const sessionManager = new SessionManager();
export default sessionManager;
