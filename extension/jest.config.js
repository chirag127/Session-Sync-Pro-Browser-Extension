module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: ['**/test.js'],
  moduleNameMapper: {
    '^./api.js$': '<rootDir>/js/api.js',
    '^./sessionManager.js$': '<rootDir>/js/sessionManager.js'
  },
  setupFiles: ['<rootDir>/jest.setup.js']
};
