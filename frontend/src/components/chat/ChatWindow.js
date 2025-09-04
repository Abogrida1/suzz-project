import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const ChatWindow = ({ chat, onBackToSidebar, isMobile }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { socket } = useSocket();

  // Mock messages data - replace with real API calls
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        // Mock messages data
        const mockMessages = [
          {
            id: '1',
            sender: {
              id: chat.userId,
              name: chat.name,
              avatar: chat.avatar
            },
            content: 'Hey, how are you doing?',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            type: 'text',
            status: 'read',
            isOwn: false
          },
          {
            id: '2',
            sender: {
              id: user._id,
              name: user.displayName || user.username,
              avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=3b82f6&color=fff`
            },
            content: 'I\'m doing great! Thanks for asking. How about you?',
            timestamp: new Date(Date.now() - 8 * 60 * 1000),
            type: 'text',
            status: 'read',
            isOwn: true
          },
          {
            id: '3',
            sender: {
              id: chat.userId,
              name: chat.name,
              avatar: chat.avatar
            },
            content: 'Pretty good! Just working on some new projects. Want to grab coffee sometime?',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            type: 'text',
            status: 'delivered',
            isOwn: false
          },
          {
            id: '4',
            sender: {
              id: user._id,
              name: user.displayName || user.username,
              avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=3b82f6&color=fff`
            },
            content: 'That sounds amazing! I\'d love to. When works best for you?',
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
            type: 'text',
            status: 'sent',
            isOwn: true
          }
        ];
        
        setMessages(mockMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (chat) {
      fetchMessages();
    }
  }, [chat, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleTypingStart = (data) => {
      if (data.userId !== user._id) {
        setTypingUsers(prev => [...prev.filter(u => u.id !== data.userId), data]);
      }
    };

    const handleTypingStop = (data) => {
      setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, user._id]);

  const handleSendMessage = (content, type = 'text') => {
    const newMessage = {
      id: Date.now().toString(),
      sender: {
        id: user._id,
        name: user.displayName || user.username,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=3b82f6&color=fff`
      },
      content,
      timestamp: new Date(),
      type,
      status: 'sending',
      isOwn: true
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);

    // Emit to socket
    if (socket) {
      socket.emit('send_message', {
        chatId: chat.id,
        content,
        type,
        chatType: chat.type
      });
    }

    // Simulate message status update
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    }, 1000);
  };

  const handleTyping = (isTyping) => {
    if (socket) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', {
        chatId: chat.id,
        userId: user._id
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <ChatHeader
        chat={chat}
        onBackToSidebar={onBackToSidebar}
        isMobile={isMobile}
        typingUsers={typingUsers}
      />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ChatMessageList
          messages={messages}
          currentUser={user}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Input */}
      <ChatInput
        selectedChat={chat}
        onMessageSent={handleSendMessage}
      />
    </div>
  );
};

export default ChatWindow;
