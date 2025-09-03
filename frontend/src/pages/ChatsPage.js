import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { FaSearch, FaPlus, FaFilter, FaComments } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ChatsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState('global');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBackToSidebar = () => {
    setShowSidebar(true);
  };

  const handleChatSelect = (chatType, user = null) => {
    setActiveChat(chatType);
    setSelectedUser(user);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col chat-container mobile-page">
      <Navigation user={user} hideBottomMenu={true} />
      


      {/* Desktop Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Messages
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Connect and chat with your friends
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
                All
              </button>
              <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg text-sm font-medium transition-colors">
                Unread
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/chats?search=${encodeURIComponent(e.target.value)}`);
                  }
                }}
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border-0 focus:ring-2 focus:ring-primary-500 focus:outline-none w-80"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <button 
              onClick={() => toast.success('Filter feature coming soon!')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Filter"
            >
              <FaFilter className="w-4 h-4" />
            </button>
            <button 
              onClick={() => toast.success('New chat feature coming soon!')}
              className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              title="New Chat"
            >
              <FaPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar - WhatsApp Style */}
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
            className={`${isMobile ? 'fixed inset-0 z-50 bg-black bg-opacity-50' : 'relative'} flex`}
          >
            <div className={`${isMobile ? 'w-80 h-full' : 'w-80'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0 shadow-lg`}>
              <Sidebar
                activeChat={activeChat}
                selectedUser={selectedUser}
                onChatSelect={handleChatSelect}
                onClose={() => setShowSidebar(false)}
                isMobile={isMobile}
              />
            </div>
            {isMobile && (
              <div 
                className="flex-1" 
                onClick={() => setShowSidebar(false)}
              />
            )}
          </motion.div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 pb-16 md:pb-0">
          {activeChat ? (
            <div className="bg-white dark:bg-gray-800 flex-1 min-h-0">
              <ChatArea
                activeChat={activeChat}
                selectedUser={selectedUser}
                onBackToSidebar={handleBackToSidebar}
                isMobile={isMobile}
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900"
            >
              <div className="text-center max-w-md mx-auto px-6">
                <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to SecureChat
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Select a conversation to start chatting
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => handleChatSelect('global')}
                    className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-lg"
                  >
                    Join Global Chat
                  </button>
                  <button 
                    onClick={() => toast.success('Search for users to start a private chat!')}
                    className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-lg border border-gray-200 dark:border-gray-600"
                  >
                    Start Private Chat
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>


    </div>
  );
};

export default ChatsPage;
