// Mock global objects
global.chrome = {
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
