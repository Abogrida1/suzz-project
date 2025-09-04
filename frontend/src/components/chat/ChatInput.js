import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPaperclip, 
  FaSmile, 
  FaMicrophone, 
  FaImage,
  FaFile,
  FaCamera,
  FaArrowUp,
  FaTimes
} from 'react-icons/fa';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

const ChatInput = ({ selectedChat, onMessageSent, placeholder = "Type a message..." }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { sendMessage, startTyping, stopTyping } = useSocket();
  const { user } = useAuth();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Handle typing detection
  useEffect(() => {
    if (message.trim() && !isTyping && selectedChat) {
      setIsTyping(true);
      startTyping(selectedChat.id);
    } else if (!message.trim() && isTyping && selectedChat) {
      setIsTyping(false);
      stopTyping(selectedChat.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    if (message.trim() && selectedChat) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(selectedChat.id);
      }, 1000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, selectedChat, startTyping, stopTyping]);

  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      const messageData = {
        content: message.trim(),
        type: 'text',
        chatType: selectedChat.type,
        recipients: selectedChat.type === 'private' ? [selectedChat.userId] : 
                   selectedChat.type === 'group' ? [selectedChat.groupId] : []
      };

      console.log('Sending message:', messageData);
      sendMessage(messageData);
      setMessage('');
      setIsTyping(false);
      stopTyping(selectedChat.id);
      
      if (onMessageSent) {
        onMessageSent(messageData);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachment = (type) => {
    setShowAttachmentMenu(false);
    // Implement attachment functionality based on type
    console.log(`Attaching ${type}`);
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Implement voice recording functionality
  };

  // Common emojis
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '🎉', '👏', '🙏', '💯'];

  if (!selectedChat) {
    return (
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Select a chat to start messaging
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-end space-x-3">
        {/* Attachment button */}
        <div className="relative">
          <button
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaPaperclip className="w-5 h-5" />
          </button>

          {/* Attachment menu */}
          <AnimatePresence>
            {showAttachmentMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50"
              >
                <button
                  onClick={() => handleAttachment('image')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3"
                >
                  <FaImage className="w-4 h-4 text-green-500" />
                  <span>Photo & Video</span>
                </button>
                <button
                  onClick={() => handleAttachment('camera')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3"
                >
                  <FaCamera className="w-4 h-4 text-blue-500" />
                  <span>Camera</span>
                </button>
                <button
                  onClick={() => handleAttachment('file')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center space-x-3"
                >
                  <FaFile className="w-4 h-4 text-orange-500" />
                  <span>Document</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${selectedChat.name || selectedChat.username}...`}
            className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
            rows={1}
          />
          
          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <FaSmile className="w-5 h-5" />
          </button>
        </div>

        {/* Emoji picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-3 z-50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Emojis</span>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send/Voice button */}
        {message.trim() ? (
          <button
            onClick={handleSendMessage}
            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-lg"
          >
            <FaArrowUp className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleVoiceRecord}
            className={`p-3 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FaMicrophone className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-red-500 rounded-full"
                />
              </div>
              <span className="text-sm text-red-700 dark:text-red-300">Recording...</span>
              <button
                onClick={handleVoiceRecord}
                className="ml-auto px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-full transition-colors"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInput;
