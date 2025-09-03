import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaImage, FaSmile, FaPaperclip, FaTimes, FaReply } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import { useDropzone } from 'react-dropzone';
import api from '../config/axios';
import toast from 'react-hot-toast';

const MessageInput = ({ onSendMessage, onTypingStart, onTypingStop, placeholder, replyTo, onCancelReply }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle typing indicators
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      onTypingStart();
    } else if (!message.trim() && isTyping) {
      setIsTyping(false);
      onTypingStop();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    if (message.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingStop();
      }, 1000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTypingStart, onTypingStop]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage({
        content: message.trim(),
        replyTo: replyTo?._id
      });
      setMessage('');
      setShowEmojiPicker(false);
      if (onCancelReply) {
        onCancelReply();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // File upload handling
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { file: uploadedFile } = response.data;
      
      // Determine message type based on file type
      const isImage = file.type.startsWith('image/');
      const messageType = isImage ? 'image' : 'file';
      
      onSendMessage('', messageType, uploadedFile);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  return (
    <div className="relative">
      {/* Reply preview */}
      {replyTo && (
        <div className="bg-gray-50 dark:bg-gray-700 border-l-4 border-blue-500 pl-3 py-2 mb-2 rounded-r-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaReply className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Replying to {replyTo.sender?.displayName || replyTo.sender?.username || replyTo.senderName || 'Unknown'}
              </span>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Cancel reply"
            >
              <FaTimes className="h-3 w-3 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-1">
            {replyTo.content}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-2 w-full">
        {/* File upload area */}
        <div {...getRootProps()} className="flex-shrink-0">
          <input {...getInputProps()} />
          <button
            type="button"
            disabled={uploading}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Attach file"
          >
            {uploading ? (
              <div className="spinner w-5 h-5"></div>
            ) : (
              <FaPaperclip className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Message input */}
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none max-h-32"
            rows={1}
            style={{ minHeight: '48px' }}
          />
          
          {/* Emoji picker button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Add emoji"
          >
            <FaSmile className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-3 rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send message"
        >
          <FaPaperPlane className="h-5 w-5" />
        </button>
      </form>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="auto"
              width={300}
              height={350}
            />
          </div>
        </div>
      )}

      {/* Drag and drop overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-primary-500 bg-opacity-10 border-2 border-dashed border-primary-500 rounded-2xl flex items-center justify-center z-20">
          <div className="text-center">
            <FaPaperclip className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-primary-500 font-medium">Drop file here</p>
          </div>
        </div>
      )}

      {/* Click outside to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default MessageInput;
