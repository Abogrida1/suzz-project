import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  FaArrowLeft, 
  FaPhone, 
  FaEllipsisV,
  FaPaperPlane,
  FaSmile,
  FaImage,
  FaPaperclip,
  FaCircle,
  FaComments,
  FaHeart,
  FaThumbsUp,
  FaLaugh,
  FaAngry,
  FaReply,
  FaTrash
} from 'react-icons/fa';
import Picker from 'emoji-picker-react';
import './MobileChatPage.css';

const MobileChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [chatInfo, setChatInfo] = useState(null);
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

  // Fetch chat info and messages
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        console.log('Fetching chat data for chatId:', chatId);
        
        // First, try to get user info from conversations list
        let foundUser = false;
        try {
          const conversationsResponse = await fetch('/api/conversations/private', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (conversationsResponse.ok) {
            const conversationsData = await conversationsResponse.json();
            console.log('Conversations data:', conversationsData);
            console.log('Looking for chatId:', chatId);
            
            const conversation = conversationsData.find(conv => conv.otherUser._id === chatId);
            console.log('Found conversation:', conversation);
            console.log('All conversations:', conversationsData.map(conv => ({
              id: conv.otherUser._id,
              name: conv.otherUser.displayName || conv.otherUser.username,
              lookingFor: chatId
            })));
            
            if (conversation) {
              setChatInfo({
                id: chatId,
                type: 'private',
                name: conversation.otherUser.displayName || conversation.otherUser.username || 'Unknown User',
                avatar: conversation.otherUser.avatar || `https://ui-avatars.com/api/?name=${conversation.otherUser.username || 'U'}&background=3b82f6&color=fff`,
                status: 'متاح',
                isOnline: false
              });
              foundUser = true;
            }
          }
        } catch (conversationError) {
          console.error('Error fetching conversations:', conversationError);
        }
        
        // Then fetch messages
        try {
          const messagesResponse = await fetch(`/api/messages/private/${chatId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            console.log('Messages response:', messagesData);
            
            // Handle both array and object with messages property
            const messagesArray = messagesData.messages || messagesData;
            
            const formattedMessages = messagesArray.map(msg => ({
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
              isOwn: msg.sender._id === user._id
            }));
            
            setMessages(formattedMessages);
            
            // If we don't have chat info yet, try to get it from messages
            if (!foundUser && messagesArray.length > 0) {
              const firstMessage = messagesArray[0];
              const otherUser = firstMessage.sender._id === user._id ? 
                { username: 'Unknown', displayName: 'Unknown' } : firstMessage.sender;
              
              setChatInfo({
                id: chatId,
                type: 'private',
                name: otherUser.displayName || otherUser.username || 'Unknown',
                avatar: otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username || 'U'}&background=3b82f6&color=fff`,
                status: 'متاح',
                isOnline: false
              });
              foundUser = true;
            }
          }
        } catch (messageError) {
          console.error('Error fetching messages:', messageError);
        }
        
        // If we still don't have chat info, set a fallback
        if (!foundUser) {
          setChatInfo({
            id: chatId,
            type: 'private',
            name: 'المستخدم',
            avatar: `https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff`,
            status: 'متاح',
            isOnline: false
          });
        }
        
      } catch (error) {
        console.error('Error fetching chat data:', error);
        // Set basic chat info even if there's an error
        setChatInfo({
          id: chatId,
          type: 'private',
          name: 'المستخدم',
          avatar: `https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff`,
          status: 'متاح',
          isOnline: false
        });
      } finally {
        setLoading(false);
      }
    };

    if (chatId && user) {
      fetchChatData();
    }
  }, [chatId, user]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (message) => {
      if (message.conversationId === chatId) {
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
          isOwn: message.sender._id === user._id
        }]);
      }
    };

    const handleMessageSent = (data) => {
      console.log('Message sent confirmation:', data);
      console.log('Looking for tempId:', data.tempId);
      console.log('Current messages:', messages.map(m => ({ id: m.id, status: m.status })));
      
      // Update the temporary message with the real ID and status
      setMessages(prev => {
        const updated = prev.map(msg => {
          if (msg.id === data.tempId) {
            console.log('Found matching message, updating:', msg.id, 'to', data._id);
            return { ...msg, id: data._id, status: 'sent' };
          }
          return msg;
        });
        console.log('Updated messages:', updated.map(m => ({ id: m.id, status: m.status })));
        return updated;
      });
    };

    const handleTyping = (data) => {
      if (data.conversationId === chatId && data.userId !== user._id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          return [...filtered, { userId: data.userId, name: data.userName }];
        });
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }, 3000);
      }
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('message_sent', handleMessageSent);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('message_sent', handleMessageSent);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, chatId, user]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      content: newMessage.trim(),
      type: 'text',
      chatType: 'private', // Add chat type
      recipients: [chatId], // Use chatId as recipient for private chat
      privateChatWith: chatId,
      tempId: Date.now().toString()
    };

    // Add message optimistically
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
      isOwn: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setShowEmojiPicker(false);

    // Send via socket
    console.log('Sending message via socket:', messageData);
    console.log('Message tempId:', messageData.tempId);
    socket.emit('send_message', messageData);
  };

  // Handle emoji selection
  const onEmojiClick = (event, emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socket && chatId) {
      socket.emit('typing', {
        conversationId: chatId,
        userId: user._id,
        userName: user.displayName || user.username
      });
    }
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mobile-chat-container bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Fixed Header */}
      <div className="mobile-chat-header bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Back button and user info */}
            <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse flex-1 min-w-0">
              <button
                onClick={() => navigate('/mobile-chats')}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200 flex-shrink-0"
              >
                <FaArrowLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              
              <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20">
                    <img
                      src={chatInfo?.avatar || `https://ui-avatars.com/api/?name=${chatInfo?.name}&background=3b82f6&color=fff`}
                      alt={chatInfo?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {chatInfo?.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-white truncate">
                    {chatInfo?.name || 'المحادثة'}
                  </h1>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-xs sm:text-sm text-white/80 truncate">
                      {chatInfo?.status || 'متاح'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 rtl:space-x-reverse flex-shrink-0">
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200">
                <FaPhone size={16} className="sm:w-4 sm:h-4" />
              </button>
              <button className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200">
                <FaEllipsisV size={16} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Messages Area */}
      <div className="mobile-chat-messages p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaComments className="text-blue-500 dark:text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد رسائل بعد
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              ابدأ المحادثة مع {chatInfo?.name}!
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
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {message.sender.name}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm relative group ${
                        message.isOwn
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md'
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
                      {message.reactions && Object.keys(message.reactions).length > 0 && (
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
        
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator - Fixed above input */}
      {typingUsers.length > 0 && (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-2">
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
        </div>
      )}

      {/* Fixed Input Area */}
      <div className="mobile-chat-input bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4">
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
        
        <div className="flex items-end space-x-2 sm:space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200 flex-shrink-0"
          >
            <FaSmile size={18} className="sm:w-5 sm:h-5" />
          </button>
          
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all duration-200 flex-shrink-0">
            <FaImage size={18} className="sm:w-5 sm:h-5" />
          </button>
          
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-all duration-200 flex-shrink-0">
            <FaPaperclip size={18} className="sm:w-5 sm:h-5" />
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
              placeholder="اكتب رسالة..."
              className="w-full px-4 py-3 text-sm sm:text-base border-0 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 resize-none shadow-sm transition-all duration-200"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-all duration-200 flex-shrink-0 transform hover:scale-105 ${
              newMessage.trim() 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <FaPaperPlane size={16} className="sm:w-4 sm:h-4" />
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

export default MobileChatPage;
