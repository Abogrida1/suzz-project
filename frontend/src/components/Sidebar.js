import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../config/axios';
import { 
  FaSearch, 
  FaTimes, 
  FaUsers, 
  FaUser, 
  FaPlus,
  FaCircle,
  FaClock
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const Sidebar = ({ activeChat, selectedUser, onChatSelect, onClose, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { user } = useAuth();
  const { onlineUsers: socketOnlineUsers } = useSocket();

  // Fetch recent conversations and groups
  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      
      try {
        // Fetch conversations
        const conversationsResponse = await api.get('/api/messages/conversations/recent');
        setRecentConversations(conversationsResponse.data.conversations || []);
        
        // Fetch user groups
        const groupsResponse = await api.get('/api/groups/my-groups');
        setUserGroups(groupsResponse.data.groups || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        // Don't show error to user, just log it
        // Set empty data as fallback
        setRecentConversations([]);
        setUserGroups([]);
      }
    };

    fetchData();
  }, [user?._id]);

  // Listen for new messages to update conversations
  useEffect(() => {
    const handleNewMessage = (event) => {
      const message = event.detail;
      console.log('New message in Sidebar:', message);
      
      // Update recent conversations when new message arrives
      if (message.chatType === 'private') {
        setRecentConversations(prev => {
          const existingIndex = prev.findIndex(conv => 
            conv.user._id === message.sender._id || 
            conv.user._id === message.privateChatWith
          );
          
          if (existingIndex >= 0) {
            // Update existing conversation
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              lastMessage: message,
              unreadCount: message.sender._id !== user._id ? 
                (updated[existingIndex].unreadCount || 0) + 1 : 
                updated[existingIndex].unreadCount
            };
            // Move to top
            const [moved] = updated.splice(existingIndex, 1);
            return [moved, ...updated];
          } else {
            // Add new conversation
            const otherUserId = message.sender._id === user._id ? 
              message.privateChatWith : message.sender._id;
            
            return [{
              user: message.sender,
              lastMessage: message,
              unreadCount: message.sender._id !== user._id ? 1 : 0
            }, ...prev];
          }
        });
      }
    };

    window.addEventListener('newMessage', handleNewMessage);
    return () => window.removeEventListener('newMessage', handleNewMessage);
  }, [user?._id]);

  // Update online users from socket
  useEffect(() => {
    setOnlineUsers(socketOnlineUsers);
  }, [socketOnlineUsers]);

  // Search users
  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleUserSelect = (selectedUser) => {
    onChatSelect('private', selectedUser);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const getLastMessageTime = (lastMessage) => {
    if (!lastMessage) return '';
    return formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true });
  };

  const getOnlineStatus = (userId) => {
    return onlineUsers.find(u => u._id === userId)?.isOnline || false;
  };

  const getUnreadCount = (conversation) => {
    return conversation.unreadCount || 0;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header - WhatsApp Style */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chats
          </h2>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FaTimes className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowSearch(true)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Search Results */}
          {showSearch && (searchQuery.length >= 2 || searchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="spinner mx-auto"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((searchUser) => (
                  <button
                    key={searchUser._id}
                    onClick={() => handleUserSelect(searchUser)}
                    className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {searchUser.displayName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      {getOnlineStatus(searchUser._id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {searchUser.displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{searchUser.username}
                      </p>
                    </div>
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Global Chat - Hidden on mobile */}
        <button
          onClick={() => onChatSelect('global')}
          className={`hidden md:block w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
            activeChat === 'global' ? 'bg-primary-50 dark:bg-primary-900/20' : ''
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FaUsers className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Global Chat
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chat with everyone
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </button>

        {/* Create Group Button */}
        <button
          onClick={() => window.location.href = '/create-group'}
          className="hidden md:block w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
              <FaPlus className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Create Group
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Start a group chat
              </p>
            </div>
          </div>
        </button>

        {/* User Groups */}
        {userGroups.length > 0 && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              My Groups
            </h3>
            <div className="space-y-1">
              {userGroups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => onChatSelect('group', group)}
                  className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                    activeChat === 'group' && selectedUser?._id === group._id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {group.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {group.name}
                        </p>
                        {group.unreadCount > 0 && (
                          <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {group.unreadCount}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {group.memberCount || group.members?.length || 0} members
                        {group.admin?._id === user._id && (
                          <span className="ml-1 text-yellow-500">👑</span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Conversations */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Recent Conversations
          </h3>
          
          {recentConversations.length > 0 ? (
            <div className="space-y-1">
              {recentConversations.map((conversation) => (
                <button
                  key={conversation.user._id}
                  onClick={() => onChatSelect('private', conversation.user)}
                  className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                    activeChat === 'private' && selectedUser?._id === conversation.user._id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {conversation.user.displayName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      {getOnlineStatus(conversation.user._id) ? (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.user.displayName}
                        </p>
                        <div className="flex items-center space-x-2">
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getLastMessageTime(conversation.lastMessage)}
                            </span>
                          )}
                          {getUnreadCount(conversation) > 0 && (
                            <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {getUnreadCount(conversation)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaUser className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No conversations yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Start a conversation by searching for users
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close search */}
      {showSearch && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowSearch(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;
