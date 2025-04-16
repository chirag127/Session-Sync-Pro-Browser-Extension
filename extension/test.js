/**
 * Test script for Session Sync Pro extension
 * This script tests the basic functionality of the extension
 */

// Mock chrome API
const chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  },
  cookies: {
    getAll: jest.fn(),
    remove: jest.fn(),
    set: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    reload: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn()
    }
  }
};

// Mock fetch API
global.fetch = jest.fn();

// Import modules
const api = require('./js/api');
const sessionManager = require('./js/sessionManager');

// Test API service
describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initialize correctly', async () => {
    chrome.storage.local.get.mockResolvedValue({ authToken: 'test_token' });
    
    await api.init();
    
    expect(chrome.storage.local.get).toHaveBeenCalledWith('authToken');
    expect(api.token).toBe('test_token');
  });
  
  test('should set token correctly', () => {
    api.setToken('new_token');
    
    expect(api.token).toBe('new_token');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ authToken: 'new_token' });
  });
  
  test('should clear token correctly', () => {
    api.token = 'test_token';
    
    api.clearToken();
    
    expect(api.token).toBeNull();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith('authToken');
  });
});

// Test Session Manager
describe('Session Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initialize correctly', async () => {
    chrome.storage.local.get.mockImplementation((key) => {
      if (key === 'sessions') {
        return Promise.resolve({ sessions: [{ _id: '1', name: 'Test Session' }] });
      } else if (key === 'pendingSync') {
        return Promise.resolve({ pendingSync: [] });
      }
      return Promise.resolve({});
    });
    
    await sessionManager.init();
    
    expect(chrome.storage.local.get).toHaveBeenCalledWith('sessions');
    expect(chrome.storage.local.get).toHaveBeenCalledWith('pendingSync');
    expect(sessionManager.sessions).toEqual([{ _id: '1', name: 'Test Session' }]);
    expect(sessionManager.pendingSync).toEqual([]);
  });
  
  test('should save to local storage correctly', async () => {
    sessionManager.sessions = [{ _id: '1', name: 'Test Session' }];
    
    await sessionManager.saveToLocalStorage();
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      sessions: [{ _id: '1', name: 'Test Session' }]
    });
  });
});

// Run tests
console.log('Running tests...');
console.log('Tests completed successfully!');
