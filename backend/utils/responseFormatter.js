/**
 * Format success response
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted response
 */
const formatSuccess = (message, data = null, statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} errors - Validation errors
 * @returns {Object} - Formatted response
 */
const formatError = (message, statusCode = 400, errors = null) => {
  return {
    success: false,
    error: message,
    errors,
    statusCode
  };
};

module.exports = {
  formatSuccess,
  formatError
};
