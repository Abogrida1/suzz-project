import React, { useState, useEffect, useCallback } from 'react';
import { FaSync, FaCheck, FaExclamationTriangle, FaWifi, FaWifiSlash } from 'react-icons/fa';
import { useSocket } from '../contexts/SocketContext';

const MessageSync = ({ messages, onSync, onOfflineMode }) => {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSync, setLastSync] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);
  const { socket, connected } = useSocket();

  // Check connection status
  useEffect(() => {
    if (!connected) {
      setOfflineMode(true);
      if (onOfflineMode) {
        onOfflineMode(true);
      }
    } else {
      setOfflineMode(false);
      if (onOfflineMode) {
        onOfflineMode(false);
      }
    }
  }, [connected, onOfflineMode]);

  // Load last sync time
  useEffect(() => {
    const lastSyncTime = localStorage.getItem('lastMessageSync');
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime));
    }
  }, []);

  // Load pending messages
  useEffect(() => {
    const pending = localStorage.getItem('pendingMessages');
    if (pending) {
      setPendingMessages(JSON.parse(pending));
    }
  }, []);

  // Save pending messages
  const savePendingMessages = (messages) => {
    localStorage.setItem('pendingMessages', JSON.stringify(messages));
    setPendingMessages(messages);
  };

  // Add message to pending queue
  const addPendingMessage = (message) => {
    const updated = [...pendingMessages, message];
    savePendingMessages(updated);
  };

  // Remove message from pending queue
  const removePendingMessage = (messageId) => {
    const updated = pendingMessages.filter(msg => msg.id !== messageId);
    savePendingMessages(updated);
  };

  // Sync messages
  const syncMessages = useCallback(async () => {
    if (!connected || syncStatus === 'syncing') return;

    setSyncStatus('syncing');

    try {
      // Sync pending messages
      for (const message of pendingMessages) {
        try {
          await onSync(message);
          removePendingMessage(message.id);
        } catch (err) {
          console.error('Failed to sync message:', err);
        }
      }

      // Update last sync time
      const now = new Date();
      localStorage.setItem('lastMessageSync', now.toISOString());
      setLastSync(now);
      setSyncStatus('success');

      // Clear success status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  }, [connected, syncStatus, pendingMessages, onSync]);

  // Auto-sync when connection is restored
  useEffect(() => {
    if (connected && pendingMessages.length > 0) {
      syncMessages();
    }
  }, [connected, pendingMessages.length, syncMessages]);

  // Periodic sync
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      if (pendingMessages.length > 0) {
        syncMessages();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [connected, pendingMessages.length, syncMessages]);

  // Handle message send
  const handleMessageSend = (message) => {
    if (connected) {
      // Send immediately if connected
      onSync(message);
    } else {
      // Add to pending queue if offline
      addPendingMessage({
        ...message,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      });
    }
  };

  // Get sync status icon
  const getSyncStatusIcon = () => {
    if (offlineMode) {
      return <FaWifiSlash className="h-4 w-4 text-red-500" />;
    }

    switch (syncStatus) {
      case 'syncing':
        return <FaSync className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <FaCheck className="h-4 w-4 text-green-500" />;
      case 'error':
        return <FaExclamationTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <FaWifi className="h-4 w-4 text-green-500" />;
    }
  };

  // Get sync status text
  const getSyncStatusText = () => {
    if (offlineMode) {
      return 'Offline Mode';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Sync Failed';
      default:
        return 'Online';
    }
  };

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const diff = now - lastSync;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Message Sync
        </h3>
        <div className="flex items-center space-x-2">
          {getSyncStatusIcon()}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {getSyncStatusText()}
          </span>
        </div>
      </div>

      {/* Status Information */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Connection:</span>
          <span className={`font-medium ${
            connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
          <span className="text-gray-900 dark:text-white">
            {formatLastSync()}
          </span>
        </div>

        {pendingMessages.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Pending:</span>
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {pendingMessages.length} messages
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={syncMessages}
          disabled={!connected || syncStatus === 'syncing' || pendingMessages.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSync className="h-4 w-4" />
          <span>Sync Now</span>
        </button>

        {pendingMessages.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {pendingMessages.length} message{pendingMessages.length !== 1 ? 's' : ''} waiting to sync
          </div>
        )}
      </div>

      {/* Pending Messages Preview */}
      {pendingMessages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Pending Messages
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {pendingMessages.slice(0, 5).map((message) => (
              <div
                key={message.id}
                className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                {message.content || '[Media/File]'}
              </div>
            ))}
            {pendingMessages.length > 5 && (
              <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                +{pendingMessages.length - 5} more messages
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageSync;
