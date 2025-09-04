import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import './chat.css';

const ChatLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const { connected, connectionError } = useSocket();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleBackToSidebar = () => {
    if (isMobile) {
      setSidebarOpen(true);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-gray-50 dark:bg-gray-900 flex ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Connection Status */}
      {!connected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white text-center py-2 text-sm">
          {connectionError ? (
            <span>Connection error: {connectionError.message || 'Unable to connect to server'}</span>
          ) : (
            <span>Connecting to server...</span>
          )}
        </div>
      )}
      
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: isMobile ? -320 : 0 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? -320 : 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`${
              isMobile 
                ? 'fixed inset-y-0 left-0 z-50 w-80' 
                : 'relative w-80 flex-shrink-0'
            } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg`}
          >
            <ChatSidebar
              onChatSelect={handleChatSelect}
              selectedChat={selectedChat}
              onClose={() => setSidebarOpen(false)}
              isMobile={isMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            onBackToSidebar={handleBackToSidebar}
            isMobile={isMobile}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to Chat
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
