/**
 * Popup Script for Session Sync Pro
 * Handles the popup UI and interactions
 */

import './popup.css';
import { extractDomain, getCurrentTab, isDomainBlacklisted } from '../utils/domainUtils';
import { 
  getSessions, 
  getSessionsByDomain, 
  getBlacklist,
  getAuthToken
} from '../utils/storage';
import { 
  login, 
  register, 
  getCurrentUser 
} from '../utils/api';

// DOM Elements
const authStatusEl = document.querySelector('.auth-status');
const currentSiteEl = document.querySelector('.current-site');
const saveSessionBtn = document.getElementById('saveSessionBtn');
const sessionsListEl = document.querySelector('.sessions-list');
const syncStatusEl = document.querySelector('.sync-status');
const settingsBtn = document.getElementById('settingsBtn');

// Modals
const authModal = document.getElementById('authModal');
const sessionNameModal = document.getElementById('sessionNameModal');
const confirmationModal = document.getElementById('confirmationModal');

// Forms
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const sessionNameForm = document.getElementById('sessionNameForm');

// Current state
let currentTab = null;
let currentDomain = null;
let isBlacklisted = false;
let isLoggedIn = false;
let currentUser = null;

/**
 * Initialize the popup
 */
const initPopup = async () => {
  try {
    // Get current tab and domain
    currentTab = await getCurrentTab();
    currentDomain = extractDomain(currentTab.url);
    
    // Check if domain is blacklisted
    const blacklist = await getBlacklist();
    isBlacklisted = isDomainBlacklisted(currentDomain, blacklist);
    
    // Check if user is logged in
    const authToken = await getAuthToken();
    isLoggedIn = !!authToken;
    
    if (isLoggedIn) {
      try {
        const userData = await getCurrentUser();
        currentUser = userData.user;
      } catch (error) {
        console.error('Error getting current user:', error);
        // Token might be invalid, clear it
        await chrome.storage.local.remove('authToken');
        isLoggedIn = false;
      }
    }
    
    // Render UI
    renderAuthStatus();
    renderCurrentSite();
    renderSessions();
    renderSyncStatus();
    
    // Set up event listeners
    setupEventListeners();
    
  } catch (error) {
    console.error('Error initializing popup:', error);
    showToast('Error initializing popup', 'error');
  }
};

/**
 * Render the authentication status
 */
const renderAuthStatus = () => {
  if (isLoggedIn && currentUser) {
    authStatusEl.innerHTML = `
      <span class="user-email">${currentUser.email}</span>
      <button id="logoutBtn" class="btn text">Logout</button>
    `;
    
    // Add event listener to logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  } else {
    authStatusEl.innerHTML = `
      <button id="loginBtn" class="btn text">Login</button>
    `;
    
    // Add event listener to login button
    document.getElementById('loginBtn').addEventListener('click', () => {
      showModal(authModal);
    });
  }
};

/**
 * Render the current site information
 */
const renderCurrentSite = () => {
  if (currentTab && currentDomain) {
    const faviconUrl = currentTab.favIconUrl || '../assets/icon16.png';
    
    currentSiteEl.innerHTML = `
      <img src="${faviconUrl}" alt="${currentDomain}">
      <span class="domain">${currentDomain}</span>
      ${isBlacklisted ? '<span class="blacklisted-badge">Blacklisted</span>' : ''}
    `;
    
    // Disable save button if domain is blacklisted
    saveSessionBtn.disabled = isBlacklisted;
    if (isBlacklisted) {
      saveSessionBtn.title = 'This domain is blacklisted';
    }
  } else {
    currentSiteEl.innerHTML = `
      <span class="domain">No active tab</span>
    `;
    saveSessionBtn.disabled = true;
  }
};

/**
 * Render the sessions list
 */
const renderSessions = async () => {
  try {
    // Show loading state
    sessionsListEl.innerHTML = '<div class="loading">Loading sessions...</div>';
    
    // Get all sessions
    const sessions = await getSessions();
    
    if (sessions.length === 0) {
      sessionsListEl.innerHTML = `
        <div class="empty-state">
          <p>No saved sessions yet.</p>
          <p>Click "Save Current Session" to save your first session.</p>
        </div>
      `;
      return;
    }
    
    // Group sessions by domain
    const sessionsByDomain = {};
    sessions.forEach(session => {
      if (!sessionsByDomain[session.domain]) {
        sessionsByDomain[session.domain] = [];
      }
      sessionsByDomain[session.domain].push(session);
    });
    
    // Sort domains alphabetically
    const sortedDomains = Object.keys(sessionsByDomain).sort();
    
    // Build HTML
    let html = '';
    
    // If current domain has sessions, show them first
    if (currentDomain && sessionsByDomain[currentDomain]) {
      html += renderSessionGroup(currentDomain, sessionsByDomain[currentDomain]);
      delete sessionsByDomain[currentDomain];
    }
    
    // Render other domains
    sortedDomains.forEach(domain => {
      if (sessionsByDomain[domain]) {
        html += renderSessionGroup(domain, sessionsByDomain[domain]);
      }
    });
    
    sessionsListEl.innerHTML = html;
    
    // Add event listeners to session actions
    document.querySelectorAll('.restore-btn').forEach(btn => {
      btn.addEventListener('click', () => handleRestoreSession(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteSession(btn.dataset.id));
    });
    
  } catch (error) {
    console.error('Error rendering sessions:', error);
    sessionsListEl.innerHTML = `
      <div class="error">Error loading sessions. Please try again.</div>
    `;
  }
};

/**
 * Render a group of sessions for a domain
 * @param {string} domain - The domain
 * @param {Array} sessions - Array of sessions for the domain
 * @returns {string} - HTML for the session group
 */
const renderSessionGroup = (domain, sessions) => {
  // Sort sessions by last used date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(b.lastUsed) - new Date(a.lastUsed);
  });
  
  // Get favicon URL from the first session
  const faviconUrl = sortedSessions[0].faviconUrl || '../assets/icon16.png';
  
  let html = `
    <div class="session-group">
      <div class="session-group-header">
        <img src="${faviconUrl}" alt="${domain}">
        <span class="domain">${domain}</span>
      </div>
  `;
  
  // Render each session
  sortedSessions.forEach(session => {
    const lastUsed = new Date(session.lastUsed);
    const formattedDate = lastUsed.toLocaleDateString() + ' ' + lastUsed.toLocaleTimeString();
    
    html += `
      <div class="session-item">
        <div class="session-info">
          <div class="session-name">${session.name}</div>
          <div class="session-date">Last used: ${formattedDate}</div>
        </div>
        <div class="session-actions">
          ${session.hasHttpOnlyCookies ? '<span class="http-only-badge">HttpOnly</span>' : ''}
          <button class="btn icon delete-btn" data-id="${session.id}" title="Delete Session">🗑️</button>
          <button class="btn primary restore-btn" data-id="${session.id}">Restore</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
};

/**
 * Render the sync status
 */
const renderSyncStatus = () => {
  if (isLoggedIn) {
    syncStatusEl.innerHTML = `
      <span class="sync-icon">🔄</span>
      <span class="sync-message">Sessions are synced across your devices</span>
    `;
  } else {
    syncStatusEl.innerHTML = `
      <span class="sync-icon">⚠️</span>
      <span class="sync-message">Sessions are stored locally only. <a href="#" id="loginForSyncBtn">Login to sync</a></span>
    `;
    
    // Add event listener to login link
    document.getElementById('loginForSyncBtn').addEventListener('click', () => {
      showModal(authModal);
    });
  }
};

/**
 * Set up event listeners
 */
const setupEventListeners = () => {
  // Save session button
  saveSessionBtn.addEventListener('click', handleSaveSession);
  
  // Settings button
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Auth modal tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all tabs and content
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
  
  // Close buttons for modals
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });
  
  // Login form
  loginForm.addEventListener('submit', handleLogin);
  
  // Register form
  registerForm.addEventListener('submit', handleRegister);
  
  // Session name form
  sessionNameForm.addEventListener('submit', handleSessionNameSubmit);
};

/**
 * Handle saving a session
 */
const handleSaveSession = () => {
  // Show session name modal
  showModal(sessionNameModal);
  document.getElementById('sessionName').focus();
};

/**
 * Handle session name form submission
 * @param {Event} e - Form submit event
 */
const handleSessionNameSubmit = async (e) => {
  e.preventDefault();
  
  const sessionName = document.getElementById('sessionName').value.trim();
  
  if (!sessionName) {
    document.querySelector('#sessionNameForm .form-error').textContent = 'Please enter a session name';
    return;
  }
  
  try {
    // Show loading state
    const submitBtn = sessionNameForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    // Send message to background script to save session
    const response = await chrome.runtime.sendMessage({
      action: 'saveSession',
      domain: currentDomain,
      name: sessionName
    });
    
    if (response.success) {
      // Close modal
      closeAllModals();
      
      // Show success message
      showToast(`Session "${sessionName}" saved for ${currentDomain}`, 'success');
      
      // Reset form
      sessionNameForm.reset();
      
      // Refresh sessions list
      renderSessions();
    } else {
      throw new Error(response.error || 'Failed to save session');
    }
  } catch (error) {
    console.error('Error saving session:', error);
    document.querySelector('#sessionNameForm .form-error').textContent = error.message;
  } finally {
    // Reset button
    const submitBtn = sessionNameForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Save';
    submitBtn.disabled = false;
  }
};

/**
 * Handle restoring a session
 * @param {string} sessionId - ID of the session to restore
 */
const handleRestoreSession = async (sessionId) => {
  try {
    // Get the session
    const sessions = await getSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // If current domain matches session domain, show confirmation
    if (currentDomain === session.domain) {
      showConfirmationModal(
        `Restoring this session will replace your current session data for ${session.domain}. Are you sure?`,
        async () => {
          await restoreSession(session);
        }
      );
    } else {
      // Otherwise, restore directly
      await restoreSession(session);
    }
  } catch (error) {
    console.error('Error handling restore session:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
};

/**
 * Restore a session
 * @param {Object} session - The session to restore
 */
const restoreSession = async (session) => {
  try {
    // Show loading toast
    showToast(`Restoring session "${session.name}"...`, 'info');
    
    // Send message to background script to restore session
    const response = await chrome.runtime.sendMessage({
      action: 'restoreSession',
      session
    });
    
    if (response.success) {
      // Show success message
      showToast(`Session "${session.name}" restored. Reload the page to apply changes.`, 'success', 5000);
      
      // Ask if user wants to reload the page
      setTimeout(() => {
        showConfirmationModal(
          `Session restored for ${session.domain}. Reload page to apply changes?`,
          async () => {
            await chrome.tabs.reload(currentTab.id);
            window.close(); // Close popup
          },
          'Reload',
          'Later'
        );
      }, 500);
    } else {
      throw new Error(response.error || 'Failed to restore session');
    }
  } catch (error) {
    console.error('Error restoring session:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
};

/**
 * Handle deleting a session
 * @param {string} sessionId - ID of the session to delete
 */
const handleDeleteSession = async (sessionId) => {
  try {
    // Get the session
    const sessions = await getSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Show confirmation modal
    showConfirmationModal(
      `Are you sure you want to delete the session "${session.name}" for ${session.domain}?`,
      async () => {
        try {
          // Send message to background script to delete session
          const response = await chrome.runtime.sendMessage({
            action: 'deleteSession',
            sessionId
          });
          
          if (response.success) {
            // Show success message
            showToast(`Session "${session.name}" deleted`, 'success');
            
            // Refresh sessions list
            renderSessions();
          } else {
            throw new Error(response.error || 'Failed to delete session');
          }
        } catch (error) {
          console.error('Error deleting session:', error);
          showToast(`Error: ${error.message}`, 'error');
        }
      }
    );
  } catch (error) {
    console.error('Error handling delete session:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
};

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
const handleLogin = async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.querySelector('#loginForm .form-error');
  
  // Validate inputs
  if (!email || !password) {
    errorEl.textContent = 'Please enter both email and password';
    return;
  }
  
  try {
    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    // Send login request
    const response = await login(email, password);
    
    // Save auth token
    await chrome.storage.local.set({ authToken: response.token });
    
    // Update state
    isLoggedIn = true;
    currentUser = response.user;
    
    // Close modal
    closeAllModals();
    
    // Show success message
    showToast('Logged in successfully', 'success');
    
    // Update UI
    renderAuthStatus();
    renderSyncStatus();
    
    // Trigger sync
    chrome.runtime.sendMessage({ action: 'syncAllSessions' });
    
    // Reset form
    loginForm.reset();
    errorEl.textContent = '';
  } catch (error) {
    console.error('Login error:', error);
    errorEl.textContent = error.message || 'Login failed. Please try again.';
  } finally {
    // Reset button
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Login';
    submitBtn.disabled = false;
  }
};

/**
 * Handle register form submission
 * @param {Event} e - Form submit event
 */
const handleRegister = async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const errorEl = document.querySelector('#registerForm .form-error');
  
  // Validate inputs
  if (!email || !password) {
    errorEl.textContent = 'Please enter both email and password';
    return;
  }
  
  if (password.length < 8) {
    errorEl.textContent = 'Password must be at least 8 characters long';
    return;
  }
  
  if (!/\d/.test(password)) {
    errorEl.textContent = 'Password must include at least one number';
    return;
  }
  
  try {
    // Show loading state
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Registering...';
    submitBtn.disabled = true;
    
    // Send register request
    const response = await register(email, password);
    
    // Save auth token
    await chrome.storage.local.set({ authToken: response.token });
    
    // Update state
    isLoggedIn = true;
    currentUser = response.user;
    
    // Close modal
    closeAllModals();
    
    // Show success message
    showToast('Account created successfully', 'success');
    
    // Update UI
    renderAuthStatus();
    renderSyncStatus();
    
    // Reset form
    registerForm.reset();
    errorEl.textContent = '';
  } catch (error) {
    console.error('Register error:', error);
    errorEl.textContent = error.message || 'Registration failed. Please try again.';
  } finally {
    // Reset button
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Register';
    submitBtn.disabled = false;
  }
};

/**
 * Handle logout
 */
const handleLogout = async () => {
  try {
    // Clear auth token
    await chrome.storage.local.remove('authToken');
    
    // Update state
    isLoggedIn = false;
    currentUser = null;
    
    // Show success message
    showToast('Logged out successfully', 'success');
    
    // Update UI
    renderAuthStatus();
    renderSyncStatus();
  } catch (error) {
    console.error('Logout error:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
};

/**
 * Show a modal
 * @param {HTMLElement} modal - The modal to show
 */
const showModal = (modal) => {
  // Close any open modals first
  closeAllModals();
  
  // Show the modal
  modal.classList.add('active');
};

/**
 * Close all modals
 */
const closeAllModals = () => {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
  });
};

/**
 * Show the confirmation modal
 * @param {string} message - The confirmation message
 * @param {Function} onConfirm - Function to call when confirmed
 * @param {string} confirmText - Text for the confirm button
 * @param {string} cancelText - Text for the cancel button
 */
const showConfirmationModal = (message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') => {
  // Set message
  document.getElementById('confirmationMessage').textContent = message;
  
  // Set button text
  document.getElementById('confirmBtn').textContent = confirmText;
  document.getElementById('cancelBtn').textContent = cancelText;
  
  // Set up event listeners
  const confirmBtn = document.getElementById('confirmBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  
  // Remove existing event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  // Add new event listeners
  newConfirmBtn.addEventListener('click', () => {
    closeAllModals();
    onConfirm();
  });
  
  newCancelBtn.addEventListener('click', () => {
    closeAllModals();
  });
  
  // Show the modal
  showModal(confirmationModal);
};

/**
 * Show a toast notification
 * @param {string} message - The message to show
 * @param {string} type - The type of toast (success, error, info, warning)
 * @param {number} duration - How long to show the toast (ms)
 */
const showToast = (message, type = 'info', duration = 3000) => {
  const toastContainer = document.getElementById('toastContainer');
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close">&times;</button>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Add event listener to close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toastContainer.removeChild(toast);
  });
  
  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentNode === toastContainer) {
      toastContainer.removeChild(toast);
    }
  }, duration);
};

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', initPopup);
