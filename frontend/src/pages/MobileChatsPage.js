import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import ChatArea from '../components/ChatArea';
import { FaSearch, FaPlus, FaArrowLeft, FaUsers, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const MobileChatsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [recentConversations, setRecentConversations] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch recent conversations and groups
  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      
      try {
        // Fetch conversations
        const conversationsResponse = await fetch('/api/messages/conversations/recent', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const conversationsData = await conversationsResponse.json();
        setRecentConversations(conversationsData.conversations || []);
        
        // Fetch user groups
        const groupsResponse = await fetch('/api/groups/my-groups', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const groupsData = await groupsResponse.json();
        setUserGroups(groupsData.groups || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setRecentConversations([]);
        setUserGroups([]);
      }
    };

    fetchData();
  }, [user?._id]);

  const handleChatSelect = (chatType, user = null) => {
    if (chatType === 'global') {
      setActiveChat('global');
      setSelectedUser(null);
    } else if (chatType === 'private' && user) {
      setActiveChat('private');
      setSelectedUser(user);
    } else if (chatType === 'group' && user) {
      setActiveChat('group');
      setSelectedUser(user);
    }
  };

  const handleBackToChats = () => {
    setActiveChat(null);
    setSelectedUser(null);
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.users && data.users.length > 0) {
        setSearchResults(data.users);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  // If a chat is selected, show the chat area
  if (activeChat) {
    return (
      <div className="mobile-chat-container bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navigation user={user} hideBottomMenu={true} />
        <div className="mobile-chat-area">
          <ChatArea
            activeChat={activeChat}
            selectedUser={selectedUser}
            onBackToSidebar={handleBackToChats}
            isMobile={true}
          />
        </div>
      </div>
    );
  }

  // Otherwise, show the chats list
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col mobile-page">
      <Navigation user={user} hideBottomMenu={false} />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chats
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select a conversation
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!showSearchInput ? (
              <button 
                onClick={() => setShowSearchInput(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Search"
              >
                <FaSearch className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center space-x-2 flex-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Search users..."
                    className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white"
                    autoFocus
                  />
                  {loading && (
                    <div className="absolute right-3 top-2.5">
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setShowSearchInput(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Close"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            )}
            <button 
              onClick={() => toast.success('New chat feature coming soon!')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="New Chat"
            >
              <FaPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Global Chat Button */}
          <button
            onClick={() => handleChatSelect('global')}
            className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border-b border-gray-100 dark:border-gray-700 mb-4"
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
            onClick={() => navigate('/create-group')}
            className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border-b border-gray-100 dark:border-gray-700 mb-4"
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
            <>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                My Groups
              </h3>
              <div className="groups-horizontal-scroll mb-4">
                {userGroups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => handleChatSelect('group', group)}
                    className="group-card-horizontal p-3 text-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {group.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="w-full">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {group.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {group.memberCount || group.members?.length || 0} members
                        </p>
                        {group.admin?._id === user._id && (
                          <span className="text-yellow-500 text-xs">👑</span>
                        )}
                        {group.unreadCount > 0 && (
                          <span className="bg-primary-500 text-white text-xs rounded-full px-1 py-0.5 min-w-[16px] text-center block mt-1">
                            {group.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Search Results */}
          {searchQuery && (
            <>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                {loading ? 'Searching...' : searchResults.length > 0 ? 'Search Results' : 'No users found'}
              </h3>
              {searchResults.length > 0 && (
                <div className="space-y-1 mb-4">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => {
                        handleChatSelect('private', user);
                        setShowSearchInput(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.displayName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            @{user.username}
                          </p>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          <FaPlus className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Recent Conversations
          </h3>
          
          {recentConversations.length > 0 ? (
            <div className="space-y-1">
              {recentConversations.map((conversation) => (
                <button
                  key={conversation.user._id}
                  onClick={() => handleChatSelect('private', conversation.user)}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {conversation.user.displayName?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.user.displayName}
                        </p>
                        <div className="flex items-center space-x-2">
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          )}
                          {conversation.unreadCount > 0 && (
                            <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unreadCount}
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
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Start a conversation by searching for users
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileChatsPage;
