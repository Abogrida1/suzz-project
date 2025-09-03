import React, { useState } from 'react';
import { FaSmile, FaHeart, FaThumbsUp, FaLaugh, FaAngry, FaSad } from 'react-icons/fa';
import { useSocket } from '../contexts/SocketContext';

const MessageReactions = ({ message, currentUserId }) => {
  const [showPicker, setShowPicker] = useState(false);
  const { addReaction, removeReaction } = useSocket();

  const handleReaction = (emoji) => {
    const existingReaction = message.reactions?.find(r => r.user === currentUserId);
    if (existingReaction) {
      removeReaction(message._id);
    } else {
      addReaction(message._id, emoji);
    }
    setShowPicker(false);
  };

  const getReactionIcon = (emoji) => {
    switch (emoji) {
      case '😊': return <FaSmile className="h-4 w-4" />;
      case '❤️': return <FaHeart className="h-4 w-4 text-red-500" />;
      case '👍': return <FaThumbsUp className="h-4 w-4" />;
      case '😂': return <FaLaugh className="h-4 w-4" />;
      case '😠': return <FaAngry className="h-4 w-4" />;
      case '😢': return <FaSad className="h-4 w-4" />;
      default: return <span>{emoji}</span>;
    }
  };

  const getReactionCount = (emoji) => {
    return message.reactions?.filter(r => r.emoji === emoji).length || 0;
  };

  const getUniqueReactions = () => {
    if (!message.reactions) return [];
    const uniqueEmojis = [...new Set(message.reactions.map(r => r.emoji))];
    return uniqueEmojis.map(emoji => ({
      emoji,
      count: getReactionCount(emoji),
      users: message.reactions.filter(r => r.emoji === emoji)
    }));
  };

  if (!message.reactions || message.reactions.length === 0) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Add reaction"
        >
          <FaSmile className="h-4 w-4 text-gray-400" />
        </button>
        
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-20 flex items-center space-x-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {['😊', '❤️', '👍', '😂', '😠', '😢'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      {getUniqueReactions().map((reaction, index) => (
        <button
          key={index}
          onClick={() => handleReaction(reaction.emoji)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
            reaction.users.some(u => u.user === currentUserId)
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title={`${reaction.count} reaction${reaction.count > 1 ? 's' : ''}`}
        >
          {getReactionIcon(reaction.emoji)}
          <span>{reaction.count}</span>
        </button>
      ))}
      
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Add reaction"
      >
        <FaSmile className="h-4 w-4 text-gray-400" />
      </button>
      
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-20 flex items-center space-x-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {['😊', '❤️', '👍', '😂', '😠', '😢'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;
