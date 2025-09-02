import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaTimes, FaEdit, FaSignOutAlt, FaUser, FaEnvelope, FaCalendar, FaCamera } from 'react-icons/fa';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserProfile = ({ user, onClose, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    status: user?.status || 'online'
  });
  const [uploading, setUploading] = useState(false);
  const { updateUser } = useAuth();

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      const response = await axios.put('/api/users/profile', profileData);
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setProfileData({
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      status: user?.status || 'online'
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post('/api/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { avatar } = response.data;
      updateUser({ avatar: avatar.url });
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to update avatar');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaTimes className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Avatar Section */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-2xl">
                  {user?.displayName?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
              <FaCamera className="h-4 w-4 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="spinner w-6 h-6"></div>
              </div>
            )}
          </div>

          {isEditing ? (
            <input
              type="text"
              name="displayName"
              value={profileData.displayName}
              onChange={handleInputChange}
              className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:outline-none text-center"
              placeholder="Display name"
            />
          ) : (
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user?.displayName}
            </h3>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            @{user?.username}
          </p>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <FaEnvelope className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Email
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(user?.status)}`}></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Status
              </p>
              {isEditing ? (
                <select
                  name="status"
                  value={profileData.status}
                  onChange={handleInputChange}
                  className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-none focus:outline-none"
                >
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getStatusText(user?.status)}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Bio
            </p>
            {isEditing ? (
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                className="w-full text-sm text-gray-500 dark:text-gray-400 bg-transparent border-none focus:outline-none resize-none"
                rows={3}
                maxLength={200}
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.bio || 'No bio yet'}
              </p>
            )}
          </div>

          {/* Member Since */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <FaCalendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Member since
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.createdAt && format(new Date(user.createdAt), 'MMMM yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {isEditing ? (
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <FaEdit className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <FaSignOutAlt className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
