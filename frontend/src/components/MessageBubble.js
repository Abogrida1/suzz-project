import React, { useState, useEffect, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FaCheck, FaCheckDouble, FaReply, FaEdit, FaTrash, FaSmile, FaHeart, FaThumbsUp, FaLaugh, FaAngry, FaFrown } from 'react-icons/fa';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar, 
  showTimestamp, 
  isGrouped,
  onDelete,
  onReply,
  onEdit,
  showSenderName = false
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || []);
  const { addReaction, removeReaction, confirmMessageDelivery, confirmMessageRead } = useSocket();
  const { user } = useAuth();

  // Update reactions when message changes
  useEffect(() => {
    setReactions(message.reactions || []);
  }, [message.reactions]);

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

  // Handle message delivery and read status
  useEffect(() => {
    if (message._id && !isOwn) {
      // Confirm delivery when message is rendered
      confirmMessageDelivery(message._id);
      
      // Confirm read when message is visible for 2 seconds
      const timer = setTimeout(() => {
        confirmMessageRead(message._id);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [message._id, isOwn, confirmMessageDelivery, confirmMessageRead]);

  // Handle reaction updates
  useEffect(() => {
    const handleReactionAdded = (event) => {
      const { messageId, userId, emoji, userName } = event.detail;
      if (messageId === message._id) {
        setReactions(prev => {
          const existing = prev.find(r => r.user.toString() === userId.toString());
          if (existing) {
            // Update existing reaction
            return prev.map(r => 
              r.user.toString() === userId.toString() ? { ...r, emoji, userName } : r
            );
          } else {
            // Add new reaction
            return [...prev, { user: userId, emoji, userName }];
          }
        });
      }
    };

    const handleReactionRemoved = (event) => {
      const { messageId, userId, emoji } = event.detail;
      if (messageId === message._id) {
        setReactions(prev => {
          if (emoji) {
            return prev.filter(r => !(r.user.toString() === userId.toString() && r.emoji === emoji));
          } else {
            return prev.filter(r => r.user.toString() !== userId.toString());
          }
        });
      }
    };

    const handleReactionUpdated = (event) => {
      const { messageId, userId, emoji, userName } = event.detail;
      if (messageId === message._id) {
        setReactions(prev => {
          return prev.map(r => 
            r.user.toString() === userId.toString() ? { ...r, emoji, userName } : r
          );
        });
      }
    };

    window.addEventListener('reaction_added', handleReactionAdded);
    window.addEventListener('reaction_removed', handleReactionRemoved);
    window.addEventListener('reaction_updated', handleReactionUpdated);

    return () => {
      window.removeEventListener('reaction_added', handleReactionAdded);
      window.removeEventListener('reaction_removed', handleReactionRemoved);
      window.removeEventListener('reaction_updated', handleReactionUpdated);
    };
  }, [message._id]);

  const getStatusIcon = () => {
    if (!isOwn) return null;
    
    // Handle optimistic messages - show loading for max 1 second
    if (message.isOptimistic || message._id.startsWith('temp_')) {
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      if (messageAge > 1000) {
        // After 1 second, assume sent
        return <FaCheck className="h-3 w-3 text-gray-400" />;
      }
      return <div className="h-3 w-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />;
    }
    
    // If message is older than 1 second and still sending, assume it's sent
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const isOldMessage = messageAge > 1000;
    
    switch (message.status) {
      case 'sending':
        if (isOldMessage) {
          console.log('Old message still showing as sending, assuming sent:', message._id);
          return <FaCheck className="h-3 w-3 text-gray-400" />;
        }
        return <div className="h-3 w-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />;
      case 'sent':
        return <FaCheck className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <FaCheckDouble className="h-3 w-3 text-gray-400" />;
      case 'seen':
        return <FaCheckDouble className="h-3 w-3 text-blue-500" />;
      default:
        return <FaCheck className="h-3 w-3 text-gray-400" />; // Default to sent
    }
  };

  const handleReaction = (emoji) => {
    // Check if current user already reacted with any emoji
    const existingReaction = reactions.find(r => r.user.toString() === user._id.toString());
    
    // Update UI immediately for better responsiveness
    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Remove reaction - update UI immediately
        setReactions(prev => prev.filter(r => r.user.toString() !== user._id.toString()));
        removeReaction(message._id, emoji);
      } else {
        // Replace reaction - update UI immediately
        setReactions(prev => prev.map(r => 
          r.user.toString() === user._id.toString() 
            ? { ...r, emoji, userName: user.displayName || user.username }
            : r
        ));
        removeReaction(message._id, existingReaction.emoji);
        addReaction(message._id, emoji);
      }
    } else {
      // Add new reaction - update UI immediately
      setReactions(prev => [...prev, { 
        user: user._id, 
        emoji, 
        userName: user.displayName || user.username 
      }]);
      addReaction(message._id, emoji);
    }
    setShowReactions(false);
  };

  const getReactionIcon = (emoji) => {
    // Always return the actual emoji instead of icons
    return <span className="text-lg">{emoji}</span>;
  };

  // Check if message has been read by recipient
  const isMessageRead = () => {
    if (!isOwn || !message.readBy || message.readBy.length === 0) return false;
    return message.readBy.some(read => read.user && read.user !== message.sender._id);
  };

  const formatTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const handleMessageClick = () => {
    setShowActions(!showActions);
  };

  const renderMessageContent = () => {
    // Render reply to message


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
      <div className={`flex max-w-xs lg:max-w-md message-bubble-mobile ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
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
                  Replying to {message.replyTo.sender?.displayName || message.replyTo.sender?.username || message.replyTo.senderName || 'Unknown'}
                </p>
                <p className="text-xs opacity-75 truncate">
                  {message.replyTo.content}
                </p>
              </div>
            )}

            {/* Sender name */}
            {showSenderName && !isOwn && (
              <div className="mb-1">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {message.sender.displayName || message.sender.username}
                </span>
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
              {isOwn && (
                <div className="flex items-center space-x-1">
                  {getStatusIcon()}
                  {isMessageRead() && (
                    <FaCheckDouble className="h-3 w-3 text-blue-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="emoji-reactions-container message-reactions-mobile">
              {reactions.map((reaction, index) => (
                <div
                  key={index}
                  className={`emoji-reaction-item group relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                    reaction.user.toString() === user._id.toString()
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' 
                      : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                  onClick={() => handleReaction(reaction.emoji)}
                >
                  <span className="text-sm">{getReactionIcon(reaction.emoji)}</span>
                  <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
                    {reaction.user.toString() === user._id.toString() ? 'You' : '1'}
                  </span>
                  
                  {/* Tooltip showing who reacted */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {reaction.user.toString() === user._id.toString() ? 'You reacted' : `${reaction.userName || 'Someone'} reacted`}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
              
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="React"
              >
                <FaSmile className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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

          {/* Reaction picker */}
          {showReactions && (
            <div className={`absolute top-0 z-20 flex items-center space-x-1 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 ${
              isOwn ? 'right-full mr-2' : 'left-full ml-2'
            }`}>
              {['😊', '❤️', '👍', '😂', '😠', '😢'].map((emoji) => {
                const hasReacted = reactions.find(r => r.user.toString() === user._id.toString() && r.emoji === emoji);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`emoji-reaction-button rounded-full transition-all duration-200 text-lg md:text-2xl hover:scale-125 active:scale-95 ${
                      hasReacted 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={hasReacted ? 'Remove reaction' : 'Add reaction'}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Spacer for own messages */}
        {showAvatar && isOwn && <div className="w-8"></div>}
      </div>
    </div>
  );
};

export default memo(MessageBubble);
