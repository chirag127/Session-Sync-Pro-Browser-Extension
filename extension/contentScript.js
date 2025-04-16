/**
 * Content Script for Session Sync Pro
 * Handles interactions with the webpage DOM
 */

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStorage') {
    // Get localStorage and sessionStorage
    const storage = getStorage();
    sendResponse({ success: true, data: storage });
  } else if (message.action === 'setStorage') {
    // Set localStorage and sessionStorage
    const success = setStorage(message.localStorage, message.sessionStorage);
    sendResponse({ success });
  }
  
  // Return true to indicate async response
  return true;
});

/**
 * Get localStorage and sessionStorage
 * @returns {Object} Object with localStorage and sessionStorage
 */
function getStorage() {
  try {
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
  } catch (error) {
    console.error('Error getting storage:', error);
    return { localStorage: {}, sessionStorage: {} };
  }
}

/**
 * Set localStorage and sessionStorage
 * @param {Object} localStorage - localStorage data
 * @param {Object} sessionStorage - sessionStorage data
 * @returns {boolean} Success status
 */
function setStorage(localStorage, sessionStorage) {
  try {
    // Clear existing storage
    window.localStorage.clear();
    window.sessionStorage.clear();
    
    // Set localStorage
    if (localStorage) {
      for (const [key, value] of Object.entries(localStorage)) {
        window.localStorage.setItem(key, value);
      }
    }
    
    // Set sessionStorage
    if (sessionStorage) {
      for (const [key, value] of Object.entries(sessionStorage)) {
        window.sessionStorage.setItem(key, value);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error setting storage:', error);
    return false;
  }
}
