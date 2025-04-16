/**
 * Sync Manager
 * Handles synchronization of sessions with the backend server
 */

import { API_BASE_URL } from '../utils/api';

// Flag to track if sync is in progress
let isSyncing = false;

// Queue for pending sync operations
const syncQueue = [];

/**
 * Set up the sync manager
 * - Creates an alarm for periodic sync
 * - Sets up listeners for online/offline events
 */
export const setupSyncManager = () => {
  // Create alarm for periodic sync (every 15 minutes)
  chrome.alarms.create('syncSessions', {
    periodInMinutes: 15
  });
  
  // Listen for alarm
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'syncSessions') {
      syncAllSessions();
    }
  });
  
  // Listen for online event
  window.addEventListener('online', () => {
    console.log('Browser is online, syncing sessions...');
    syncAllSessions();
  });
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.authToken) {
      // If user just logged in, sync all sessions
      if (changes.authToken.newValue && !changes.authToken.oldValue) {
        console.log('User logged in, syncing sessions...');
        syncAllSessions();
      }
    }
  });
};

/**
 * Sync all sessions with the backend
 * @returns {Promise<void>}
 */
export const syncAllSessions = async () => {
  try {
    // Check if user is logged in
    const { authToken } = await chrome.storage.local.get('authToken');
    if (!authToken) {
      console.log('User not logged in, skipping sync');
      return;
    }
    
    // Check if browser is online
    if (!navigator.onLine) {
      console.log('Browser is offline, queueing sync for later');
      // Add to sync queue if not already in progress
      if (!isSyncing) {
        syncQueue.push({ action: 'syncAll' });
      }
      return;
    }
    
    // Prevent multiple syncs from running simultaneously
    if (isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }
    
    isSyncing = true;
    
    // Get sessions from local storage
    const { sessions } = await chrome.storage.local.get('sessions');
    
    // Get sessions from server
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const { data: serverSessions } = await response.json();
    
    // Merge local and server sessions
    const mergedSessions = mergeSessions(sessions, serverSessions);
    
    // Update local storage with merged sessions
    await chrome.storage.local.set({ sessions: mergedSessions });
    
    // Process any pending sync operations
    await processSyncQueue();
    
    console.log('Session sync completed successfully');
  } catch (error) {
    console.error('Error syncing sessions:', error);
  } finally {
    isSyncing = false;
  }
};

/**
 * Sync a single session with the backend
 * @param {Object} session - The session to sync
 * @returns {Promise<Object>} - The synced session with server ID
 */
export const syncSession = async (session) => {
  try {
    // Check if user is logged in
    const { authToken } = await chrome.storage.local.get('authToken');
    if (!authToken) {
      console.log('User not logged in, skipping sync');
      return session;
    }
    
    // Check if browser is online
    if (!navigator.onLine) {
      console.log('Browser is offline, queueing sync for later');
      // Add to sync queue
      syncQueue.push({ action: 'syncSession', session });
      return session;
    }
    
    // If session already has a server ID, update it
    if (session.serverId) {
      const response = await fetch(`${API_BASE_URL}/sessions/${session.serverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: session.name,
          faviconUrl: session.faviconUrl,
          cookies: session.cookies,
          localStorage: session.localStorage,
          sessionStorage: session.sessionStorage,
          hasHttpOnlyCookies: session.hasHttpOnlyCookies
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const { data: updatedSession } = await response.json();
      
      // Update local session with server data
      const syncedSession = {
        ...session,
        serverId: updatedSession._id,
        lastSynced: new Date().toISOString()
      };
      
      // Update session in local storage
      const { sessions } = await chrome.storage.local.get('sessions');
      const updatedSessions = sessions.map(s => 
        s.id === session.id ? syncedSession : s
      );
      await chrome.storage.local.set({ sessions: updatedSessions });
      
      return syncedSession;
    } else {
      // Create new session on server
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: session.name,
          domain: session.domain,
          faviconUrl: session.faviconUrl,
          cookies: session.cookies,
          localStorage: session.localStorage,
          sessionStorage: session.sessionStorage,
          hasHttpOnlyCookies: session.hasHttpOnlyCookies
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const { data: newSession } = await response.json();
      
      // Update local session with server ID
      const syncedSession = {
        ...session,
        serverId: newSession._id,
        lastSynced: new Date().toISOString()
      };
      
      // Update session in local storage
      const { sessions } = await chrome.storage.local.get('sessions');
      const updatedSessions = sessions.map(s => 
        s.id === session.id ? syncedSession : s
      );
      await chrome.storage.local.set({ sessions: updatedSessions });
      
      return syncedSession;
    }
  } catch (error) {
    console.error('Error syncing session:', error);
    return session;
  }
};

/**
 * Sync session deletion with the backend
 * @param {string} serverId - The server ID of the session to delete
 * @returns {Promise<void>}
 */
export const syncDeleteSession = async (serverId) => {
  try {
    // Check if user is logged in
    const { authToken } = await chrome.storage.local.get('authToken');
    if (!authToken) {
      console.log('User not logged in, skipping sync');
      return;
    }
    
    // Check if browser is online
    if (!navigator.onLine) {
      console.log('Browser is offline, queueing sync for later');
      // Add to sync queue
      syncQueue.push({ action: 'deleteSession', serverId });
      return;
    }
    
    // Delete session on server
    const response = await fetch(`${API_BASE_URL}/sessions/${serverId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    console.log('Session deleted on server successfully');
  } catch (error) {
    console.error('Error syncing session deletion:', error);
  }
};

/**
 * Process the sync queue
 * @returns {Promise<void>}
 */
const processSyncQueue = async () => {
  // Process all items in the queue
  while (syncQueue.length > 0) {
    const item = syncQueue.shift();
    
    try {
      switch (item.action) {
        case 'syncAll':
          await syncAllSessions();
          break;
        case 'syncSession':
          await syncSession(item.session);
          break;
        case 'deleteSession':
          await syncDeleteSession(item.serverId);
          break;
      }
    } catch (error) {
      console.error(`Error processing sync queue item ${item.action}:`, error);
      // Put the item back in the queue to try again later
      syncQueue.push(item);
      break;
    }
  }
};

/**
 * Merge local and server sessions
 * @param {Array} localSessions - Local sessions
 * @param {Array} serverSessions - Server sessions
 * @returns {Array} - Merged sessions
 */
const mergeSessions = (localSessions, serverSessions) => {
  // Create a map of local sessions by server ID
  const localSessionMap = {};
  localSessions.forEach(session => {
    if (session.serverId) {
      localSessionMap[session.serverId] = session;
    }
  });
  
  // Create a map of server sessions by ID
  const serverSessionMap = {};
  serverSessions.forEach(session => {
    serverSessionMap[session._id] = session;
  });
  
  // Merge sessions
  const mergedSessions = [];
  
  // Process local sessions
  localSessions.forEach(localSession => {
    if (localSession.serverId) {
      // Session exists on server
      const serverSession = serverSessionMap[localSession.serverId];
      
      if (serverSession) {
        // Compare timestamps to determine which is newer
        const localLastModified = new Date(localSession.lastUsed);
        const serverLastModified = new Date(serverSession.lastUsed);
        
        if (localLastModified > serverLastModified) {
          // Local session is newer, keep it and update server
          mergedSessions.push(localSession);
          syncSession(localSession);
        } else {
          // Server session is newer, convert to local format
          mergedSessions.push({
            id: localSession.id,
            serverId: serverSession._id,
            name: serverSession.name,
            domain: serverSession.domain,
            faviconUrl: serverSession.faviconUrl,
            cookies: serverSession.cookies,
            localStorage: serverSession.localStorage,
            sessionStorage: serverSession.sessionStorage,
            hasHttpOnlyCookies: serverSession.hasHttpOnlyCookies,
            createdAt: serverSession.createdAt,
            lastUsed: serverSession.lastUsed,
            lastSynced: new Date().toISOString()
          });
        }
      } else {
        // Session was deleted on server, keep local copy and re-sync
        const sessionWithoutServerId = { ...localSession };
        delete sessionWithoutServerId.serverId;
        mergedSessions.push(sessionWithoutServerId);
        syncSession(sessionWithoutServerId);
      }
    } else {
      // Session doesn't exist on server yet, add it
      mergedSessions.push(localSession);
      syncSession(localSession);
    }
  });
  
  // Add server sessions that don't exist locally
  serverSessions.forEach(serverSession => {
    const localSession = localSessionMap[serverSession._id];
    
    if (!localSession) {
      // Convert server session to local format
      mergedSessions.push({
        id: uuidv4(),
        serverId: serverSession._id,
        name: serverSession.name,
        domain: serverSession.domain,
        faviconUrl: serverSession.faviconUrl,
        cookies: serverSession.cookies,
        localStorage: serverSession.localStorage,
        sessionStorage: serverSession.sessionStorage,
        hasHttpOnlyCookies: serverSession.hasHttpOnlyCookies,
        createdAt: serverSession.createdAt,
        lastUsed: serverSession.lastUsed,
        lastSynced: new Date().toISOString()
      });
    }
  });
  
  return mergedSessions;
};
