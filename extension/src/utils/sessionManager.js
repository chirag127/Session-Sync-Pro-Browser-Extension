/**
 * Session management utility functions
 */

/**
 * Get all cookies for a domain
 * @param {string} domain - The domain to get cookies for
 * @returns {Promise<Array>} The cookies
 */
const getCookiesForDomain = async (domain) => {
    try {
        const cookies = await chrome.cookies.getAll({ domain });
        return cookies;
    } catch (error) {
        console.error("Error getting cookies:", error);
        throw error;
    }
};

/**
 * Check if a domain has HttpOnly cookies
 * @param {Array} cookies - The cookies to check
 * @returns {boolean} True if the domain has HttpOnly cookies
 */
const hasHttpOnlyCookies = (cookies) => {
    const httpOnlyCookies = cookies.filter((cookie) => cookie.httpOnly);

    // Check if any of the HttpOnly cookies have common session-related names
    const sessionCookieNames = [
        "sessionid",
        "jsessionid",
        "asp.net_sessionid",
        "phpsessid",
        "sid",
        "session",
        "auth",
        "token",
    ];

    return httpOnlyCookies.some((cookie) => {
        const lowerName = cookie.name.toLowerCase();
        return sessionCookieNames.some((name) => lowerName.includes(name));
    });
};

/**
 * Get localStorage and sessionStorage for a domain
 * @param {string} domain - The domain to get storage for
 * @returns {Promise<Object>} The localStorage and sessionStorage
 */
const getStorageForDomain = async (domain) => {
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        // Execute script to get localStorage and sessionStorage
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Convert localStorage to object
                const localStorageObj = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    localStorageObj[key] = localStorage.getItem(key);
                }

                // Convert sessionStorage to object
                const sessionStorageObj = {};
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    sessionStorageObj[key] = sessionStorage.getItem(key);
                }

                return {
                    localStorage: localStorageObj,
                    sessionStorage: sessionStorageObj,
                };
            },
        });

        // Return the result from the first frame
        return result[0].result;
    } catch (error) {
        console.error("Error getting storage:", error);
        throw error;
    }
};

/**
 * Save a session for a domain
 * @param {string} domain - The domain to save the session for
 * @param {string} name - The name of the session
 * @returns {Promise<Object>} The saved session
 */
const saveSession = async (domain, name) => {
    try {
        // Get cookies for the domain
        const cookies = await getCookiesForDomain(domain);

        // Check if the domain has HttpOnly cookies
        const hasHttpOnly = hasHttpOnlyCookies(cookies);

        // Get localStorage and sessionStorage for the domain
        const storage = await getStorageForDomain(domain);

        // Create the session object
        const session = {
            name,
            domain,
            cookies,
            localStorage: storage.localStorage,
            sessionStorage: storage.sessionStorage,
            hasHttpOnlyCookies: hasHttpOnly,
            lastUsed: new Date().toISOString(),
        };

        // Save the session to local storage
        const { sessions = [] } = await chrome.storage.local.get("sessions");
        sessions.push(session);
        await chrome.storage.local.set({ sessions });

        // Return the saved session
        return session;
    } catch (error) {
        console.error("Error saving session:", error);
        throw error;
    }
};

/**
 * Check if a domain has an active session
 * @param {string} domain - The domain to check
 * @returns {Promise<boolean>} True if the domain has an active session
 */
const hasActiveSession = async (domain) => {
    try {
        // Check if the domain has cookies
        const cookies = await getCookiesForDomain(domain);
        if (cookies.length > 0) {
            return true;
        }

        // Check if the domain has localStorage or sessionStorage
        const storage = await getStorageForDomain(domain);
        if (
            Object.keys(storage.localStorage).length > 0 ||
            Object.keys(storage.sessionStorage).length > 0
        ) {
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error checking active session:", error);
        throw error;
    }
};

/**
 * Restore a session for a domain
 * @param {Object} session - The session to restore
 * @returns {Promise<void>}
 */
const restoreSession = async (session) => {
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        // Clear existing cookies for the domain
        const existingCookies = await getCookiesForDomain(session.domain);
        for (const cookie of existingCookies) {
            await chrome.cookies.remove({
                url: `${cookie.secure ? "https" : "http"}://${cookie.domain}${
                    cookie.path
                }`,
                name: cookie.name,
            });
        }

        // Set the cookies from the session
        for (const cookie of session.cookies) {
            // Skip cookies that can't be set (e.g., host-only cookies for different domains)
            if (
                cookie.hostOnly &&
                cookie.domain !== new URL(tab.url).hostname
            ) {
                continue;
            }

            await chrome.cookies.set({
                url: `${cookie.secure ? "https" : "http"}://${cookie.domain}${
                    cookie.path
                }`,
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite,
                expirationDate: cookie.expirationDate,
            });
        }

        // Clear and set localStorage and sessionStorage
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (localStorage, sessionStorage) => {
                // Clear existing localStorage and sessionStorage
                window.localStorage.clear();
                window.sessionStorage.clear();

                // Set localStorage from the session
                for (const [key, value] of Object.entries(localStorage)) {
                    window.localStorage.setItem(key, value);
                }

                // Set sessionStorage from the session
                for (const [key, value] of Object.entries(sessionStorage)) {
                    window.sessionStorage.setItem(key, value);
                }
            },
            args: [session.localStorage, session.sessionStorage],
        });

        // Update the session's last used timestamp
        const { sessions = [] } = await chrome.storage.local.get("sessions");
        const updatedSessions = sessions.map((s) => {
            if (s.name === session.name && s.domain === session.domain) {
                return {
                    ...s,
                    lastUsed: new Date().toISOString(),
                };
            }
            return s;
        });
        await chrome.storage.local.set({ sessions: updatedSessions });
    } catch (error) {
        console.error("Error restoring session:", error);
        throw error;
    }
};

/**
 * Get all sessions from local storage
 * @returns {Promise<Array>} The sessions
 */
const getLocalSessions = async () => {
    const { sessions = [] } = await chrome.storage.local.get("sessions");
    return sessions;
};

/**
 * Get sessions for a specific domain from local storage
 * @param {string} domain - The domain to get sessions for
 * @returns {Promise<Array>} The sessions for the domain
 */
const getLocalSessionsByDomain = async (domain) => {
    const sessions = await getLocalSessions();
    return sessions.filter((session) => session.domain === domain);
};

/**
 * Delete a session from local storage
 * @param {string} domain - The domain of the session
 * @param {string} name - The name of the session
 * @returns {Promise<void>}
 */
const deleteLocalSession = async (domain, name) => {
    const { sessions = [] } = await chrome.storage.local.get("sessions");
    const updatedSessions = sessions.filter(
        (session) => !(session.domain === domain && session.name === name)
    );
    await chrome.storage.local.set({ sessions: updatedSessions });
};

/**
 * Check if a session has expired cookies
 * @param {Object} session - The session to check
 * @returns {boolean} True if the session has expired cookies
 */
const hasExpiredCookies = (session) => {
    const now = Date.now() / 1000; // Convert to seconds

    // Check if any important cookies have expired
    const importantCookies = session.cookies.filter((cookie) => {
        const lowerName = cookie.name.toLowerCase();
        return [
            "sessionid",
            "jsessionid",
            "asp.net_sessionid",
            "phpsessid",
            "sid",
            "session",
            "auth",
            "token",
        ].some((name) => lowerName.includes(name));
    });

    return importantCookies.some(
        (cookie) => cookie.expirationDate && cookie.expirationDate < now
    );
};

/**
 * Sync local sessions with the backend
 * @returns {Promise<void>}
 */
const syncSessions = async () => {
    try {
        // Check if user is authenticated
        const { token } = await chrome.storage.local.get("token");
        if (!token) {
            return; // Not authenticated, skip sync
        }

        // Get local sessions
        const localSessions = await getLocalSessions();

        // Get sessions from the backend
        const api = require("./api.js");
        const backendSessions = await api.getSessions();

        // Create a map of backend sessions for easy lookup
        const backendSessionsMap = new Map();
        backendSessions.forEach((session) => {
            backendSessionsMap.set(
                `${session.domain}-${session.name}`,
                session
            );
        });

        // Create a map of local sessions for easy lookup
        const localSessionsMap = new Map();
        localSessions.forEach((session) => {
            localSessionsMap.set(`${session.domain}-${session.name}`, session);
        });

        // Sync local sessions to backend
        for (const localSession of localSessions) {
            const key = `${localSession.domain}-${localSession.name}`;
            const backendSession = backendSessionsMap.get(key);

            if (!backendSession) {
                // Session doesn't exist in backend, create it
                await api.createSession(localSession);
            } else if (
                new Date(localSession.lastUsed) >
                new Date(backendSession.lastUsed)
            ) {
                // Local session is newer, update backend
                await api.updateSession(backendSession._id, localSession);
            }
        }

        // Sync backend sessions to local
        const updatedLocalSessions = [...localSessions];
        for (const backendSession of backendSessions) {
            const key = `${backendSession.domain}-${backendSession.name}`;
            const localSession = localSessionsMap.get(key);

            if (!localSession) {
                // Session doesn't exist locally, add it
                updatedLocalSessions.push(backendSession);
            } else if (
                new Date(backendSession.lastUsed) >
                new Date(localSession.lastUsed)
            ) {
                // Backend session is newer, update local
                const index = updatedLocalSessions.findIndex(
                    (s) =>
                        s.domain === backendSession.domain &&
                        s.name === backendSession.name
                );
                updatedLocalSessions[index] = backendSession;
            }
        }

        // Update local storage with synced sessions
        await chrome.storage.local.set({ sessions: updatedLocalSessions });

        // Set last sync timestamp
        await chrome.storage.local.set({ lastSync: new Date().toISOString() });
    } catch (error) {
        console.error("Error syncing sessions:", error);
        throw error;
    }
};

module.exports = {
    getCookiesForDomain,
    hasHttpOnlyCookies,
    getStorageForDomain,
    saveSession,
    hasActiveSession,
    restoreSession,
    getLocalSessions,
    getLocalSessionsByDomain,
    deleteLocalSession,
    hasExpiredCookies,
    syncSessions,
};
