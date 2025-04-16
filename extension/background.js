/**
 * Background Script for Session Sync Pro
 * Handles background tasks, context menu, and event listeners
 */

// Initialize context menu
function initContextMenu() {
  chrome.contextMenus.create({
    id: 'save-session',
    title: 'Save current session for %s',
    contexts: ['page'],
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-session') {
    try {
      // Get domain from tab URL
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      // Open popup to save session
      await chrome.action.openPopup();
      
      // Send message to popup to show save modal
      chrome.runtime.sendMessage({
        action: 'showSaveModal',
        domain
      });
    } catch (error) {
      console.error('Context menu error:', error);
    }
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureSession') {
    // This will be handled by the popup directly
    sendResponse({ success: true });
  } else if (message.action === 'restoreSession') {
    // This will be handled by the popup directly
    sendResponse({ success: true });
  }
  
  // Return true to indicate async response
  return true;
});

// Set up alarm for periodic sync
chrome.alarms.create('syncAlarm', {
  periodInMinutes: 15 // Sync every 15 minutes
});

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncAlarm') {
    try {
      // Check if user is authenticated
      const data = await chrome.storage.local.get('authToken');
      if (!data.authToken) {
        return;
      }
      
      // Check if online
      if (!navigator.onLine) {
        return;
      }
      
      // Get pending sync operations
      const pendingData = await chrome.storage.local.get('pendingSync');
      if (pendingData.pendingSync && pendingData.pendingSync.length > 0) {
        // Send message to popup to sync
        chrome.runtime.sendMessage({
          action: 'syncWithBackend'
        });
      }
    } catch (error) {
      console.error('Sync alarm error:', error);
    }
  }
});

// Initialize extension
function init() {
  // Initialize context menu
  initContextMenu();
}

// Run initialization
init();
