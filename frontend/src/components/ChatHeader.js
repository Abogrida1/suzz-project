import React from 'react';
import { FaArrowLeft, FaCircle, FaEllipsisV } from 'react-icons/fa';

const ChatHeader = ({ title, subtitle, user, onBack, isMobile }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FaArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          {user && (
            <div className="relative">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.displayName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              {user.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              )}
            </div>
          )}
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {user && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <FaCircle className={`h-2 w-2 ${user.isOnline ? 'text-green-500' : 'text-gray-400'}`} />
              <span>{user.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          )}
          
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <FaEllipsisV className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
