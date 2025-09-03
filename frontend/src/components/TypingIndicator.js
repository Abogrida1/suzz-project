import React from 'react';

const TypingIndicator = ({ users, isMobile = false }) => {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].displayName} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].displayName} and ${users[1].displayName} are typing...`;
    } else {
      return `${users.length} people are typing...`;
    }
  };

  if (isMobile) {
    return (
      <div className="flex items-center justify-start">
        <div className="typing-container mobile-typing-indicator flex items-center space-x-2 rounded-full px-3 py-1.5 max-w-xs">
          {/* Enhanced typing animation */}
          <div className="flex space-x-1">
            <div className="typing-dot w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <div className="typing-dot w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <div className="typing-dot w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          </div>
          
          {/* Typing text with better styling */}
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate">
            {getTypingText()}
          </span>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 py-2 max-w-xs mx-4">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
        {getTypingText()}
      </span>
    </div>
  );
};

export default TypingIndicator;
