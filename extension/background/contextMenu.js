/**
 * Context Menu
 * Handles the creation and management of context menu items
 */

import { saveSession } from './sessionManager';
import { extractDomain } from '../utils/domainUtils';

/**
 * Set up the context menu
 */
export const setupContextMenu = () => {
  // Remove existing items to avoid duplicates
  chrome.contextMenus.removeAll();
  
  // Create "Save Session for this Site" context menu item
  chrome.contextMenus.create({
    id: 'saveSession',
    title: 'Session Sync Pro: Save session for this site',
    contexts: ['page'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  });
  
  // Listen for context menu clicks
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'saveSession') {
      try {
        // Check if the site is blacklisted
        const { blacklist } = await chrome.storage.local.get('blacklist');
        const domain = extractDomain(tab.url);
        
        if (blacklist.includes(domain)) {
          // Show notification that site is blacklisted
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/icon128.png',
            title: 'Session Sync Pro',
            message: `Cannot save session for ${domain} because it is blacklisted.`
          });
          return;
        }
        
        // Prompt user for session name
        chrome.tabs.sendMessage(tab.id, { action: 'promptSessionName' }, async (response) => {
          if (response && response.name) {
            try {
              // Save the session
              await saveSession(domain, response.name);
              
              // Show success notification
              chrome.notifications.create({
                type: 'basic',
                iconUrl: '/assets/icon128.png',
                title: 'Session Sync Pro',
                message: `Session "${response.name}" saved for ${domain}`
              });
            } catch (error) {
              console.error('Error saving session:', error);
              
              // Show error notification
              chrome.notifications.create({
                type: 'basic',
                iconUrl: '/assets/icon128.png',
                title: 'Session Sync Pro',
                message: `Error saving session: ${error.message}`
              });
            }
          }
        });
      } catch (error) {
        console.error('Error handling context menu click:', error);
      }
    }
  });
};
