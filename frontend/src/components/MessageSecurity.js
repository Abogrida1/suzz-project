import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaLock, FaUnlock, FaEye, FaEyeSlash, FaKey, FaUserSecret } from 'react-icons/fa';

const MessageSecurity = ({ messages, onEncrypt, onDecrypt, onSecureDelete }) => {
  const [securityLevel, setSecurityLevel] = useState('standard'); // standard, high, maximum
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [secureDeleteEnabled, setSecureDeleteEnabled] = useState(false);
  const [messageVisibility, setMessageVisibility] = useState('all'); // all, encrypted, unencrypted
  const [securityStats, setSecurityStats] = useState({
    totalMessages: 0,
    encryptedMessages: 0,
    secureDeletedMessages: 0,
    securityScore: 0
  });

  // Calculate security statistics
  useEffect(() => {
    const stats = {
      totalMessages: messages.length,
      encryptedMessages: messages.filter(msg => msg.encrypted).length,
      secureDeletedMessages: messages.filter(msg => msg.secureDeleted).length,
      securityScore: 0
    };

    // Calculate security score
    if (stats.totalMessages > 0) {
      const encryptionRatio = stats.encryptedMessages / stats.totalMessages;
      const secureDeleteRatio = stats.secureDeletedMessages / stats.totalMessages;
      stats.securityScore = Math.round((encryptionRatio * 0.7 + secureDeleteRatio * 0.3) * 100);
    }

    setSecurityStats(stats);
  }, [messages]);

  // Handle encryption toggle
  const handleEncryptionToggle = () => {
    setEncryptionEnabled(!encryptionEnabled);
    if (onEncrypt) {
      onEncrypt(!encryptionEnabled);
    }
  };

  // Handle secure delete toggle
  const handleSecureDeleteToggle = () => {
    setSecureDeleteEnabled(!secureDeleteEnabled);
    if (onSecureDelete) {
      onSecureDelete(!secureDeleteEnabled);
    }
  };

  // Get security level color
  const getSecurityLevelColor = (level) => {
    switch (level) {
      case 'standard':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'maximum':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get security score color
  const getSecurityScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get security level icon
  const getSecurityLevelIcon = (level) => {
    switch (level) {
      case 'standard':
        return <FaUnlock className="h-4 w-4" />;
      case 'high':
        return <FaLock className="h-4 w-4" />;
      case 'maximum':
        return <FaShieldAlt className="h-4 w-4" />;
      default:
        return <FaUnlock className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FaShieldAlt className="h-6 w-6 text-blue-500" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Message Security
        </h3>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaShieldAlt className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {securityStats.totalMessages}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaLock className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Encrypted</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {securityStats.encryptedMessages}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaUserSecret className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Secure Deleted</span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            {securityStats.secureDeletedMessages}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaKey className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Security Score</span>
          </div>
          <p className={`text-2xl font-bold ${getSecurityScoreColor(securityStats.securityScore)}`}>
            {securityStats.securityScore}%
          </p>
        </div>
      </div>

      {/* Security Level */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Security Level
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'standard', label: 'Standard', description: 'Basic protection' },
            { value: 'high', label: 'High', description: 'Enhanced security' },
            { value: 'maximum', label: 'Maximum', description: 'Military grade' }
          ].map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => setSecurityLevel(value)}
              className={`p-3 rounded-lg border transition-colors ${
                securityLevel === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                {getSecurityLevelIcon(value)}
                <span className="font-medium">{label}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Security Features */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Security Features
        </h4>

        {/* Encryption */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <FaLock className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                End-to-End Encryption
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Encrypt messages with AES-256
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={encryptionEnabled}
              onChange={handleEncryptionToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Secure Delete */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <FaUserSecret className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Secure Delete
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete messages
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={secureDeleteEnabled}
              onChange={handleSecureDeleteToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Message Visibility */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <FaEye className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Message Visibility
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control which messages are visible
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'all', label: 'All Messages' },
              { value: 'encrypted', label: 'Encrypted Only' },
              { value: 'unencrypted', label: 'Unencrypted Only' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setMessageVisibility(value)}
                className={`p-2 rounded-lg border transition-colors ${
                  messageVisibility === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Security Recommendations
        </h5>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Enable end-to-end encryption for sensitive conversations</li>
          <li>• Use secure delete for messages containing sensitive information</li>
          <li>• Regularly review and clean up old messages</li>
          <li>• Use strong, unique passwords for your account</li>
        </ul>
      </div>
    </div>
  );
};

export default MessageSecurity;
