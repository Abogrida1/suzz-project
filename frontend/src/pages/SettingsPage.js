import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Navigation from '../components/Navigation';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { 
  FaUser, 
  FaBell, 
  FaShieldAlt, 
  FaPalette, 
  FaLanguage, 
  FaSignOutAlt,
  FaSave,
  FaCamera,
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaMoon,
  FaSun,
  FaVolumeUp,
  FaVolumeMute,
  FaDesktop,
  FaMobile
} from 'react-icons/fa';

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    displayName: '',
    username: '',
    email: '',
    bio: '',
    avatar: null
  });

  // Handle avatar upload
  const handleAvatarUpload = (avatarUrl) => {
    setProfileData(prev => ({ ...prev, avatar: avatarUrl }));
    updateUser({ ...user, avatar: avatarUrl });
    toast.success('تم رفع الصورة الشخصية بنجاح');
  };

  // Handle avatar removal
  const handleAvatarRemove = () => {
    setProfileData(prev => ({ ...prev, avatar: null }));
    updateUser({ ...user, avatar: null });
    toast.success('تم حذف الصورة الشخصية');
  };
  
  // Security settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    messageNotifications: true,
    soundNotifications: true,
    emailNotifications: false,
    pushNotifications: true
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    allowDirectMessages: true,
    profileVisibility: 'public'
  });
  
  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: 'light',
    fontSize: 'medium',
    language: 'en',
    compactMode: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: user.avatar || null
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('displayName', profileData.displayName);
      formData.append('username', profileData.username);
      formData.append('bio', profileData.bio);
      
      if (profileData.avatar) {
        formData.append('avatar', profileData.avatar);
      }
      
      const response = await api.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await api.put('/api/users/password', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      });
      
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      await api.put('/api/users/notifications', notifications);
      toast.success('Notification settings updated!');
    } catch (error) {
      console.error('Notification update error:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const handlePrivacyUpdate = async () => {
    try {
      await api.put('/api/users/privacy', privacy);
      toast.success('Privacy settings updated!');
    } catch (error) {
      console.error('Privacy update error:', error);
      toast.error('Failed to update privacy settings');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData(prev => ({ ...prev, avatar: file }));
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'security', label: 'Security', icon: FaShieldAlt },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'privacy', label: 'Privacy', icon: FaGlobe },
    { id: 'appearance', label: 'Appearance', icon: FaPalette }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-page">
      <Navigation user={user} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="mr-3 h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Profile Information
                  </h2>
                  
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center space-x-6">
                      <ProfilePictureUpload
                        currentAvatar={profileData.avatar || user?.avatar}
                        onUpload={handleAvatarUpload}
                        onRemove={handleAvatarRemove}
                        size="large"
                        className="flex-shrink-0"
                      />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          الصورة الشخصية
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          اضغط على أيقونة الكاميرا لتغيير صورتك الشخصية
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          الحد الأقصى: 5 ميجابايت • JPG, PNG, GIF
                        </p>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="input-field"
                        placeholder="Enter your display name"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                        className="input-field"
                        placeholder="Enter your username"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="input-field bg-gray-100 dark:bg-gray-700"
                        placeholder="Email cannot be changed"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        className="input-field h-24 resize-none"
                        placeholder="Tell us about yourself"
                        maxLength={160}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {profileData.bio.length}/160 characters
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <FaSave className="mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Security Settings
                  </h2>
                  
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="input-field pr-10"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="input-field"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="input-field"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Notification Settings
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Message Notifications
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Get notified when you receive new messages
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.messageNotifications}
                          onChange={(e) => setNotifications(prev => ({ ...prev, messageNotifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Sound Notifications
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Play sound when receiving notifications
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.soundNotifications}
                          onChange={(e) => setNotifications(prev => ({ ...prev, soundNotifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive notifications via email
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.emailNotifications}
                          onChange={(e) => setNotifications(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <button
                      onClick={handleNotificationUpdate}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Privacy Settings
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Show Online Status
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Let others see when you're online
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacy.showOnlineStatus}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, showOnlineStatus: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Show Last Seen
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Show when you were last active
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacy.showLastSeen}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, showLastSeen: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Allow Direct Messages
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Let others send you direct messages
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacy.allowDirectMessages}
                          onChange={(e) => setPrivacy(prev => ({ ...prev, allowDirectMessages: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Profile Visibility
                      </label>
                      <select
                        value={privacy.profileVisibility}
                        onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
                        className="input-field"
                      >
                        <option value="public">Public</option>
                        <option value="friends">Friends Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <button
                      onClick={handlePrivacyUpdate}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Save Privacy Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Appearance Settings
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Theme
                      </label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => toggleTheme()}
                          className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                            theme === 'light'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900 dark:text-blue-300'
                              : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {theme === 'light' ? <FaSun className="mr-2" /> : <FaMoon className="mr-2" />}
                          {theme === 'light' ? 'Light' : 'Dark'} Mode
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Font Size
                      </label>
                      <select
                        value={appearance.fontSize}
                        onChange={(e) => setAppearance(prev => ({ ...prev, fontSize: e.target.value }))}
                        className="input-field"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={appearance.language}
                        onChange={(e) => setAppearance(prev => ({ ...prev, language: e.target.value }))}
                        className="input-field"
                      >
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                        <option value="fr">Français</option>
                        <option value="es">Español</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Compact Mode
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Use less space for messages and interface
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appearance.compactMode}
                          onChange={(e) => setAppearance(prev => ({ ...prev, compactMode: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
