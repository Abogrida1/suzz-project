import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { FaArrowLeft } from 'react-icons/fa';

const ChatArea = ({ activeChat, selectedUser, onBackToSidebar, isMobile }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const { user } = useAuth();
  const { 
    socket, 
    joinGlobalChat, 
    leaveGlobalChat, 
    joinPrivateChat, 
    leavePrivateChat,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers: socketTypingUsers
  } = useSocket();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle chat changes
  useEffect(() => {
    if (activeChat === 'global') {
      joinGlobalChat();
      loadGlobalMessages();
    } else if (activeChat === 'private' && selectedUser) {
      joinPrivateChat(selectedUser._id);
      loadPrivateMessages();
    }

    return () => {
      if (activeChat === 'global') {
        leaveGlobalChat();
      } else if (activeChat === 'private' && selectedUser) {
        leavePrivateChat(selectedUser._id);
      }
    };
  }, [activeChat, selectedUser]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleGlobalMessages = (messages) => {
      setMessages(messages);
    };

    const handlePrivateMessages = (data) => {
      if (data.otherUserId === selectedUser?._id) {
        setMessages(data.messages);
      }
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user._id) {
        setTypingUsers(prev => {
          const exists = prev.find(u => u.userId === data.userId);
          if (!exists) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('global_messages', handleGlobalMessages);
    socket.on('private_messages', handlePrivateMessages);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('global_messages', handleGlobalMessages);
      socket.off('private_messages', handlePrivateMessages);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, selectedUser, user]);

  // Load messages
  const loadGlobalMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages/global');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading global messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrivateMessages = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/messages/private/${selectedUser._id}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading private messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle sending messages
  const handleSendMessage = (content, type = 'text', attachment = null) => {
    if (!content && !attachment) return;

    const messageData = {
      content,
      type,
      chatType: activeChat,
      recipients: activeChat === 'private' ? [selectedUser._id] : [],
      attachment
    };

    sendMessage(messageData);
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    if (activeChat === 'global') {
      startTyping('global', []);
    } else if (activeChat === 'private' && selectedUser) {
      startTyping('private', [selectedUser._id]);
    }
  };

  const handleTypingStop = () => {
    if (activeChat === 'global') {
      stopTyping('global', []);
    } else if (activeChat === 'private' && selectedUser) {
      stopTyping('private', [selectedUser._id]);
    }
  };

  // Handle message actions
  const handleDeleteMessage = async (message) => {
    try {
      await api.delete(`/api/messages/${message._id}?userId=${user._id}`);
      // Remove message from local state
      setMessages(prev => prev.filter(m => m._id !== message._id));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Delete message error:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleEditMessage = async (message) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      try {
        await api.put(`/api/messages/${message._id}?userId=${user._id}`, {
          content: newContent
        });
        // Update message in local state
        setMessages(prev => prev.map(m => 
          m._id === message._id 
            ? { ...m, content: newContent, edited: true, editedAt: new Date().toISOString() }
            : m
        ));
        toast.success('Message updated');
      } catch (error) {
        console.error('Edit message error:', error);
        toast.error('Failed to edit message');
      }
    }
  };

  const handleReplyToMessage = (message) => {
    // Set reply message in input
    setReplyTo(message);
    // Focus on input
    const input = document.querySelector('.message-input textarea');
    if (input) {
      input.focus();
    }
  };

  // Get chat title
  const getChatTitle = () => {
    if (activeChat === 'global') {
      return 'Global Chat';
    } else if (activeChat === 'private' && selectedUser) {
      return selectedUser.displayName;
    }
    return 'Chat';
  };

  // Get chat subtitle
  const getChatSubtitle = () => {
    if (activeChat === 'global') {
      return 'Chat with everyone';
    } else if (activeChat === 'private' && selectedUser) {
      return `@${selectedUser.username}`;
    }
    return '';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <ChatHeader
        title={getChatTitle()}
        subtitle={getChatSubtitle()}
        user={selectedUser}
        onBack={isMobile ? onBackToSidebar : null}
        isMobile={isMobile}
      />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          loading={loading}
          typingUsers={typingUsers}
          currentUser={user}
          messagesEndRef={messagesEndRef}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onReplyToMessage={handleReplyToMessage}
        />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          placeholder={
            activeChat === 'global' 
              ? 'Type a message to everyone...' 
              : `Type a message to ${selectedUser?.displayName || 'user'}...`
          }
        />
      </div>
    </div>
  );
};

export default ChatArea;
