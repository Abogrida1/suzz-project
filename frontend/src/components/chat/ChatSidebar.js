import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../config/axios';
import { 
  FaSearch, 
  FaPlus, 
  FaTimes, 
  FaEllipsisV,
  FaCircle,
  FaCheck,
  FaCheckDouble,
  FaUser,
  FaUsers,
  FaArrowLeft
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const ChatSidebar = ({ onChatSelect, selectedChat, onClose, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupCreation, setShowGroupCreation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  // Mock data for demonstration - replace with real API calls
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        // Mock conversations data
        const mockConversations = [
          {
            id: '1',
            type: 'private',
            name: 'John Doe',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
            lastMessage: 'Hey, how are you doing?',
            lastMessageTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            unreadCount: 2,
            isOnline: true,
            status: 'Hey there! I am using WhatsApp',
            userId: 'user1'
          },
          {
            id: '2',
            type: 'group',
            name: 'Team Alpha',
            avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face',
            lastMessage: 'Sarah: Great work on the project!',
            lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            unreadCount: 0,
            isOnline: false,
            status: 'Group chat',
            members: 5,
            userId: 'group1'
          },
          {
            id: '3',
            type: 'private',
            name: 'Alice Smith',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
            lastMessage: 'Thanks for the help!',
            lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            unreadCount: 0,
            isOnline: true,
            status: 'Available',
            userId: 'user2'
          }
        ];
        
        setConversations(mockConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Search users function
  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Create group function
  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      return;
    }

    try {
      const response = await api.post('/api/groups', {
        name: groupName.trim(),
        description: groupDescription.trim(),
        members: selectedUsers.map(u => u._id)
      });

      // Add the new group to conversations
      const newGroup = {
        id: response.data.group._id,
        type: 'group',
        name: response.data.group.name,
        avatar: response.data.group.avatar || `https://ui-avatars.com/api/?name=${response.data.group.name}&background=3b82f6&color=fff`,
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
        isOnline: false,
        status: 'Group chat',
        members: response.data.group.members.length,
        groupId: response.data.group._id
      };

      setConversations(prev => [newGroup, ...prev]);
      setShowGroupCreation(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);
      onChatSelect(newGroup);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Start private chat with user
  const startPrivateChat = (userData) => {
    const existingChat = conversations.find(conv => 
      conv.type === 'private' && conv.userId === userData._id
    );

    if (existingChat) {
      onChatSelect(existingChat);
    } else {
      const newChat = {
        id: `private_${userData._id}`,
        type: 'private',
        name: userData.displayName || userData.username,
        avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.username}&background=3b82f6&color=fff`,
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
        isOnline: onlineUsers.some(u => u._id === userData._id),
        status: 'Available',
        userId: userData._id
      };

      setConversations(prev => [newChat, ...prev]);
      onChatSelect(newChat);
    }
    setShowUserSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMessageStatus = (conversation) => {
    if (conversation.unreadCount > 0) {
      return <FaCheck className="w-3 h-3 text-gray-400" />;
    }
    return <FaCheckDouble className="w-3 h-3 text-blue-500" />;
  };

  const getLastMessageTime = (time) => {
    const now = new Date();
    const diffInHours = (now - time) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return time.toLocaleDateString([], { weekday: 'short' });
    } else {
      return time.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Chats
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FaSearch className="w-4 h-4" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowUserSearch(!showUserSearch)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Search users"
              >
                <FaUser className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowGroupCreation(!showGroupCreation)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Create group"
              >
                <FaUsers className="w-4 h-4" />
              </button>
            </div>
            {isMobile && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-white dark:bg-gray-800 z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowUserSearch(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search Users</h2>
              </div>
              <div className="mt-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No users found'}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((userData) => (
                    <motion.div
                      key={userData._id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startPrivateChat(userData)}
                      className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={userData.avatar || `https://ui-avatars.com/api/?name=${userData.username}&background=3b82f6&color=fff`}
                          alt={userData.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {userData.displayName || userData.username}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            @{userData.username}
                          </p>
                        </div>
                        {onlineUsers.some(u => u._id === userData._id) && (
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Creation Modal */}
      <AnimatePresence>
        {showGroupCreation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-white dark:bg-gray-800 z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowGroupCreation(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Group</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Enter group description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Members
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users to add..."
                    onChange={(e) => searchUsers(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Members ({selectedUsers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((userData) => (
                        <div key={userData._id} className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                          <span>{userData.displayName || userData.username}</span>
                          <button
                            onClick={() => setSelectedUsers(prev => prev.filter(u => u._id !== userData._id))}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto">
                    <div className="space-y-1">
                      {searchResults
                        .filter(u => !selectedUsers.some(su => su._id === u._id) && u._id !== user._id)
                        .map((userData) => (
                        <motion.div
                          key={userData._id}
                          whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (!selectedUsers.some(su => su._id === userData._id)) {
                              setSelectedUsers(prev => [...prev, userData]);
                            }
                          }}
                          className="p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={userData.avatar || `https://ui-avatars.com/api/?name=${userData.username}&background=3b82f6&color=fff`}
                              alt={userData.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {userData.displayName || userData.username}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                @{userData.username}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Create Group
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChatSelect(conversation)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat?.id === conversation.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={conversation.avatar}
                      alt={conversation.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {conversation.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {getMessageStatus(conversation)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getLastMessageTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
