import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { 
  FaMoon, 
  FaSun, 
  FaBell, 
  FaShieldAlt, 
  FaLanguage, 
  FaVolumeUp,
  FaVolumeMute,
  FaEye,
  FaEyeSlash,
  FaDownload,
  FaTrash,
  FaKey,
  FaUserShield,
  FaGlobe,
  FaPalette
} from 'react-icons/fa';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: {
      messages: true,
      mentions: true,
      sounds: true,
      email: false
    },
    privacy: {
      showOnlineStatus: true,
      showLastSeen: true,
      allowFriendRequests: true,
      allowGroupInvites: true
    },
    appearance: {
      fontSize: 'medium',
      compactMode: false,
      showAvatars: true,
      showTimestamps: true
    },
    language: 'en',
    autoDownload: true
  });

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Implement account deletion
      console.log('Delete account');
    }
  };

  const exportData = () => {
    // Implement data export
    console.log('Export data');
  };

  const SettingItem = ({ icon: Icon, title, description, children }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <Navigation user={user} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your SecureChat experience
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaPalette className="w-5 h-5 mr-2" />
              Appearance
            </h2>

            <div className="space-y-4">
              <SettingItem
                icon={settings.theme === 'dark' ? FaMoon : FaSun}
                title="Theme"
                description="Choose your preferred theme"
              >
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </SettingItem>

              <SettingItem
                icon={FaEye}
                title="Font Size"
                description="Adjust the text size"
              >
                <select
                  value={settings.appearance.fontSize}
                  onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </SettingItem>

              <SettingItem
                icon={FaEye}
                title="Compact Mode"
                description="Reduce spacing for more content"
              >
                <Toggle
                  enabled={settings.appearance.compactMode}
                  onChange={(value) => handleSettingChange('appearance', 'compactMode', value)}
                />
              </SettingItem>

              <SettingItem
                icon={FaEye}
                title="Show Avatars"
                description="Display user avatars in messages"
              >
                <Toggle
                  enabled={settings.appearance.showAvatars}
                  onChange={(value) => handleSettingChange('appearance', 'showAvatars', value)}
                />
              </SettingItem>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaBell className="w-5 h-5 mr-2" />
              Notifications
            </h2>

            <div className="space-y-4">
              <SettingItem
                icon={FaBell}
                title="Message Notifications"
                description="Get notified about new messages"
              >
                <Toggle
                  enabled={settings.notifications.messages}
                  onChange={(value) => handleSettingChange('notifications', 'messages', value)}
                />
              </SettingItem>

              <SettingItem
                icon={FaBell}
                title="Mention Notifications"
                description="Get notified when someone mentions you"
              >
                <Toggle
                  enabled={settings.notifications.mentions}
                  onChange={(value) => handleSettingChange('notifications', 'mentions', value)}
                />
              </SettingItem>

              <SettingItem
                icon={settings.notifications.sounds ? FaVolumeUp : FaVolumeMute}
                title="Sound Notifications"
                description="Play sounds for notifications"
              >
                <Toggle
                  enabled={settings.notifications.sounds}
                  onChange={(value) => handleSettingChange('notifications', 'sounds', value)}
                />
              </SettingItem>

              <SettingItem
                icon={FaBell}
                title="Email Notifications"
                description="Receive notifications via email"
              >
                <Toggle
                  enabled={settings.notifications.email}
                  onChange={(value) => handleSettingChange('notifications', 'email', value)}
                />
              </SettingItem>
            </div>
          </motion.div>

          {/* Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaShieldAlt className="w-5 h-5 mr-2" />
              Privacy & Security
            </h2>

            <div className="space-y-4">
              <SettingItem
                icon={FaEye}
                title="Show Online Status"
                description="Let others see when you're online"
              >
                <Toggle
                  enabled={settings.privacy.showOnlineStatus}
                  onChange={(value) => handleSettingChange('privacy', 'showOnlineStatus', value)}
                />
              </SettingItem>

              <SettingItem
                icon={FaEye}
                title="Show Last Seen"
                description="Let others see when you were last active"
              >
                <Toggle
                  enabled={settings.privacy.showLastSeen}
                  onChange={(value) => handleSettingChange('privacy', 'showLastSeen', value)}
                />
              </SettingItem>

              <SettingItem
                icon={FaUserShield}
                title="Allow Friend Requests"
                description="Let others send you friend requests"
              >
                <Toggle
                  enabled={settings.privacy.allowFriendRequests}
                  onChange={(value) => handleSettingChange('privacy', 'allowFriendRequests', value)}
                />
              </SettingItem>

              <SettingItem
                icon={FaUserShield}
                title="Allow Group Invites"
                description="Let others invite you to groups"
              >
                <Toggle
                  enabled={settings.privacy.allowGroupInvites}
                  onChange={(value) => handleSettingChange('privacy', 'allowGroupInvites', value)}
                />
              </SettingItem>
            </div>
          </motion.div>

          {/* General */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaLanguage className="w-5 h-5 mr-2" />
              General
            </h2>

            <div className="space-y-4">
              <SettingItem
                icon={FaLanguage}
                title="Language"
                description="Choose your preferred language"
              >
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </SettingItem>

              <SettingItem
                icon={FaDownload}
                title="Auto Download"
                description="Automatically download media files"
              >
                <Toggle
                  enabled={settings.autoDownload}
                  onChange={(value) => setSettings(prev => ({ ...prev, autoDownload: value }))}
                />
              </SettingItem>
            </div>
          </motion.div>

          {/* Account Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaKey className="w-5 h-5 mr-2" />
              Account Actions
            </h2>

            <div className="space-y-4">
              <button
                onClick={exportData}
                className="w-full flex items-center justify-center space-x-2 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <FaDownload className="w-5 h-5" />
                <span>Export My Data</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
              >
                <FaKey className="w-5 h-5" />
                <span>Sign Out</span>
              </button>

              <button
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <FaTrash className="w-5 h-5" />
                <span>Delete Account</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
