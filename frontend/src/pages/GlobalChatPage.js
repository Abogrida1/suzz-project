import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  FaArrowLeft, 
  FaPaperPlane,
  FaSmile,
  FaImage,
  FaPaperclip,
  FaCircle,
  FaGlobe,
  FaUsers,
  FaHeart,
  FaThumbsUp,
  FaLaugh,
  FaAngry,
  FaReply,
  FaTrash,
  FaEllipsisV
} from 'react-icons/fa';
import Picker from 'emoji-picker-react';
import './MobileChatPage.css';

const GlobalChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showReactions, setShowReactions] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch global messages
  useEffect(() => {
    const fetchGlobalMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/messages/global', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const messagesData = await response.json();
          const formattedMessages = messagesData.map(msg => ({
            id: msg._id,
            sender: {
              id: msg.sender._id,
              name: msg.sender.displayName || msg.sender.username,
              avatar: msg.sender.avatar || `https://ui-avatars.com/api/?name=${msg.sender.username}&background=3b82f6&color=fff`
            },
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            type: msg.type || 'text',
            status: msg.status || 'delivered',
            isOwn: msg.sender._id === user._id,
            reactions: msg.reactions || {},
            replyTo: msg.replyTo || null
          }));
          
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error fetching global messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGlobalMessages();
    }
  }, [user]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (message) => {
      if (message.type === 'global') {
        setMessages(prev => [...prev, {
          id: message._id,
          sender: {
            id: message.sender._id,
            name: message.sender.displayName || message.sender.username,
            avatar: message.sender.avatar || `https://ui-avatars.com/api/?name=${message.sender.username}&background=3b82f6&color=fff`
          },
          content: message.content,
          timestamp: new Date(message.createdAt),
          type: message.type || 'text',
          status: message.status || 'delivered',
          isOwn: message.sender._id === user._id,
          reactions: message.reactions || {},
          replyTo: message.replyTo || null
        }]);
      }
    };

    const handleMessageSent = (data) => {
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === data.tempId) {
            return { ...msg, id: data._id, status: 'sent' };
          }
          return msg;
        });
      });
    };

    const handleTyping = (data) => {
      if (data.type === 'global' && data.userId !== user._id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          return [...filtered, { userId: data.userId, name: data.userName }];
        });
        
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }, 3000);
      }
    };

    const handleReaction = (data) => {
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              reactions: { ...msg.reactions, [data.emoji]: (msg.reactions[data.emoji] || 0) + 1 }
            };
          }
          return msg;
        });
      });
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('message_sent', handleMessageSent);
    socket.on('user_typing', handleTyping);
    socket.on('message_reaction', handleReaction);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('message_sent', handleMessageSent);
      socket.off('user_typing', handleTyping);
      socket.off('message_reaction', handleReaction);
    };
  }, [socket, user]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      content: newMessage.trim(),
      type: 'text',
      chatType: 'global',
      replyTo: replyingTo?.id || null,
      tempId: Date.now().toString()
    };

    const tempMessage = {
      id: messageData.tempId,
      sender: {
        id: user._id,
        name: user.displayName || user.username,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=3b82f6&color=fff`
      },
      content: messageData.content,
      timestamp: new Date(),
      type: messageData.type,
      status: 'sending',
      isOwn: true,
      reactions: {},
      replyTo: replyingTo
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setShowEmojiPicker(false);
    setReplyingTo(null);

    socket.emit('send_message', messageData);
  };

  // Add reaction
  const addReaction = (messageId, emoji) => {
    if (socket) {
      socket.emit('add_reaction', { messageId, emoji });
    }
    setShowReactions(null);
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
    setShowMessageMenu(null);
  };

  // Handle emoji selection
  const onEmojiClick = (event, emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', {
        type: 'global',
        userId: user._id,
        userName: user.displayName || user.username
      });
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'اليوم';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    }
    
    return messageDate.toLocaleDateString('ar-EG');
  };

  const emojiReactions = [
    { emoji: '❤️', icon: FaHeart, color: 'text-red-500' },
    { emoji: '👍', icon: FaThumbsUp, color: 'text-blue-500' },
    { emoji: '😂', icon: FaLaugh, color: 'text-yellow-500' },
    { emoji: '😢', icon: FaSmile, color: 'text-blue-400' },
    { emoji: '😡', icon: FaAngry, color: 'text-red-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-500 dark:text-gray-400">جاري تحميل الشات العالمي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-chat-container bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Fixed Header */}
      <div className="mobile-chat-header bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => navigate('/mobile-chats')}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200"
              >
                <FaArrowLeft size={20} />
              </button>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <FaGlobe className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    الشات العالمي
                  </h1>
                  <p className="text-sm text-white/80">
                    محادثة مع جميع المستخدمين
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="flex items-center space-x-1 rtl:space-x-reverse bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                <FaUsers className="text-white" size={14} />
                <span className="text-white text-sm font-medium">عالمي</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div className="mobile-chat-messages p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGlobe className="text-indigo-500 dark:text-indigo-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              مرحباً بك في الشات العالمي
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              ابدأ المحادثة مع جميع المستخدمين!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showDate = index === 0 || 
              formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
            
            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center py-4">
                    <span className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 text-xs px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${message.isOwn ? 'order-2' : 'order-1'}`}>
                    {!message.isOwn && (
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                        <img
                          src={message.sender.avatar}
                          alt={message.sender.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {message.sender.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Reply Preview */}
                    {message.replyTo && (
                      <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-r-4 border-blue-500">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          رد على {message.replyTo.senderName}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {message.replyTo.content}
                        </p>
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm relative group ${
                        message.isOwn
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700 shadow-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      
                      {/* Message Actions */}
                      <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <button
                            onClick={() => setShowReactions(message.id)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                          >
                            <FaSmile className="text-gray-400" size={12} />
                          </button>
                          <button
                            onClick={() => setReplyingTo({
                              id: message.id,
                              content: message.content,
                              senderName: message.sender.name
                            })}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                          >
                            <FaReply className="text-gray-400" size={12} />
                          </button>
                          {message.isOwn && (
                            <button
                              onClick={() => setShowMessageMenu(message.id)}
                              className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                            >
                              <FaEllipsisV className="text-gray-400" size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Reactions */}
                      {Object.keys(message.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(message.reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(message.id, emoji)}
                              className="flex items-center space-x-1 rtl:space-x-reverse bg-white/20 dark:bg-gray-700/50 rounded-full px-2 py-1 text-xs hover:bg-white/30 dark:hover:bg-gray-600/50 transition-colors duration-200"
                            >
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className={`flex items-center justify-end mt-2 space-x-1 rtl:space-x-reverse ${
                        message.isOwn ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        <span className="text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.isOwn && (
                          <span className="text-xs">
                            {message.status === 'sending' ? '⏳' : 
                             message.status === 'sent' ? '✓' : 
                             message.status === 'delivered' ? '✓✓' : '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-700 px-4 py-2 rounded-2xl rounded-bl-md border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="flex space-x-1 rtl:space-x-reverse">
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {typingUsers.map(u => u.name).join(', ')} يكتب...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area */}
      <div className="mobile-chat-input bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 p-4">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                  رد على {replyingTo.senderName}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {replyingTo.content}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-end space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200 flex-shrink-0"
          >
            <FaSmile size={18} />
          </button>
          
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all duration-200 flex-shrink-0">
            <FaImage size={18} />
          </button>
          
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-all duration-200 flex-shrink-0">
            <FaPaperclip size={18} />
          </button>
          
          <div className="flex-1 relative min-w-0">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="اكتب رسالة في الشات العالمي..."
              className="w-full px-4 py-3 text-sm border-0 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 resize-none shadow-sm transition-all duration-200"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 transform hover:scale-105 ${
              newMessage.trim() 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <FaPaperPlane size={16} />
          </button>
        </div>
        
        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <Picker
                onEmojiClick={onEmojiClick}
                pickerStyle={{ width: '100%' }}
                disableSearchBar
                disableSkinTonePicker
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reaction Picker */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
            onClick={() => setShowReactions(null)}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                {emojiReactions.map(({ emoji, icon: Icon, color }) => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(showReactions, emoji)}
                    className={`p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${color}`}
                  >
                    <Icon size={24} />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Menu */}
      <AnimatePresence>
        {showMessageMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
            onClick={() => setShowMessageMenu(null)}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl">
              <button
                onClick={() => deleteMessage(showMessageMenu)}
                className="flex items-center space-x-3 rtl:space-x-reverse text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-3 rounded-xl transition-colors duration-200"
              >
                <FaTrash size={16} />
                <span>حذف الرسالة</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalChatPage;
