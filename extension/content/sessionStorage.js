/**
 * Content script for Session Sync Pro
 * Handles access to localStorage and sessionStorage
 * Also handles session name prompts
 */

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'promptSessionName') {
    // Create a modal to prompt for session name
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2147483647;
      font-family: Arial, sans-serif;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      width: 300px;
      max-width: 80%;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Save Session';
    title.style.cssText = `
      margin-top: 0;
      color: #4a6cf7;
      font-size: 18px;
    `;
    
    const description = document.createElement('p');
    description.textContent = 'Enter a name for this session:';
    description.style.cssText = `
      margin-bottom: 15px;
      font-size: 14px;
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Session name';
    input.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
      font-size: 14px;
    `;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      padding: 8px 16px;
      margin-right: 8px;
      background-color: #f1f1f1;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.cssText = `
      padding: 8px 16px;
      background-color: #4a6cf7;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    
    // Add event listeners
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      sendResponse({ cancelled: true });
    });
    
    saveButton.addEventListener('click', () => {
      const name = input.value.trim();
      if (name) {
        document.body.removeChild(modal);
        sendResponse({ name });
      } else {
        input.style.border = '1px solid red';
      }
    });
    
    // Handle Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveButton.click();
      }
    });
    
    // Assemble the modal
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(saveButton);
    
    modalContent.appendChild(title);
    modalContent.appendChild(description);
    modalContent.appendChild(input);
    modalContent.appendChild(buttonContainer);
    
    modal.appendChild(modalContent);
    
    // Add to page and focus input
    document.body.appendChild(modal);
    input.focus();
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});
