import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheck, 
  FaCheckDouble, 
  FaClock,
  FaReply,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaCopy
} from 'react-icons/fa';
import { format } from 'date-fns';

const ChatMessage = ({ message, isOwn, showAvatar, showTimestamp }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <FaClock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <FaCheck className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <FaCheckDouble className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <FaCheckDouble className="w-3 h-3 text-blue-500" />;
      default:
        return <FaClock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getMessageTime = () => {
    return format(new Date(message.timestamp), 'HH:mm');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
    // You could add a toast notification here
  };

  const handleReply = () => {
    setShowMenu(false);
    // Implement reply functionality
  };

  const handleEdit = () => {
    setShowMenu(false);
    // Implement edit functionality
  };

  const handleDelete = () => {
    setShowMenu(false);
    // Implement delete functionality
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`group relative ${isOwn ? 'ml-auto' : 'mr-auto'}`}
    >
      <div
        className={`relative inline-block max-w-full ${
          isOwn 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        } rounded-2xl px-4 py-2 shadow-sm`}
      >
        {/* Message content */}
        <div className="break-words">
          {message.type === 'text' ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : message.type === 'image' ? (
            <div className="max-w-xs">
              <img
                src={message.content}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
        </div>

        {/* Message footer */}
        <div className={`flex items-center justify-end space-x-1 mt-1 ${
          isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <span className="text-xs">
            {getMessageTime()}
          </span>
          {isOwn && (
            <span className="ml-1">
              {getStatusIcon()}
            </span>
          )}
        </div>

        {/* Avatar for other users */}
        {showAvatar && !isOwn && (
          <div className="absolute -left-8 bottom-0">
            <img
              src={message.sender.avatar}
              alt={message.sender.name}
              className="w-6 h-6 rounded-full object-cover border-2 border-white dark:border-gray-800"
            />
          </div>
        )}

        {/* Message menu */}
        <div className="absolute top-0 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 bg-white dark:bg-gray-600 rounded-full shadow-lg border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              <FaEllipsisV className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Menu dropdown */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50"
              >
                <button
                  onClick={handleReply}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <FaReply className="w-3 h-3" />
                  <span>Reply</span>
                </button>
                <button
                  onClick={handleCopyMessage}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <FaCopy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
                {isOwn && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                      <FaEdit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-600" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                      <FaTrash className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Timestamp for last message in group */}
      {showTimestamp && (
        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
          isOwn ? 'text-right' : 'text-left'
        }`}>
          {format(new Date(message.timestamp), 'MMM d, h:mm a')}
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
