/**
 * Options Script for Session Sync Pro
 * Handles the options page UI and interactions
 */

import './options.css';
import { 
  getBlacklist, 
  addToBlacklist, 
  removeFromBlacklist,
  getAuthToken,
  clearAuthToken
} from '../utils/storage';
import { 
  login, 
  register, 
  getCurrentUser 
} from '../utils/api';
import { isValidUrl } from '../utils/domainUtils';

// DOM Elements
const navLinks = document.querySelectorAll('.nav a');
const sections = document.querySelectorAll('.section');
const blacklistItemsEl = document.getElementById('blacklistItems');
const addToBlacklistBtn = document.getElementById('addToBlacklistBtn');
const blacklistDomainInput = document.getElementById('blacklistDomain');
const blacklistErrorEl = document.getElementById('blacklistError');
const accountContentEl = document.getElementById('accountContent');

// Current state
let isLoggedIn = false;
let currentUser = null;

/**
 * Initialize the options page
 */
const initOptions = async () => {
  try {
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
        await clearAuthToken();
        isLoggedIn = false;
      }
    }
    
    // Render UI
    renderBlacklist();
    renderAccountSection();
    
    // Set up event listeners
    setupEventListeners();
    
  } catch (error) {
    console.error('Error initializing options:', error);
    showToast('Error initializing options', 'error');
  }
};

/**
 * Set up event listeners
 */
const setupEventListeners = () => {
  // Navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all links and sections
      navLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      // Add active class to clicked link and corresponding section
      link.classList.add('active');
      const sectionId = link.getAttribute('href').substring(1);
      document.getElementById(sectionId).classList.add('active');
    });
  });
  
  // Add to blacklist button
  addToBlacklistBtn.addEventListener('click', handleAddToBlacklist);
  
  // Blacklist domain input (Enter key)
  blacklistDomainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleAddToBlacklist();
    }
  });
};

/**
 * Render the blacklist section
 */
const renderBlacklist = async () => {
  try {
    // Get blacklist
    const blacklist = await getBlacklist();
    
    if (blacklist.length === 0) {
      blacklistItemsEl.innerHTML = `
        <div class="empty-blacklist">
          No domains in blacklist. Add domains to prevent Session Sync Pro from saving or restoring sessions for these websites.
        </div>
      `;
      return;
    }
    
    // Sort domains alphabetically
    const sortedBlacklist = [...blacklist].sort();
    
    // Build HTML
    let html = '';
    sortedBlacklist.forEach(domain => {
      html += `
        <div class="blacklist-item">
          <span class="blacklist-domain">${domain}</span>
          <button class="btn icon remove-from-blacklist" data-domain="${domain}" title="Remove from blacklist">×</button>
        </div>
      `;
    });
    
    blacklistItemsEl.innerHTML = html;
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-from-blacklist').forEach(btn => {
      btn.addEventListener('click', () => handleRemoveFromBlacklist(btn.dataset.domain));
    });
    
  } catch (error) {
    console.error('Error rendering blacklist:', error);
    blacklistItemsEl.innerHTML = `
      <div class="error">Error loading blacklist. Please try again.</div>
    `;
  }
};

/**
 * Handle adding a domain to the blacklist
 */
const handleAddToBlacklist = async () => {
  try {
    const domain = blacklistDomainInput.value.trim();
    
    // Validate domain
    if (!domain) {
      blacklistErrorEl.textContent = 'Please enter a domain';
      return;
    }
    
    // Check if it's a valid domain or wildcard domain
    if (!isValidDomainOrWildcard(domain)) {
      blacklistErrorEl.textContent = 'Please enter a valid domain (e.g., example.com or *.example.com)';
      return;
    }
    
    // Check if domain is already in blacklist
    const blacklist = await getBlacklist();
    if (blacklist.includes(domain)) {
      blacklistErrorEl.textContent = 'Domain is already in blacklist';
      return;
    }
    
    // Add to blacklist
    await addToBlacklist(domain);
    
    // Clear input and error
    blacklistDomainInput.value = '';
    blacklistErrorEl.textContent = '';
    
    // Show success message
    showToast(`Added ${domain} to blacklist`, 'success');
    
    // Refresh blacklist
    renderBlacklist();
    
  } catch (error) {
    console.error('Error adding to blacklist:', error);
    blacklistErrorEl.textContent = error.message;
  }
};

/**
 * Handle removing a domain from the blacklist
 * @param {string} domain - The domain to remove
 */
const handleRemoveFromBlacklist = async (domain) => {
  try {
    // Remove from blacklist
    await removeFromBlacklist(domain);
    
    // Show success message
    showToast(`Removed ${domain} from blacklist`, 'success');
    
    // Refresh blacklist
    renderBlacklist();
    
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
};

/**
 * Render the account section
 */
const renderAccountSection = () => {
  if (isLoggedIn && currentUser) {
    accountContentEl.innerHTML = `
      <div class="account-info">
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Account created:</strong> ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
        <p><strong>Last login:</strong> ${currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString() : 'N/A'}</p>
      </div>
      
      <div class="account-actions">
        <button id="logoutBtn" class="btn danger">Logout</button>
      </div>
    `;
    
    // Add event listener to logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  } else {
    accountContentEl.innerHTML = `
      <p class="section-description">
        Create an account or login to sync your sessions across multiple devices.
      </p>
      
      <div class="tabs">
        <button class="tab-btn active" data-tab="login">Login</button>
        <button class="tab-btn" data-tab="register">Register</button>
      </div>
      
      <div class="tab-content active" id="login">
        <form id="loginForm" class="login-form">
          <div class="form-group">
            <label for="loginEmail">Email</label>
            <input type="email" id="loginEmail" required>
          </div>
          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input type="password" id="loginPassword" required>
          </div>
          <div class="form-error" id="loginError"></div>
          <button type="submit" class="btn primary">Login</button>
        </form>
      </div>
      
      <div class="tab-content" id="register">
        <form id="registerForm" class="register-form">
          <div class="form-group">
            <label for="registerEmail">Email</label>
            <input type="email" id="registerEmail" required>
          </div>
          <div class="form-group">
            <label for="registerPassword">Password</label>
            <input type="password" id="registerPassword" required>
            <small>Password must be at least 8 characters and include a number</small>
          </div>
          <div class="form-error" id="registerError"></div>
          <button type="submit" class="btn primary">Register</button>
        </form>
      </div>
    `;
    
    // Add event listeners
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
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
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
  const errorEl = document.getElementById('loginError');
  
  // Validate inputs
  if (!email || !password) {
    errorEl.textContent = 'Please enter both email and password';
    return;
  }
  
  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
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
    
    // Show success message
    showToast('Logged in successfully', 'success');
    
    // Update UI
    renderAccountSection();
    
    // Trigger sync
    chrome.runtime.sendMessage({ action: 'syncAllSessions' });
    
  } catch (error) {
    console.error('Login error:', error);
    errorEl.textContent = error.message || 'Login failed. Please try again.';
  } finally {
    // Reset button
    const submitBtn = e.target.querySelector('button[type="submit"]');
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
  const errorEl = document.getElementById('registerError');
  
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
    const submitBtn = e.target.querySelector('button[type="submit"]');
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
    
    // Show success message
    showToast('Account created successfully', 'success');
    
    // Update UI
    renderAccountSection();
    
  } catch (error) {
    console.error('Register error:', error);
    errorEl.textContent = error.message || 'Registration failed. Please try again.';
  } finally {
    // Reset button
    const submitBtn = e.target.querySelector('button[type="submit"]');
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
    await clearAuthToken();
    
    // Update state
    isLoggedIn = false;
    currentUser = null;
    
    // Show success message
    showToast('Logged out successfully', 'success');
    
    // Update UI
    renderAccountSection();
  } catch (error) {
    console.error('Logout error:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
};

/**
 * Check if a string is a valid domain or wildcard domain
 * @param {string} domain - The domain to check
 * @returns {boolean} - Whether the domain is valid
 */
const isValidDomainOrWildcard = (domain) => {
  // Check for wildcard domain (*.example.com)
  if (domain.startsWith('*.')) {
    const baseDomain = domain.substring(2);
    return isValidDomain(baseDomain);
  }
  
  // Check for regular domain
  return isValidDomain(domain);
};

/**
 * Check if a string is a valid domain
 * @param {string} domain - The domain to check
 * @returns {boolean} - Whether the domain is valid
 */
const isValidDomain = (domain) => {
  // Simple domain validation
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain);
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

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initOptions);
