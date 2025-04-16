/**
 * Popup Script for Session Sync Pro
 * Handles the popup UI and user interactions
 */

import api from './api.js';
import sessionManager from './sessionManager.js';

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const logoutButton = document.getElementById('logout');
const saveSessionButton = document.getElementById('save-session');
const sessionsListContainer = document.getElementById('sessions-list');
const searchInput = document.getElementById('search-sessions');
const syncIndicator = document.getElementById('sync-indicator');
const saveModal = document.getElementById('save-modal');
const restoreModal = document.getElementById('restore-modal');
const sessionNameInput = document.getElementById('session-name');
const currentDomainSpan = document.getElementById('current-domain');
const restoreDomainSpan = document.getElementById('restore-domain');
const cancelSaveButton = document.getElementById('cancel-save');
const saveSessionForm = document.getElementById('save-session-form');
const cancelRestoreButton = document.getElementById('cancel-restore');
const confirmRestoreButton = document.getElementById('confirm-restore');
const feedbackMessage = document.getElementById('feedback-message');

// State
let currentDomain = '';
let selectedSessionId = null;
let isAuthenticated = false;

// Initialize popup
async function initPopup() {
  try {
    // Initialize API service
    await api.init();
    
    // Check if user is authenticated
    if (api.token) {
      try {
        await api.getCurrentUser();
        isAuthenticated = true;
      } catch (error) {
        // Token is invalid or expired
        api.clearToken();
        isAuthenticated = false;
      }
    }
    
    // Initialize session manager
    await sessionManager.init();
    
    // Get current tab domain
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        currentDomain = url.hostname;
      } catch (error) {
        console.error('Error parsing URL:', error);
        currentDomain = '';
      }
    }
    
    // Update UI based on authentication state
    updateUI();
    
    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing popup:', error);
    showFeedback('Error initializing extension', 'error');
  }
}

// Update UI based on authentication state
function updateUI() {
  if (isAuthenticated) {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    
    // Update sync indicator
    updateSyncIndicator();
    
    // Render sessions list
    renderSessionsList();
  } else {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  }
}

// Update sync indicator
function updateSyncIndicator() {
  if (sessionManager.isOffline) {
    syncIndicator.textContent = '⚠ Offline';
    syncIndicator.style.color = 'var(--warning-color)';
  } else if (sessionManager.pendingSync.length > 0) {
    syncIndicator.textContent = `⟳ Syncing (${sessionManager.pendingSync.length})`;
    syncIndicator.style.color = 'var(--info-color)';
  } else {
    syncIndicator.textContent = '✓ Synced';
    syncIndicator.style.color = 'var(--success-color)';
  }
}

// Render sessions list
function renderSessionsList() {
  // Get all sessions
  const allSessions = sessionManager.getAllSessions();
  
  // Apply search filter if needed
  const searchTerm = searchInput.value.toLowerCase();
  const filteredSessions = searchTerm
    ? allSessions.filter(session => 
        session.name.toLowerCase().includes(searchTerm) || 
        session.domain.toLowerCase().includes(searchTerm)
      )
    : allSessions;
  
  // Group sessions by domain
  const sessionsByDomain = {};
  filteredSessions.forEach(session => {
    if (!sessionsByDomain[session.domain]) {
      sessionsByDomain[session.domain] = [];
    }
    sessionsByDomain[session.domain].push(session);
  });
  
  // Clear sessions list
  sessionsListContainer.innerHTML = '';
  
  // Check if there are any sessions
  if (Object.keys(sessionsByDomain).length === 0) {
    sessionsListContainer.innerHTML = `
      <div class="empty-state">
        <p>No saved sessions yet.</p>
        <p>Click "Save Current Session" to get started.</p>
      </div>
    `;
    return;
  }
  
  // Render sessions by domain
  for (const [domain, sessions] of Object.entries(sessionsByDomain)) {
    const domainGroup = document.createElement('div');
    domainGroup.className = 'session-group';
    
    // Create domain header
    const domainHeader = document.createElement('div');
    domainHeader.className = 'domain-header';
    domainHeader.innerHTML = `
      <img src="https://${domain}/favicon.ico" onerror="this.src='icons/globe.png'" alt="${domain}">
      <span>${domain}</span>
    `;
    domainGroup.appendChild(domainHeader);
    
    // Create session items
    sessions.forEach(session => {
      const sessionItem = document.createElement('div');
      sessionItem.className = 'session-item';
      sessionItem.dataset.id = session._id;
      
      // Format date
      const updatedDate = new Date(session.updatedAt).toLocaleDateString();
      
      sessionItem.innerHTML = `
        <div class="session-info">
          <div class="session-name">${session.name}</div>
          <div class="session-meta">
            <span>${updatedDate}</span>
            ${session.hasHttpOnlyCookies ? `
              <span class="http-only-indicator" title="Contains HttpOnly cookies which might affect restoration success">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12" y2="16"></line>
                </svg>
                HttpOnly
              </span>
            ` : ''}
          </div>
        </div>
        <div class="session-actions">
          <button class="action-btn restore" title="Restore Session">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12h18M3 12l6-6M3 12l6 6"></path>
            </svg>
          </button>
          <button class="action-btn delete" title="Delete Session">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          </button>
        </div>
      `;
      
      // Add event listeners
      const restoreButton = sessionItem.querySelector('.restore');
      restoreButton.addEventListener('click', () => {
        showRestoreConfirmation(session);
      });
      
      const deleteButton = sessionItem.querySelector('.delete');
      deleteButton.addEventListener('click', () => {
        deleteSession(session._id);
      });
      
      domainGroup.appendChild(sessionItem);
    });
    
    sessionsListContainer.appendChild(domainGroup);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Auth form switching
  showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
  });
  
  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
  });
  
  // Login form
  document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    await login();
  });
  
  // Signup form
  document.getElementById('signup').addEventListener('submit', async (e) => {
    e.preventDefault();
    await signup();
  });
  
  // Logout button
  logoutButton.addEventListener('click', logout);
  
  // Save session button
  saveSessionButton.addEventListener('click', () => {
    showSaveModal();
  });
  
  // Search input
  searchInput.addEventListener('input', renderSessionsList);
  
  // Save modal
  cancelSaveButton.addEventListener('click', () => {
    saveModal.style.display = 'none';
  });
  
  saveSessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveCurrentSession();
  });
  
  // Restore modal
  cancelRestoreButton.addEventListener('click', () => {
    restoreModal.style.display = 'none';
    selectedSessionId = null;
  });
  
  confirmRestoreButton.addEventListener('click', async () => {
    await restoreSession();
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === saveModal) {
      saveModal.style.display = 'none';
    } else if (e.target === restoreModal) {
      restoreModal.style.display = 'none';
      selectedSessionId = null;
    }
  });
  
  // Network status changes
  window.addEventListener('online', () => {
    updateSyncIndicator();
    showFeedback('Back online. Syncing...', 'info');
  });
  
  window.addEventListener('offline', () => {
    updateSyncIndicator();
    showFeedback('You are offline. Changes will be synced when you reconnect.', 'warning');
  });
}

// Login
async function login() {
  try {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    
    if (!email || !password) {
      showFeedback('Please enter email and password', 'error');
      return;
    }
    
    // Show loading state
    loginEmailInput.disabled = true;
    loginPasswordInput.disabled = true;
    
    await api.login(email, password);
    
    isAuthenticated = true;
    updateUI();
    
    // Sync sessions
    await sessionManager.syncWithBackend();
    updateSyncIndicator();
    
    showFeedback('Logged in successfully', 'success');
  } catch (error) {
    console.error('Login error:', error);
    showFeedback(error.message || 'Login failed', 'error');
  } finally {
    // Reset loading state
    loginEmailInput.disabled = false;
    loginPasswordInput.disabled = false;
  }
}

// Signup
async function signup() {
  try {
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    
    if (!email || !password) {
      showFeedback('Please enter email and password', 'error');
      return;
    }
    
    // Validate password
    if (password.length < 8) {
      showFeedback('Password must be at least 8 characters long', 'error');
      return;
    }
    
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      showFeedback('Password must contain at least one number and one letter', 'error');
      return;
    }
    
    // Show loading state
    signupEmailInput.disabled = true;
    signupPasswordInput.disabled = true;
    
    await api.register(email, password);
    
    isAuthenticated = true;
    updateUI();
    
    showFeedback('Account created successfully', 'success');
  } catch (error) {
    console.error('Signup error:', error);
    showFeedback(error.message || 'Signup failed', 'error');
  } finally {
    // Reset loading state
    signupEmailInput.disabled = false;
    signupPasswordInput.disabled = false;
  }
}

// Logout
function logout() {
  api.clearToken();
  isAuthenticated = false;
  updateUI();
  showFeedback('Logged out successfully', 'success');
}

// Show save modal
function showSaveModal() {
  if (!currentDomain) {
    showFeedback('Cannot save session for this page', 'error');
    return;
  }
  
  // Set default session name
  const timestamp = new Date().toLocaleString();
  sessionNameInput.value = `${currentDomain} - ${timestamp}`;
  
  // Set current domain
  currentDomainSpan.textContent = currentDomain;
  
  // Show modal
  saveModal.style.display = 'block';
}

// Save current session
async function saveCurrentSession() {
  try {
    const name = sessionNameInput.value;
    
    if (!name) {
      showFeedback('Please enter a session name', 'error');
      return;
    }
    
    // Hide modal
    saveModal.style.display = 'none';
    
    // Show loading feedback
    showFeedback('Saving session...', 'info');
    
    // Capture and save session
    await sessionManager.captureSession(currentDomain, name);
    
    // Update UI
    renderSessionsList();
    updateSyncIndicator();
    
    showFeedback('Session saved successfully', 'success');
  } catch (error) {
    console.error('Save session error:', error);
    showFeedback(error.message || 'Failed to save session', 'error');
  }
}

// Show restore confirmation
function showRestoreConfirmation(session) {
  selectedSessionId = session._id;
  restoreDomainSpan.textContent = session.domain;
  restoreModal.style.display = 'block';
}

// Restore session
async function restoreSession() {
  try {
    if (!selectedSessionId) {
      throw new Error('No session selected');
    }
    
    // Hide modal
    restoreModal.style.display = 'none';
    
    // Show loading feedback
    showFeedback('Restoring session...', 'info');
    
    // Get session
    const session = sessionManager.getSessionById(selectedSessionId);
    
    // Auto-save current session if on the same domain
    if (currentDomain === session.domain) {
      await sessionManager.autoSaveCurrentSession(currentDomain);
    }
    
    // Restore session
    await sessionManager.restoreSession(selectedSessionId);
    
    // Update UI
    renderSessionsList();
    updateSyncIndicator();
    
    showFeedback('Session restored successfully', 'success');
    
    // Close popup
    setTimeout(() => {
      window.close();
    }, 1500);
  } catch (error) {
    console.error('Restore session error:', error);
    showFeedback(error.message || 'Failed to restore session', 'error');
  } finally {
    selectedSessionId = null;
  }
}

// Delete session
async function deleteSession(id) {
  try {
    if (confirm('Are you sure you want to delete this session?')) {
      // Show loading feedback
      showFeedback('Deleting session...', 'info');
      
      // Delete session
      await sessionManager.deleteSession(id);
      
      // Update UI
      renderSessionsList();
      updateSyncIndicator();
      
      showFeedback('Session deleted successfully', 'success');
    }
  } catch (error) {
    console.error('Delete session error:', error);
    showFeedback(error.message || 'Failed to delete session', 'error');
  }
}

// Show feedback message
function showFeedback(message, type = 'info') {
  feedbackMessage.textContent = message;
  feedbackMessage.className = `feedback-message ${type}`;
  feedbackMessage.classList.add('show');
  
  // Hide after 3 seconds
  setTimeout(() => {
    feedbackMessage.classList.remove('show');
  }, 3000);
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initPopup);
