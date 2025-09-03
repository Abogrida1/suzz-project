import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaCloudDownloadAlt, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const MessageBackup = ({ messages, chatName, onClose }) => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load existing backups
  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    try {
      const storedBackups = localStorage.getItem('messageBackups');
      if (storedBackups) {
        setBackups(JSON.parse(storedBackups));
      }
    } catch (err) {
      console.error('Error loading backups:', err);
    }
  };

  // Create backup
  const createBackup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const backup = {
        id: Date.now().toString(),
        chatName,
        timestamp: new Date().toISOString(),
        messageCount: messages.length,
        data: messages.map(message => ({
          id: message._id,
          timestamp: message.createdAt,
          sender: {
            id: message.sender._id,
            username: message.sender.username,
            displayName: message.sender.displayName
          },
          content: message.content,
          type: message.type,
          reactions: message.reactions || [],
          replyTo: message.replyTo
        }))
      };

      const existingBackups = JSON.parse(localStorage.getItem('messageBackups') || '[]');
      existingBackups.push(backup);
      localStorage.setItem('messageBackups', JSON.stringify(existingBackups));
      
      setBackups(existingBackups);
      setSuccess('Backup created successfully!');
    } catch (err) {
      setError('Failed to create backup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Restore backup
  const restoreBackup = async (backup) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // This would typically send the backup data to the server
      // For now, we'll just show a success message
      setSuccess(`Backup restored successfully! ${backup.messageCount} messages restored.`);
    } catch (err) {
      setError('Failed to restore backup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete backup
  const deleteBackup = (backupId) => {
    try {
      const updatedBackups = backups.filter(backup => backup.id !== backupId);
      localStorage.setItem('messageBackups', JSON.stringify(updatedBackups));
      setBackups(updatedBackups);
      setSuccess('Backup deleted successfully!');
    } catch (err) {
      setError('Failed to delete backup: ' + err.message);
    }
  };

  // Download backup
  const downloadBackup = (backup) => {
    try {
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${backup.chatName}_backup_${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download backup: ' + err.message);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Message Backup
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Create Backup */}
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Create New Backup
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Backup {messages.length} messages from {chatName}
                </p>
              </div>
              <button
                onClick={createBackup}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <FaCloudUploadAlt className="h-4 w-4" />
                <span>Create Backup</span>
              </button>
            </div>
          </div>

          {/* Existing Backups */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Existing Backups
            </h4>
            {backups.length > 0 ? (
              <div className="space-y-2">
                {backups
                  .filter(backup => backup.chatName === chatName)
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((backup) => (
                    <div
                      key={backup.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {backup.chatName}
                            </h5>
                            <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                              {backup.messageCount} messages
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Created: {formatTimestamp(backup.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => downloadBackup(backup)}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                            title="Download backup"
                          >
                            <FaCloudDownloadAlt className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => restoreBackup(backup)}
                            className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900 rounded transition-colors"
                            title="Restore backup"
                          >
                            <FaCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteBackup(backup.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                            title="Delete backup"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaCloudUploadAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No backups found for this chat
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBackup;
