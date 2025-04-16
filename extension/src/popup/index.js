require("./styles.css");
const sessionManager = require("../utils/sessionManager.js");
const settings = require("../utils/settings.js");
const api = require("../utils/api.js");

// DOM elements
const userSection = document.getElementById("user-section");
const authSection = document.getElementById("auth-section");
const mainSection = document.getElementById("main-section");
const saveSessionBtn = document.getElementById("save-session-btn");
const sessionsList = document.getElementById("sessions-list");
const settingsBtn = document.getElementById("settings-btn");

// Modals
const saveSessionModal = document.getElementById("save-session-modal");
const saveSessionForm = document.getElementById("save-session-form");
const sessionNameInput = document.getElementById("session-name");
const restoreConfirmModal = document.getElementById("restore-confirm-modal");
const saveBeforeRestoreBtn = document.getElementById("save-before-restore-btn");
const restoreWithoutSavingBtn = document.getElementById(
    "restore-without-saving-btn"
);
const cancelRestoreBtn = document.getElementById("cancel-restore-btn");
const reloadConfirmModal = document.getElementById("reload-confirm-modal");
const reloadPageBtn = document.getElementById("reload-page-btn");
const cancelReloadBtn = document.getElementById("cancel-reload-btn");
const settingsModal = document.getElementById("settings-modal");
const disabledSitesTextarea = document.getElementById("disabled-sites");
const apiUrlInput = document.getElementById("api-url");
const saveSettingsBtn = document.getElementById("save-settings-btn");

// Close buttons for modals
const closeButtons = document.querySelectorAll(".close-btn");

// Current domain and session to restore
let currentDomain = "";
let sessionToRestore = null;

/**
 * Initialize the popup
 */
const init = async () => {
    try {
        // Get the current tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        if (tab && tab.url) {
            // Get the domain from the URL
            const url = new URL(tab.url);
            currentDomain = url.hostname;

            // Check if the domain is disabled
            const isDisabled = await settings.isDomainDisabled(currentDomain);

            // Disable save button if the domain is disabled or not http/https
            if (isDisabled || !["http:", "https:"].includes(url.protocol)) {
                saveSessionBtn.disabled = true;
                saveSessionBtn.title = isDisabled
                    ? "Session Sync Pro is disabled for this domain"
                    : "Session Sync Pro only works on http/https pages";
            }
        } else {
            // Disable save button if no tab is active
            saveSessionBtn.disabled = true;
            saveSessionBtn.title = "No active tab";
        }

        // Check if user is authenticated
        const { token, user } = await chrome.storage.local.get([
            "token",
            "user",
        ]);

        if (token && user) {
            // User is authenticated, show user info
            renderUserInfo(user);

            // Try to sync sessions
            try {
                await sessionManager.syncSessions();
            } catch (error) {
                console.error("Error syncing sessions:", error);
                showNotification("Error syncing sessions", "error");
            }
        } else {
            // User is not authenticated, show auth forms
            renderAuthForms();
        }

        // Load sessions
        await loadSessions();

        // Load settings
        await loadSettings();
    } catch (error) {
        console.error("Error initializing popup:", error);
        showNotification("Error initializing popup", "error");
    }
};

/**
 * Render user info
 * @param {Object} user - The user object
 */
const renderUserInfo = (user) => {
    userSection.innerHTML = `
    <div class="user-info">
      <span class="user-email">${user.email}</span>
      <button id="logout-btn" class="text-btn">Logout</button>
    </div>
  `;

    // Add event listener to logout button
    document
        .getElementById("logout-btn")
        .addEventListener("click", handleLogout);

    // Hide auth section
    authSection.style.display = "none";
};

/**
 * Render authentication forms
 */
const renderAuthForms = () => {
    authSection.innerHTML = `
    <div class="auth-tabs">
      <div class="auth-tab active" data-tab="login">Login</div>
      <div class="auth-tab" data-tab="register">Register</div>
    </div>

    <form id="login-form" class="auth-form active">
      <div class="form-group">
        <label for="login-email">Email</label>
        <input type="email" id="login-email" required>
      </div>
      <div class="form-group">
        <label for="login-password">Password</label>
        <input type="password" id="login-password" required>
      </div>
      <button type="submit" class="primary-btn">Login</button>
    </form>

    <form id="register-form" class="auth-form">
      <div class="form-group">
        <label for="register-email">Email</label>
        <input type="email" id="register-email" required>
      </div>
      <div class="form-group">
        <label for="register-password">Password</label>
        <input type="password" id="register-password" required minlength="8">
      </div>
      <div class="form-group">
        <label for="register-confirm-password">Confirm Password</label>
        <input type="password" id="register-confirm-password" required minlength="8">
      </div>
      <button type="submit" class="primary-btn">Register</button>
    </form>
  `;

    // Add event listeners to auth tabs
    const authTabs = document.querySelectorAll(".auth-tab");
    authTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            // Remove active class from all tabs and forms
            authTabs.forEach((t) => t.classList.remove("active"));
            document
                .querySelectorAll(".auth-form")
                .forEach((f) => f.classList.remove("active"));

            // Add active class to clicked tab and corresponding form
            tab.classList.add("active");
            document
                .getElementById(`${tab.dataset.tab}-form`)
                .classList.add("active");
        });
    });

    // Add event listeners to auth forms
    document
        .getElementById("login-form")
        .addEventListener("submit", handleLogin);
    document
        .getElementById("register-form")
        .addEventListener("submit", handleRegister);

    // Show auth section
    authSection.style.display = "block";
};

/**
 * Handle login form submission
 * @param {Event} event - The form submission event
 */
const handleLogin = async (event) => {
    event.preventDefault();

    try {
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        // Login user
        const data = await api.login({ email, password });

        // Save token and user to storage
        await chrome.storage.local.set({
            token: data.token,
            user: data.user,
        });

        // Render user info
        renderUserInfo(data.user);

        // Show success notification
        showNotification("Login successful", "success");

        // Sync sessions
        await sessionManager.syncSessions();

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error("Error logging in:", error);
        showNotification(error.message || "Error logging in", "error");
    }
};

/**
 * Handle register form submission
 * @param {Event} event - The form submission event
 */
const handleRegister = async (event) => {
    event.preventDefault();

    try {
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const confirmPassword = document.getElementById(
            "register-confirm-password"
        ).value;

        // Check if passwords match
        if (password !== confirmPassword) {
            showNotification("Passwords do not match", "error");
            return;
        }

        // Register user
        const data = await api.register({ email, password });

        // Save token and user to storage
        await chrome.storage.local.set({
            token: data.token,
            user: data.user,
        });

        // Render user info
        renderUserInfo(data.user);

        // Show success notification
        showNotification("Registration successful", "success");

        // Ask if user wants to sync local sessions
        const localSessions = await sessionManager.getLocalSessions();
        if (localSessions.length > 0) {
            if (
                confirm(
                    "Do you want to sync your locally saved sessions to your account?"
                )
            ) {
                await sessionManager.syncSessions();
                showNotification("Sessions synced successfully", "success");
            }
        }

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error("Error registering:", error);
        showNotification(error.message || "Error registering", "error");
    }
};

/**
 * Handle logout
 */
const handleLogout = async () => {
    try {
        // Clear token and user from storage
        await chrome.storage.local.remove(["token", "user"]);

        // Render auth forms
        renderAuthForms();

        // Show success notification
        showNotification("Logout successful", "success");

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error("Error logging out:", error);
        showNotification("Error logging out", "error");
    }
};

/**
 * Load sessions from storage
 */
const loadSessions = async () => {
    try {
        // Show loading state
        sessionsList.innerHTML =
            '<div class="loading">Loading sessions...</div>';

        // Get sessions from storage
        const sessions = await sessionManager.getLocalSessions();

        if (sessions.length === 0) {
            // No sessions found
            sessionsList.innerHTML =
                '<div class="empty-state">No saved sessions</div>';
            return;
        }

        // Group sessions by domain
        const sessionsByDomain = sessions.reduce((acc, session) => {
            if (!acc[session.domain]) {
                acc[session.domain] = [];
            }
            acc[session.domain].push(session);
            return acc;
        }, {});

        // Render sessions
        let html = "";

        for (const [domain, domainSessions] of Object.entries(
            sessionsByDomain
        )) {
            html += `
        <div class="domain-group">
          <div class="domain-header">
            <img class="domain-favicon" src="https://www.google.com/s2/favicons?domain=${domain}" alt="${domain} favicon">
            <span class="domain-name">${domain}</span>
          </div>
          <div class="domain-sessions">
      `;

            // Sort sessions by last used (newest first)
            domainSessions.sort(
                (a, b) => new Date(b.lastUsed) - new Date(a.lastUsed)
            );

            for (const session of domainSessions) {
                const lastUsed = new Date(session.lastUsed).toLocaleString();
                const hasExpired = sessionManager.hasExpiredCookies(session);

                html += `
          <div class="session-item">
            <div class="session-info">
              <div class="session-name">${session.name}</div>
              <div class="session-meta">Last used: ${lastUsed}</div>
              ${
                  session.hasHttpOnlyCookies
                      ? '<div class="http-only-warning">⚠️ Contains HttpOnly cookies</div>'
                      : ""
              }
              ${
                  hasExpired
                      ? '<div class="expired-warning">⚠️ Contains expired cookies</div>'
                      : ""
              }
            </div>
            <div class="session-actions">
              <button class="restore-btn primary-btn" data-domain="${
                  session.domain
              }" data-name="${session.name}">Restore</button>
              <button class="delete-btn text-btn" data-domain="${
                  session.domain
              }" data-name="${session.name}">Delete</button>
            </div>
          </div>
        `;
            }

            html += `
          </div>
        </div>
      `;
        }

        sessionsList.innerHTML = html;

        // Add event listeners to restore and delete buttons
        document.querySelectorAll(".restore-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                handleRestoreSession(btn.dataset.domain, btn.dataset.name);
            });
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                handleDeleteSession(btn.dataset.domain, btn.dataset.name);
            });
        });
    } catch (error) {
        console.error("Error loading sessions:", error);
        sessionsList.innerHTML =
            '<div class="empty-state">Error loading sessions</div>';
        showNotification("Error loading sessions", "error");
    }
};

/**
 * Handle save session button click
 */
const handleSaveSession = async () => {
    try {
        // Show save session modal
        saveSessionModal.style.display = "block";

        // Set default session name
        sessionNameInput.value = `${currentDomain} - ${new Date().toLocaleString()}`;

        // Focus on session name input
        sessionNameInput.focus();
        sessionNameInput.select();
    } catch (error) {
        console.error("Error showing save session modal:", error);
        showNotification("Error showing save session modal", "error");
    }
};

/**
 * Handle save session form submission
 * @param {Event} event - The form submission event
 */
const handleSaveSessionSubmit = async (event) => {
    event.preventDefault();

    try {
        const name = sessionNameInput.value.trim();

        if (!name) {
            showNotification("Session name is required", "error");
            return;
        }

        // Close modal
        saveSessionModal.style.display = "none";

        // Show loading notification
        showNotification("Saving session...", "info");

        // Save session
        const session = await sessionManager.saveSession(currentDomain, name);

        // Show success notification
        showNotification("Session saved successfully", "success");

        // Sync session if user is authenticated
        const { token } = await chrome.storage.local.get("token");
        if (token) {
            try {
                await api.createSession(session);
                showNotification("Session synced to cloud", "success");
            } catch (error) {
                console.error("Error syncing session:", error);
                showNotification("Error syncing session to cloud", "error");
            }
        }

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error("Error saving session:", error);
        showNotification("Error saving session", "error");
    }
};

/**
 * Handle restore session button click
 * @param {string} domain - The domain of the session
 * @param {string} name - The name of the session
 */
const handleRestoreSession = async (domain, name) => {
    try {
        // Check if the current domain matches the session domain
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const url = new URL(tab.url);

        if (url.hostname !== domain) {
            // Ask if user wants to open the domain in a new tab
            if (
                confirm(
                    `This session is for ${domain}, but you're currently on ${url.hostname}. Open ${domain} in a new tab?`
                )
            ) {
                await chrome.tabs.create({ url: `https://${domain}` });
            }
            return;
        }

        // Get the session to restore
        const sessions = await sessionManager.getLocalSessions();
        sessionToRestore = sessions.find(
            (s) => s.domain === domain && s.name === name
        );

        if (!sessionToRestore) {
            showNotification("Session not found", "error");
            return;
        }

        // Check if the domain has an active session
        const hasActive = await sessionManager.hasActiveSession(domain);

        if (hasActive) {
            // Show restore confirmation modal
            restoreConfirmModal.style.display = "block";
        } else {
            // No active session, restore directly
            await restoreSessionAndReload();
        }
    } catch (error) {
        console.error("Error handling restore session:", error);
        showNotification("Error handling restore session", "error");
    }
};

/**
 * Handle save before restore button click
 */
const handleSaveBeforeRestore = async () => {
    try {
        // Close modal
        restoreConfirmModal.style.display = "none";

        // Show loading notification
        showNotification("Saving current session...", "info");

        // Save current session with auto-generated name
        const autoName = `${currentDomain} - AutoSaved ${new Date().toLocaleString()}`;
        await sessionManager.saveSession(currentDomain, autoName);

        // Show success notification
        showNotification("Current session saved", "success");

        // Restore the selected session
        await restoreSessionAndReload();
    } catch (error) {
        console.error("Error saving before restore:", error);
        showNotification("Error saving before restore", "error");
    }
};

/**
 * Handle restore without saving button click
 */
const handleRestoreWithoutSaving = async () => {
    try {
        // Close modal
        restoreConfirmModal.style.display = "none";

        // Restore the selected session
        await restoreSessionAndReload();
    } catch (error) {
        console.error("Error restoring without saving:", error);
        showNotification("Error restoring without saving", "error");
    }
};

/**
 * Restore session and show reload confirmation
 */
const restoreSessionAndReload = async () => {
    try {
        // Show loading notification
        showNotification("Restoring session...", "info");

        // Restore session
        await sessionManager.restoreSession(sessionToRestore);

        // Show success notification
        showNotification("Session restored successfully", "success");

        // Update last used timestamp if user is authenticated
        const { token } = await chrome.storage.local.get("token");
        if (token) {
            try {
                // Find the session ID in the backend
                const backendSessions = await api.getSessionsByDomain(
                    sessionToRestore.domain
                );
                const backendSession = backendSessions.find(
                    (s) => s.name === sessionToRestore.name
                );

                if (backendSession) {
                    await api.updateLastUsed(backendSession._id);
                }
            } catch (error) {
                console.error("Error updating last used timestamp:", error);
            }
        }

        // Show reload confirmation modal
        reloadConfirmModal.style.display = "block";
    } catch (error) {
        console.error("Error restoring session:", error);
        showNotification("Error restoring session", "error");
    }
};

/**
 * Handle reload page button click
 */
const handleReloadPage = async () => {
    try {
        // Close modal
        reloadConfirmModal.style.display = "none";

        // Reload the active tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        await chrome.tabs.reload(tab.id);

        // Close the popup
        window.close();
    } catch (error) {
        console.error("Error reloading page:", error);
        showNotification("Error reloading page", "error");
    }
};

/**
 * Handle delete session button click
 * @param {string} domain - The domain of the session
 * @param {string} name - The name of the session
 */
const handleDeleteSession = async (domain, name) => {
    try {
        // Confirm deletion
        if (
            !confirm(
                `Are you sure you want to delete the session "${name}" for ${domain}?`
            )
        ) {
            return;
        }

        // Show loading notification
        showNotification("Deleting session...", "info");

        // Delete session from local storage
        await sessionManager.deleteLocalSession(domain, name);

        // Delete session from backend if user is authenticated
        const { token } = await chrome.storage.local.get("token");
        if (token) {
            try {
                // Find the session ID in the backend
                const backendSessions = await api.getSessionsByDomain(domain);
                const backendSession = backendSessions.find(
                    (s) => s.name === name
                );

                if (backendSession) {
                    await api.deleteSession(backendSession._id);
                }
            } catch (error) {
                console.error("Error deleting session from backend:", error);
                showNotification("Error deleting session from cloud", "error");
            }
        }

        // Show success notification
        showNotification("Session deleted successfully", "success");

        // Reload sessions
        await loadSessions();
    } catch (error) {
        console.error("Error deleting session:", error);
        showNotification("Error deleting session", "error");
    }
};

/**
 * Handle settings button click
 */
const handleSettings = async () => {
    try {
        // Show settings modal
        settingsModal.style.display = "block";
    } catch (error) {
        console.error("Error showing settings modal:", error);
        showNotification("Error showing settings modal", "error");
    }
};

/**
 * Load settings from storage
 */
const loadSettings = async () => {
    try {
        // Get disabled sites
        const disabledSites = await settings.getDisabledSites();
        disabledSitesTextarea.value = disabledSites.join("\n");

        // Get API URL
        const apiUrl = await settings.getApiUrl();
        apiUrlInput.value = apiUrl;
    } catch (error) {
        console.error("Error loading settings:", error);
        showNotification("Error loading settings", "error");
    }
};

/**
 * Handle save settings button click
 */
const handleSaveSettings = async () => {
    try {
        // Save settings
        await settings.saveSettings({
            disabledSites: disabledSitesTextarea.value,
            apiUrl: apiUrlInput.value,
        });

        // Close modal
        settingsModal.style.display = "none";

        // Show success notification
        showNotification("Settings saved successfully", "success");

        // Reload the popup to apply settings
        window.location.reload();
    } catch (error) {
        console.error("Error saving settings:", error);
        showNotification("Error saving settings", "error");
    }
};

/**
 * Show a notification
 * @param {string} message - The notification message
 * @param {string} type - The notification type (success, error, warning, info)
 */
const showNotification = (message, type = "info") => {
    const notification = document.getElementById("notification");

    // Set notification content and type
    notification.textContent = message;
    notification.className = `notification ${type}`;

    // Show notification
    notification.classList.add("show");

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
};

// Add event listeners
saveSessionBtn.addEventListener("click", handleSaveSession);
saveSessionForm.addEventListener("submit", handleSaveSessionSubmit);
saveBeforeRestoreBtn.addEventListener("click", handleSaveBeforeRestore);
restoreWithoutSavingBtn.addEventListener("click", handleRestoreWithoutSaving);
cancelRestoreBtn.addEventListener("click", () => {
    restoreConfirmModal.style.display = "none";
});
reloadPageBtn.addEventListener("click", handleReloadPage);
cancelReloadBtn.addEventListener("click", () => {
    reloadConfirmModal.style.display = "none";
});
settingsBtn.addEventListener("click", handleSettings);
saveSettingsBtn.addEventListener("click", handleSaveSettings);

// Close modals when clicking the close button
closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        saveSessionModal.style.display = "none";
        restoreConfirmModal.style.display = "none";
        reloadConfirmModal.style.display = "none";
        settingsModal.style.display = "none";
    });
});

// Close modals when clicking outside the modal content
window.addEventListener("click", (event) => {
    if (event.target === saveSessionModal) {
        saveSessionModal.style.display = "none";
    } else if (event.target === restoreConfirmModal) {
        restoreConfirmModal.style.display = "none";
    } else if (event.target === reloadConfirmModal) {
        reloadConfirmModal.style.display = "none";
    } else if (event.target === settingsModal) {
        settingsModal.style.display = "none";
    }
});

// Initialize the popup when the DOM is loaded
document.addEventListener("DOMContentLoaded", init);
