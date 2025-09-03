import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import GroupSmartFeatures from './GroupSmartFeatures';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { 
  FaTimes, 
  FaEdit, 
  FaTrash, 
  FaUserPlus, 
  FaUserMinus, 
  FaCrown, 
  FaShieldAlt,
  FaVolumeUp,
  FaVolumeMute,
  FaBell,
  FaBellSlash,
  FaImage,
  FaSave,
  FaUsers,
  FaLock,
  FaUnlock,
  FaMagic,
  FaChartLine,
  FaLightbulb,
  FaRobot,
  FaAward
} from 'react-icons/fa';

const GroupSettingsModal = ({ group, isOpen, onClose, onGroupUpdate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSmartFeatures, setShowSmartFeatures] = useState(false);
  
  // Group settings state
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    allowInvites: true,
    muteNotifications: false,
    memberPermissions: {
      canInvite: false,
      canViewMembers: true,
      canLeaveGroup: true
    }
  });

  useEffect(() => {
    if (group && isOpen) {
      setGroupData({
        name: group.name || '',
        description: group.description || '',
        isPrivate: group.isPrivate || false,
        allowInvites: group.allowInvites !== false,
        muteNotifications: group.muteNotifications || false,
        memberPermissions: {
          canInvite: group.settings?.memberPermissions?.canInvite || false,
          canViewMembers: group.settings?.memberPermissions?.canViewMembers !== false,
          canLeaveGroup: group.settings?.memberPermissions?.canLeaveGroup !== false
        }
      });
      loadMembers();
    }
  }, [group, isOpen]);

  const loadMembers = async () => {
    if (!group) return;
    
    try {
      const response = await api.get(`/api/groups/${group._id}/members`);
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load group members');
    }
  };

  const handleSaveSettings = async () => {
    if (!group) return;
    
    setLoading(true);
    try {
      // Update basic group settings
      const response = await api.put(`/api/groups/${group._id}`, {
        name: groupData.name,
        description: groupData.description,
        isPrivate: groupData.isPrivate,
        allowInvites: groupData.allowInvites,
        muteNotifications: groupData.muteNotifications
      });
      
      // Update member permissions separately
      await api.put(`/api/groups/${group._id}/member-permissions`, {
        memberPermissions: groupData.memberPermissions
      });
      
      toast.success('Group settings updated successfully');
      onGroupUpdate(response.data.group);
      onClose();
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await api.get(`/api/groups/search-users?q=${encodeURIComponent(query)}`);
      // Filter out users who are already members
      const filteredResults = response.data.users.filter(
        user => !members.some(member => member.user._id === user._id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userToAdd) => {
    if (!group) return;
    
    try {
      await api.post(`/api/groups/${group._id}/members`, {
        userId: userToAdd._id
      });
      toast.success(`${userToAdd.displayName || userToAdd.username} added to group`);
      loadMembers();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!group) return;
    
    try {
      // Find the member to get the user ID
      const member = members.find(m => m._id === memberId);
      if (!member) {
        toast.error('Member not found');
        return;
      }
      
      await api.delete(`/api/groups/${group._id}/members/${member.user._id}`);
      toast.success('Member removed from group');
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    if (!group) return;
    
    try {
      // Find the member to get the user ID
      const member = members.find(m => m._id === memberId);
      if (!member) {
        toast.error('Member not found');
        return;
      }
      
      await api.put(`/api/groups/${group._id}/members/${member.user._id}/role`, {
        role: newRole
      });
      toast.success('Member role updated');
      loadMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await api.delete(`/api/groups/${group._id}`);
      toast.success('Group deleted successfully');
      onClose();
      // Navigate back to chats
      window.location.href = '/mobile-chats';
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = group?.admin?._id === user?._id;
  const isModerator = isAdmin || members.some(member => 
    member.user._id === user?._id && (member.role === 'admin' || member.role === 'moderator')
  );

  const tabs = [
    { id: 'general', label: 'General', icon: FaEdit, adminOnly: false },
    { id: 'members', label: 'Members', icon: FaUsers, adminOnly: false },
    { id: 'permissions', label: 'Permissions', icon: FaShieldAlt, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: FaBell, adminOnly: false },
    { id: 'smart', label: 'Smart Features', icon: FaMagic, adminOnly: true }
  ].filter(tab => !tab.adminOnly || isAdmin);

  if (!isOpen || !group) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Group Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {group.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Name
                  </label>
                  {isAdmin ? (
                    <input
                      type="text"
                      value={groupData.name}
                      onChange={(e) => setGroupData({...groupData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter group name"
                    />
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                      {groupData.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  {isAdmin ? (
                    <textarea
                      value={groupData.description}
                      onChange={(e) => setGroupData({...groupData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter group description"
                    />
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white min-h-[76px]">
                      {groupData.description || 'No description provided'}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Private Group
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Only members can see this group
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      groupData.isPrivate 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    }`}>
                      {groupData.isPrivate ? 'Private' : 'Public'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => setGroupData({...groupData, isPrivate: !groupData.isPrivate})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          groupData.isPrivate ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            groupData.isPrivate ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Member Info */}
                {!isAdmin && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Member View
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You can view group information but cannot modify settings. 
                      Only the admin can change group details.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                {/* Add Members */}
                {(isModerator || group?.settings?.memberPermissions?.canInvite) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Add Members
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleSearchUsers(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Search users to add..."
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {user.displayName?.charAt(0) || user.username?.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.displayName || user.username}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddMember(user)}
                              className="p-1 text-blue-600 hover:text-blue-700 rounded"
                            >
                              <FaUserPlus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Members List */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Members ({members.length})
                  </h3>
                  
                  {/* Permission Notice for Members */}
                  {!isModerator && group?.settings?.memberPermissions?.canViewMembers && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <FaShieldAlt className="w-4 h-4 inline mr-2" />
                        You can view members but cannot manage them. Only admins and moderators can add/remove members.
                      </p>
                    </div>
                  )}

                  {!group?.settings?.memberPermissions?.canViewMembers && !isModerator ? (
                    <div className="text-center py-8">
                      <FaLock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        You don't have permission to view group members
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {members.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {member.user.displayName?.charAt(0) || member.user.username?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {member.user.displayName || member.user.username}
                                </p>
                                {member.role === 'admin' && (
                                  <FaCrown className="w-3 h-3 text-yellow-500" />
                                )}
                                {member.role === 'moderator' && (
                                  <FaShieldAlt className="w-3 h-3 text-blue-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                @{member.user.username}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Role Selector - Only for admins */}
                            {isAdmin && member.user._id !== user?._id && (
                              <select
                                value={member.role}
                                onChange={(e) => handleChangeRole(member._id, e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              >
                                <option value="member">Member</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}

                            {/* Remove Button - Only for moderators */}
                            {isModerator && member.user._id !== user?._id && (
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                className="p-1 text-red-600 hover:text-red-700 rounded"
                              >
                                <FaUserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Allow Invites
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Members can invite others to the group
                    </p>
                  </div>
                  <button
                    onClick={() => setGroupData({...groupData, allowInvites: !groupData.allowInvites})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      groupData.allowInvites ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        groupData.allowInvites ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Member Permissions */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Member Permissions
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Can Invite Members
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Allow members to invite others to the group
                        </p>
                      </div>
                      <button
                        onClick={() => setGroupData({
                          ...groupData, 
                          memberPermissions: {
                            ...groupData.memberPermissions,
                            canInvite: !groupData.memberPermissions.canInvite
                          }
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          groupData.memberPermissions.canInvite ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            groupData.memberPermissions.canInvite ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Can View Members
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Allow members to see the list of group members
                        </p>
                      </div>
                      <button
                        onClick={() => setGroupData({
                          ...groupData, 
                          memberPermissions: {
                            ...groupData.memberPermissions,
                            canViewMembers: !groupData.memberPermissions.canViewMembers
                          }
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          groupData.memberPermissions.canViewMembers ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            groupData.memberPermissions.canViewMembers ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Can Leave Group
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Allow members to leave the group voluntarily
                        </p>
                      </div>
                      <button
                        onClick={() => setGroupData({
                          ...groupData, 
                          memberPermissions: {
                            ...groupData.memberPermissions,
                            canLeaveGroup: !groupData.memberPermissions.canLeaveGroup
                          }
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          groupData.memberPermissions.canLeaveGroup ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            groupData.memberPermissions.canLeaveGroup ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Group Permissions
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Admins can manage all settings and members</li>
                    <li>• Moderators can add/remove members and moderate messages</li>
                    <li>• Members can send messages and have limited permissions based on settings</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mute Notifications
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Don't receive notifications for this group
                    </p>
                  </div>
                  <button
                    onClick={() => setGroupData({...groupData, muteNotifications: !groupData.muteNotifications})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      groupData.muteNotifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        groupData.muteNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Member Permission Notice */}
                {!isAdmin && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                      Member Settings
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      As a member, you can only control your own notification preferences. 
                      Group-wide settings can only be changed by the admin.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'smart' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FaMagic className="text-white text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    AI-Powered Smart Features
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Unlock advanced analytics, insights, and automation for your group
                  </p>
                  <button
                    onClick={() => setShowSmartFeatures(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <FaMagic className="w-4 h-4 mr-2 inline" />
                    Open Smart Features
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <FaChartLine className="text-white w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Analytics</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track engagement, activity patterns, and member contributions
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <FaLightbulb className="text-white w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Insights</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get AI-powered suggestions and recommendations
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <FaRobot className="text-white w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Automation</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automate moderation and group management tasks
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <FaAward className="text-white w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Moderation</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Smart content filtering and member management
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              {isAdmin && (
                <button
                  onClick={handleDeleteGroup}
                  disabled={loading}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FaTrash className="w-4 h-4 mr-2 inline" />
                  Delete Group
                </button>
              )}
              
              {/* Leave Group Button for Members */}
              {!isAdmin && group?.settings?.memberPermissions?.canLeaveGroup && (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to leave this group?')) {
                      try {
                        await api.post(`/api/groups/${group._id}/leave`);
                        toast.success('Left group successfully');
                        onClose();
                        // Navigate back to chats
                        window.location.href = '/mobile-chats';
                      } catch (error) {
                        console.error('Error leaving group:', error);
                        toast.error('Failed to leave group');
                      }
                    }
                  }}
                  className="px-4 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                >
                  <FaUserMinus className="w-4 h-4 mr-2 inline" />
                  Leave Group
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {isAdmin && (
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FaSave className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Smart Features Modal */}
        {showSmartFeatures && (
          <GroupSmartFeatures
            group={group}
            isOpen={showSmartFeatures}
            onClose={() => setShowSmartFeatures(false)}
          />
        )}
      </div>
    </AnimatePresence>
  );
};

export default GroupSettingsModal;
