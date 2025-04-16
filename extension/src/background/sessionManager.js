/**
 * Session Manager
 * Handles saving, restoring, and managing browser sessions
 */

import { v4 as uuidv4 } from 'uuid';
import { syncSession, syncDeleteSession } from './syncManager';
import { getCurrentTab, extractDomain } from '../utils/domainUtils';

/**
 * Save the current session for a domain
 * @param {string} domain - The domain to save the session for
 * @param {string} name - The name of the session
 * @returns {Promise<Object>} - The saved session object
 */
export const saveSession = async (domain, name) => {
  try {
    // Get the current tab
    const tab = await getCurrentTab();
    
    // If domain is not provided, extract it from the tab URL
    if (!domain) {
      domain = extractDomain(tab.url);
    }
    
    // Get favicon from the tab
    const faviconUrl = tab.favIconUrl || null;
    
    // Get cookies for the domain
    const cookies = await chrome.cookies.getAll({ domain });
    
    // Execute content script to get localStorage and sessionStorage
    const [{ result }] = await chrome.scripting.executeScript({
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
    
    // Check if there are HttpOnly cookies
    const hasHttpOnlyCookies = cookies.some(cookie => cookie.httpOnly);
    
    // Create session object
    const session = {
      id: uuidv4(),
      name,
      domain,
      faviconUrl,
      cookies,
      localStorage: result.localStorage,
      sessionStorage: result.sessionStorage,
      hasHttpOnlyCookies,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    // Save to local storage
    const { sessions } = await chrome.storage.local.get('sessions');
    const updatedSessions = [...sessions, session];
    await chrome.storage.local.set({ sessions: updatedSessions });
    
    // Sync to server if user is logged in
    const { authToken } = await chrome.storage.local.get('authToken');
    if (authToken) {
      await syncSession(session);
    }
    
    return session;
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

/**
 * Restore a session
 * @param {Object} session - The session to restore
 * @returns {Promise<void>}
 */
export const restoreSession = async (session) => {
  try {
    // Get the current tab
    const tab = await getCurrentTab();
    
    // Check if the current tab is on the same domain
    const currentDomain = extractDomain(tab.url);
    if (currentDomain !== session.domain) {
      // If not, create a new tab with the domain
      await chrome.tabs.create({ url: `https://${session.domain}` });
      // Wait for the tab to load
      return new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            // Get the new tab
            chrome.tabs.query({ active: true, currentWindow: true }, async ([newTab]) => {
              // Restore the session in the new tab
              await restoreSessionInTab(session, newTab);
              resolve();
            });
          }
        });
      });
    } else {
      // Restore the session in the current tab
      await restoreSessionInTab(session, tab);
    }
    
    // Update last used timestamp
    await updateSessionLastUsed(session.id);
  } catch (error) {
    console.error('Error restoring session:', error);
    throw error;
  }
};

/**
 * Restore a session in a specific tab
 * @param {Object} session - The session to restore
 * @param {Object} tab - The tab to restore the session in
 * @returns {Promise<void>}
 */
const restoreSessionInTab = async (session, tab) => {
  try {
    // Clear existing cookies for the domain
    const existingCookies = await chrome.cookies.getAll({ domain: session.domain });
    for (const cookie of existingCookies) {
      await chrome.cookies.remove({
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name
      });
    }
    
    // Set cookies from the session
    for (const cookie of session.cookies) {
      // Skip secure cookies on non-secure connections
      if (cookie.secure && tab.url.startsWith('http:')) continue;
      
      // Create cookie object
      const cookieData = {
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expirationDate: cookie.expirationDate
      };
      
      // Set the cookie
      await chrome.cookies.set(cookieData);
    }
    
    // Execute content script to set localStorage and sessionStorage
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (localStorage, sessionStorage) => {
        // Clear existing localStorage
        window.localStorage.clear();
        
        // Set localStorage from the session
        for (const [key, value] of Object.entries(localStorage)) {
          window.localStorage.setItem(key, value);
        }
        
        // Clear existing sessionStorage
        window.sessionStorage.clear();
        
        // Set sessionStorage from the session
        for (const [key, value] of Object.entries(sessionStorage)) {
          window.sessionStorage.setItem(key, value);
        }
        
        return true;
      },
      args: [session.localStorage, session.sessionStorage]
    });
    
    // Reload the page to apply changes
    await chrome.tabs.reload(tab.id);
  } catch (error) {
    console.error('Error restoring session in tab:', error);
    throw error;
  }
};

/**
 * Delete a session
 * @param {string} sessionId - The ID of the session to delete
 * @returns {Promise<void>}
 */
export const deleteSession = async (sessionId) => {
  try {
    // Get sessions from local storage
    const { sessions } = await chrome.storage.local.get('sessions');
    
    // Find the session to delete
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }
    
    // Remove the session
    const deletedSession = sessions[sessionIndex];
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    await chrome.storage.local.set({ sessions: updatedSessions });
    
    // Sync deletion to server if user is logged in
    const { authToken } = await chrome.storage.local.get('authToken');
    if (authToken && deletedSession.serverId) {
      await syncDeleteSession(deletedSession.serverId);
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

/**
 * Update the last used timestamp for a session
 * @param {string} sessionId - The ID of the session to update
 * @returns {Promise<void>}
 */
export const updateSessionLastUsed = async (sessionId) => {
  try {
    // Get sessions from local storage
    const { sessions } = await chrome.storage.local.get('sessions');
    
    // Find the session to update
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }
    
    // Update the last used timestamp
    sessions[sessionIndex].lastUsed = new Date().toISOString();
    await chrome.storage.local.set({ sessions });
    
    // Sync to server if user is logged in
    const { authToken } = await chrome.storage.local.get('authToken');
    if (authToken && sessions[sessionIndex].serverId) {
      await syncSession(sessions[sessionIndex]);
    }
  } catch (error) {
    console.error('Error updating session last used:', error);
    throw error;
  }
};
