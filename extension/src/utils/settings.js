/**
 * Settings utility functions
 */

/**
 * Get the disabled sites from storage
 * @returns {Promise<Array>} The disabled sites
 */
const getDisabledSites = async () => {
    const { disabledSites = [] } = await chrome.storage.local.get(
        "disabledSites"
    );
    return disabledSites;
};

/**
 * Set the disabled sites in storage
 * @param {Array} sites - The disabled sites
 * @returns {Promise<void>}
 */
const setDisabledSites = async (sites) => {
    await chrome.storage.local.set({ disabledSites: sites });
};

/**
 * Check if a domain is disabled
 * @param {string} domain - The domain to check
 * @returns {Promise<boolean>} True if the domain is disabled
 */
const isDomainDisabled = async (domain) => {
    const disabledSites = await getDisabledSites();
    return disabledSites.some((site) => domain.includes(site));
};

/**
 * Get the API URL from storage
 * @returns {Promise<string>} The API URL
 */
const getApiUrl = async () => {
    const { apiUrl = "http://localhost:3000" } = await chrome.storage.local.get(
        "apiUrl"
    );
    return apiUrl;
};

/**
 * Set the API URL in storage
 * @param {string} url - The API URL
 * @returns {Promise<void>}
 */
const setApiUrl = async (url) => {
    await chrome.storage.local.set({ apiUrl: url });
};

/**
 * Save settings to storage
 * @param {Object} settings - The settings to save
 * @returns {Promise<void>}
 */
const saveSettings = async (settings) => {
    const { disabledSites, apiUrl } = settings;

    // Convert disabled sites string to array
    const disabledSitesArray = disabledSites
        .split("\n")
        .map((site) => site.trim())
        .filter((site) => site);

    await setDisabledSites(disabledSitesArray);
    await setApiUrl(apiUrl);
};

module.exports = {
    getDisabledSites,
    setDisabledSites,
    isDomainDisabled,
    getApiUrl,
    setApiUrl,
    saveSettings,
};
