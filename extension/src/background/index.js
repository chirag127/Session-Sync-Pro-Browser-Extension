/**
 * Background service worker for Session Sync Pro
 */

const sessionManager = require("../utils/sessionManager.js");
const settings = require("../utils/settings.js");

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
    // Create save session context menu item
    chrome.contextMenus.create({
        id: "save-session",
        title: "Save Session for %s",
        contexts: ["page"],
    });

    // Set up alarm for periodic sync
    chrome.alarms.create("sync-sessions", {
        periodInMinutes: 15, // Sync every 15 minutes
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "save-session") {
        try {
            // Get the domain from the tab URL
            const url = new URL(tab.url);
            const domain = url.hostname;

            // Check if the domain is disabled
            const isDisabled = await settings.isDomainDisabled(domain);

            if (isDisabled) {
                // Send error message to the tab
                chrome.tabs.sendMessage(tab.id, {
                    type: "notification",
                    message: "Session Sync Pro is disabled for this domain",
                    notificationType: "error",
                });
                return;
            }

            // Prompt for session name
            const sessionName = prompt(
                "Enter a name for this session:",
                `${domain} - ${new Date().toLocaleString()}`
            );

            if (!sessionName) {
                return; // User cancelled
            }

            // Save session
            const session = await sessionManager.saveSession(
                domain,
                sessionName
            );

            // Send success message to the tab
            chrome.tabs.sendMessage(tab.id, {
                type: "notification",
                message: "Session saved successfully",
                notificationType: "success",
            });

            // Sync session if user is authenticated
            const { token } = await chrome.storage.local.get("token");
            if (token) {
                try {
                    const api = require("../utils/api.js");
                    await api.createSession(session);
                } catch (error) {
                    console.error("Error syncing session:", error);
                }
            }
        } catch (error) {
            console.error("Error saving session:", error);

            // Send error message to the tab
            chrome.tabs.sendMessage(tab.id, {
                type: "notification",
                message: "Error saving session",
                notificationType: "error",
            });
        }
    }
});

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "sync-sessions") {
        try {
            // Check if user is authenticated
            const { token } = await chrome.storage.local.get("token");
            if (token) {
                // Check if online
                if (navigator.onLine) {
                    // Sync sessions
                    await sessionManager.syncSessions();
                }
            }
        } catch (error) {
            console.error("Error syncing sessions:", error);
        }
    }
});

// Handle online/offline events
window.addEventListener("online", async () => {
    try {
        // Check if user is authenticated
        const { token } = await chrome.storage.local.get("token");
        if (token) {
            // Sync sessions
            await sessionManager.syncSessions();
        }
    } catch (error) {
        console.error("Error syncing sessions:", error);
    }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "sync-sessions") {
        // Sync sessions
        sessionManager
            .syncSessions()
            .then(() => {
                sendResponse({ success: true });
            })
            .catch((error) => {
                console.error("Error syncing sessions:", error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // Indicate that the response is asynchronous
    }
});
