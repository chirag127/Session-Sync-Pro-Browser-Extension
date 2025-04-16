/**
 * Background script for Session Sync Pro extension
 * Handles initialization, context menu setup, and message handling
 */

import { setupContextMenu } from './contextMenu';
import { setupSyncManager } from './syncManager';
import { saveSession, restoreSession, deleteSession } from './sessionManager';

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Session Sync Pro extension installed or updated');
  
  // Set up context menu
  setupContextMenu();
  
  // Initialize storage if needed
  const storage = await chrome.storage.local.get(['sessions', 'blacklist']);
  
  if (!storage.sessions) {
    await chrome.storage.local.set({ sessions: [] });
  }
  
  if (!storage.blacklist) {
    await chrome.storage.local.set({ blacklist: [] });
  }
});

// Set up sync manager
setupSyncManager();

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Use async function to handle messages
  const handleMessage = async () => {
    try {
      switch (message.action) {
        case 'saveSession':
          const savedSession = await saveSession(message.domain, message.name);
          return { success: true, session: savedSession };
          
        case 'restoreSession':
          await restoreSession(message.session);
          return { success: true };
          
        case 'deleteSession':
          await deleteSession(message.sessionId);
          return { success: true };
          
        case 'checkBlacklist':
          const { blacklist } = await chrome.storage.local.get('blacklist');
          const isBlacklisted = blacklist.includes(message.domain);
          return { isBlacklisted };
          
        default:
          return { success: false, error: 'Unknown action' };
      }
    } catch (error) {
      console.error('Error handling message:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Handle the message and send response
  handleMessage().then(sendResponse);
  
  // Return true to indicate we will send a response asynchronously
  return true;
});
