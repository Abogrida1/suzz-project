import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FaCheck, FaCheckDouble, FaReply, FaEdit, FaTrash } from 'react-icons/fa';

const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar, 
  showTimestamp, 
  isGrouped,
  onDelete,
  onReply,
  onEdit
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
    setShowActions(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message);
    }
    setShowActions(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message);
    }
    setShowActions(false);
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <FaCheck className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <FaCheckDouble className="h-3 w-3 text-gray-400" />;
      case 'seen':
        return <FaCheckDouble className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const handleMessageClick = () => {
    setShowActions(!showActions);
  };

  const handleReply = () => {
    // TODO: Implement reply functionality
    console.log('Reply to message:', message._id);
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit message:', message._id);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete message:', message._id);
  };

  const renderMessageContent = () => {
    if (message.type === 'image' && message.attachment) {
      return (
        <div className="space-y-2">
          <img
            src={message.attachment.url}
            alt="Shared image"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.attachment.url, '_blank')}
          />
          {message.content && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    if (message.type === 'file' && message.attachment) {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {message.attachment.filename}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(message.attachment.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <a
              href={message.attachment.url}
              download={message.attachment.filename}
              className="text-primary-500 hover:text-primary-600 text-sm font-medium"
            >
              Download
            </a>
          </div>
          {message.content && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {message.content}
      </p>
    );
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-xs">
              {message.sender.displayName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div
            className={`relative px-4 py-2 rounded-2xl cursor-pointer transition-all duration-200 ${
              isOwn
                ? 'bg-primary-500 text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
            } ${isGrouped ? (isOwn ? 'rounded-tr-md' : 'rounded-tl-md') : ''}`}
            onClick={handleMessageClick}
          >
            {/* Reply indicator */}
            {message.replyTo && (
              <div className={`mb-2 p-2 rounded-lg border-l-4 ${
                isOwn 
                  ? 'bg-primary-400 border-primary-300' 
                  : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500'
              }`}>
                <p className="text-xs font-medium opacity-75">
                  Replying to {message.replyTo.sender.displayName}
                </p>
                <p className="text-xs opacity-75 truncate">
                  {message.replyTo.content}
                </p>
              </div>
            )}

            {/* Message content */}
            {renderMessageContent()}

            {/* Edited indicator */}
            {message.edited && (
              <span className="text-xs opacity-75 ml-1">(edited)</span>
            )}

            {/* Timestamp and status */}
            <div className={`flex items-center justify-end space-x-1 mt-1 ${
              isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {showTimestamp && (
                <span className="text-xs">
                  {formatTime(message.createdAt)}
                </span>
              )}
              {isOwn && getStatusIcon()}
            </div>
          </div>

          {/* Message actions */}
          {showActions && (
            <div className={`absolute top-0 z-10 flex items-center space-x-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${
              isOwn ? 'right-full mr-2' : 'left-full ml-2'
            }`}>
              <button
                onClick={handleReply}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Reply"
              >
                <FaReply className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              
              {isOwn && (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Edit"
                  >
                    <FaEdit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Delete"
                  >
                    <FaTrash className="h-4 w-4 text-red-500" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Spacer for own messages */}
        {showAvatar && isOwn && <div className="w-8"></div>}
      </div>
    </div>
  );
};

export default MessageBubble;
