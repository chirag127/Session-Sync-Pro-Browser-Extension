/**
 * Domain Utilities
 * Helper functions for working with domains and URLs
 */

/**
 * Extract the domain from a URL
 * @param {string} url - The URL to extract the domain from
 * @returns {string} - The extracted domain
 */
export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('Error extracting domain:', error);
    return url;
  }
};

/**
 * Get the current active tab
 * @returns {Promise<Object>} - The current tab
 */
export const getCurrentTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) {
    throw new Error('No active tab found');
  }
  return tabs[0];
};

/**
 * Check if a URL is valid
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if a domain is blacklisted
 * @param {string} domain - The domain to check
 * @param {Array} blacklist - The blacklist to check against
 * @returns {boolean} - Whether the domain is blacklisted
 */
export const isDomainBlacklisted = (domain, blacklist) => {
  return blacklist.some(blacklistedDomain => {
    // Exact match
    if (blacklistedDomain === domain) {
      return true;
    }
    
    // Wildcard match (*.example.com)
    if (blacklistedDomain.startsWith('*.')) {
      const suffix = blacklistedDomain.substring(1); // Remove the *
      return domain.endsWith(suffix);
    }
    
    return false;
  });
};
