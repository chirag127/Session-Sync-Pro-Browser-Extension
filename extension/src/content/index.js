/**
 * Content script for Session Sync Pro
 */

// Create a notification container if it doesn't exist
let notificationContainer = document.getElementById('session-sync-pro-notification');

if (!notificationContainer) {
  notificationContainer = document.createElement('div');
  notificationContainer.id = 'session-sync-pro-notification';
  notificationContainer.style.position = 'fixed';
  notificationContainer.style.bottom = '20px';
  notificationContainer.style.right = '20px';
  notificationContainer.style.zIndex = '9999';
  document.body.appendChild(notificationContainer);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
  .session-sync-pro-notification {
    padding: 10px 20px;
    margin-bottom: 10px;
    border-radius: 4px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  .session-sync-pro-notification.show {
    opacity: 1;
    transform: translateY(0);
  }
  
  .session-sync-pro-notification.success {
    background-color: #28a745;
  }
  
  .session-sync-pro-notification.error {
    background-color: #dc3545;
  }
  
  .session-sync-pro-notification.warning {
    background-color: #ffc107;
    color: #343a40;
  }
  
  .session-sync-pro-notification.info {
    background-color: #4a6cf7;
  }
`;
document.head.appendChild(style);

/**
 * Show a notification
 * @param {string} message - The notification message
 * @param {string} type - The notification type (success, error, warning, info)
 */
const showNotification = (message, type = 'info') => {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `session-sync-pro-notification ${type}`;
  notification.textContent = message;
  
  // Add notification to container
  notificationContainer.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Hide and remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    
    // Remove notification after transition
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'notification') {
    showNotification(message.message, message.notificationType);
  }
});
