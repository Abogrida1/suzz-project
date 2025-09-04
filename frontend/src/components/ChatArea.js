import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useCall } from '../contexts/CallContext';
import { useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import GroupSettingsModal from './GroupSettingsModal';
import ChatHeader from './ChatHeader';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaCog } from 'react-icons/fa';

const ChatArea = ({ activeChat, selectedUser, onBackToSidebar, isMobile }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    socket, 
    joinGlobalChat, 
    leaveGlobalChat, 
    joinPrivateChat, 
    leavePrivateChat,
    joinGroupChat,
    leaveGroupChat,
    sendMessage,
    markMessageDelivered,
    markMessageRead,
    startTyping,
    stopTyping,
    typingUsers: socketTypingUsers
  } = useSocket();
  const { initiateCall } = useCall();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark all messages as read when chat is opened
  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessages = messages.filter(msg => 
        msg.sender._id !== user._id && 
        (!msg.readBy || !msg.readBy.some(read => read.user === user._id))
      );
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg._id);
        markMessagesAsRead(messageIds);
      }
    }
  }, [messages, user._id, activeChat, selectedUser]);

  // Mark multiple messages as read
  const markMessagesAsRead = async (messageIds) => {
    try {
      await api.post('/api/messages/read', {
        messageIds,
        chatType: activeChat,
        otherUserId: selectedUser?._id
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle chat changes
  useEffect(() => {
    if (activeChat === 'global') {
      joinGlobalChat();
      loadGlobalMessages();
    } else if (activeChat === 'private' && selectedUser) {
      joinPrivateChat(selectedUser._id);
      loadPrivateMessages();
    } else if (activeChat === 'group' && selectedUser) {
      joinGroupChat(selectedUser._id);
      loadGroupMessages();
    }

    return () => {
      if (activeChat === 'global') {
        leaveGlobalChat();
      } else if (activeChat === 'private' && selectedUser) {
        leavePrivateChat(selectedUser._id);
      } else if (activeChat === 'group' && selectedUser) {
        leaveGroupChat(selectedUser._id);
      }
    };
  }, [activeChat, selectedUser?._id]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (message) => {
      console.log('Message received in ChatArea:', message);
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.find(m => m._id === message._id);
        if (exists) {
          console.log('Message already exists, skipping duplicate');
          return prev;
        }
        
        // Don't add messages from current user (they're handled by message_sent)
        if (message.sender._id === user._id) {
          console.log('Message from current user, skipping (handled by message_sent)');
          return prev;
        }
        
        console.log('Adding new message to list');
        return [...prev, message];
      });
      
      // Mark message as read if it's not from current user
      if (message.sender._id !== user._id) {
        markMessageAsRead(message._id);
      }
    };

    const handleGlobalMessages = (messages) => {
      console.log('Global messages received:', messages);
      setMessages(messages);
    };

    const handlePrivateMessages = (data) => {
      console.log('Private messages received:', data);
      if (data.otherUserId === selectedUser?._id) {
        setMessages(data.messages || []);
      }
    };

    const handleGroupMessages = (data) => {
      console.log('Group messages received:', data);
      if (data.groupId === selectedUser?._id) {
        setMessages(data.messages || []);
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

    // Handle custom events from SocketContext
    const handleNewMessage = (event) => {
      const message = event.detail;
      console.log('Custom newMessage event:', message);
      handleMessageReceived(message);
    };

    const handleMessageSent = (event) => {
      const message = event.detail;
      console.log('Message sent event received:', message);
      
      // Remove optimistic message and add real message
      setMessages(prev => {
        // Remove all optimistic messages and add the real one
        const filtered = prev.filter(m => !m.isOptimistic);
        console.log('Removing optimistic messages and adding real message:', message._id);
        return [...filtered, { ...message, status: 'sent' }];
      });
    };

    const handleMessageDeliveryUpdate = (event) => {
      const data = event.detail;
      console.log('Message delivery update received:', data);
      
      setMessages(prev => {
        return prev.map(m => {
          if (m._id === data.messageId) {
            return { ...m, status: 'delivered' };
          }
          return m;
        });
      });
    };

    const handleMessageReadUpdate = (event) => {
      const data = event.detail;
      console.log('Message read update received:', data);
      
      setMessages(prev => {
        return prev.map(m => {
          if (m._id === data.messageId) {
            return { ...m, status: 'seen' };
          }
          return m;
        });
      });
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('global_messages', handleGlobalMessages);
    socket.on('private_messages', handlePrivateMessages);
    socket.on('group_messages', handleGroupMessages);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    
    // Listen for custom events
    window.addEventListener('newMessage', handleNewMessage);
    window.addEventListener('messageSent', handleMessageSent);
    window.addEventListener('messageDeliveryUpdate', handleMessageDeliveryUpdate);
    window.addEventListener('messageReadUpdate', handleMessageReadUpdate);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('global_messages', handleGlobalMessages);
      socket.off('private_messages', handlePrivateMessages);
      socket.off('group_messages', handleGroupMessages);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      window.removeEventListener('newMessage', handleNewMessage);
      window.removeEventListener('messageSent', handleMessageSent);
      window.removeEventListener('messageDeliveryUpdate', handleMessageDeliveryUpdate);
      window.removeEventListener('messageReadUpdate', handleMessageReadUpdate);
    };
  }, [socket, selectedUser, user]);

  // Mark messages as delivered when user opens the chat
  useEffect(() => {
    if (socket && selectedUser && activeChat === 'private') {
      // Mark all unread messages as delivered
      const unreadMessages = messages.filter(m => 
        m.sender._id !== user._id && 
        m.status === 'sent' && 
        !m.deliveryStatus?.some(ds => ds.user.toString() === selectedUser._id.toString() && ds.status === 'delivered')
      );
      
      unreadMessages.forEach(message => {
        console.log('Marking message as delivered:', message._id, 'to:', selectedUser._id);
        markMessageDelivered(message._id, selectedUser._id);
      });
    }
  }, [socket, selectedUser, activeChat, messages, user._id, markMessageDelivered]);

  // Mark messages as read when user views them
  useEffect(() => {
    if (socket && selectedUser && activeChat === 'private') {
      // Mark all delivered messages as read
      const deliveredMessages = messages.filter(m => 
        m.sender._id !== user._id && 
        m.status === 'delivered' && 
        !m.deliveryStatus?.some(ds => ds.user.toString() === selectedUser._id.toString() && ds.status === 'seen')
      );
      
      deliveredMessages.forEach(message => {
        markMessageRead(message._id);
      });
    }
  }, [socket, selectedUser, activeChat, messages, user._id, markMessageRead]);

  // Load messages
  const loadGlobalMessages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/messages/global');
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading global messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPrivateMessages = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/messages/private/${selectedUser._id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading private messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMessages = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/messages/group/${selectedUser._id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error loading group messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle sending messages
  const handleSendMessage = (messageData) => {
    if (!messageData.content && !messageData.attachment) return;

    // Create optimistic message with unique ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      _id: tempId,
      content: messageData.content,
      type: messageData.type || 'text',
      chatType: activeChat,
      sender: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      },
      status: 'sending',
      createdAt: new Date().toISOString(),
      attachment: messageData.attachment,
      replyTo: messageData.replyTo,
      isOptimistic: true // Mark as optimistic
    };

    // Add optimistic message immediately
    console.log('Adding optimistic message:', optimisticMessage._id);
    setMessages(prev => [...prev, optimisticMessage]);

    const data = {
      content: messageData.content,
      type: messageData.type || 'text',
      chatType: activeChat,
      recipients: activeChat === 'private' ? [selectedUser._id] : 
                  activeChat === 'group' ? [selectedUser._id] : [],
      attachment: messageData.attachment,
      replyTo: messageData.replyTo,
      tempId: tempId // Include temp ID for tracking
    };

    console.log('Sending message data:', data);
    sendMessage(data);

    // Immediate fallback: Update status after 1 second
    const timeoutId = setTimeout(() => {
      setMessages(prev => {
        const updated = prev.map(m => {
          if (m._id === tempId && m.isOptimistic) {
            console.log('Fallback: Updating optimistic message status to sent:', tempId);
            return { ...m, status: 'sent', isOptimistic: false };
          }
          return m;
        });
        return updated;
      });
    }, 1000); // 1 second fallback
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    if (activeChat === 'global') {
      startTyping('global', []);
    } else if (activeChat === 'private' && selectedUser) {
      startTyping('private', [selectedUser._id]);
    } else if (activeChat === 'group' && selectedUser) {
      startTyping('group', [selectedUser._id]);
    }
  };

  const handleTypingStop = () => {
    if (activeChat === 'global') {
      stopTyping('global', []);
    } else if (activeChat === 'private' && selectedUser) {
      stopTyping('private', [selectedUser._id]);
    } else if (activeChat === 'group' && selectedUser) {
      stopTyping('group', [selectedUser._id]);
    }
  };

  // Handle message actions
  const handleDeleteMessage = async (message) => {
    try {
      await api.delete(`/api/messages/${message._id}`);
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
        await api.put(`/api/messages/${message._id}`, {
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

  // Mark message as read
  const markMessageAsRead = async (messageId) => {
    try {
      await api.post('/api/messages/read', {
        messageIds: [messageId],
        chatType: activeChat,
        otherUserId: selectedUser?._id
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Get chat title
  const getChatTitle = () => {
    if (activeChat === 'global') {
      return 'Global Chat';
    } else if (activeChat === 'private' && selectedUser) {
      return selectedUser.displayName;
    } else if (activeChat === 'group' && selectedUser) {
      return selectedUser.name || 'Group Chat';
    }
    return 'Chat';
  };

  // Get chat subtitle
  const getChatSubtitle = () => {
    if (activeChat === 'global') {
      return 'Chat with everyone';
    } else if (activeChat === 'private' && selectedUser) {
      return `@${selectedUser.username}`;
    } else if (activeChat === 'group' && selectedUser) {
      return `${selectedUser.memberCount || selectedUser.members?.length || 0} members`;
    }
    return '';
  };

  return (
    <div className={`flex flex-col h-full min-h-0 bg-white dark:bg-gray-900 chat-area`}>
      {/* Chat Header */}
      <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${isMobile ? 'px-3 py-2' : 'px-4 py-3'} shadow-sm flex-shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <button
                onClick={() => navigate('/mobile-chats')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to chats"
              >
                <FaArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getChatTitle()}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getChatSubtitle()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {activeChat === 'private' && selectedUser && (
              <button 
                onClick={() => initiateCall(selectedUser, 'voice')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Voice Call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            )}
            {activeChat === 'group' && selectedUser && (
              <button 
                onClick={() => {
                  setCurrentGroup(selectedUser);
                  setShowGroupSettings(true);
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Group Settings"
              >
                <FaCog className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        <MessageList
          messages={messages}
          loading={loading}
          typingUsers={[]} // Remove typing users from MessageList
          currentUser={user}
          messagesEndRef={messagesEndRef}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onReplyToMessage={handleReplyToMessage}
          activeChat={activeChat}
          isMobile={isMobile}
        />
      </div>

      {/* Typing Indicator - Fixed at bottom */}
      {typingUsers.length > 0 && (
        <div className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${isMobile ? 'px-2 py-1' : 'px-4 py-2'} flex-shrink-0`}>
          <TypingIndicator users={typingUsers} isMobile={isMobile} />
        </div>
      )}

      {/* Message Input */}
      <div className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${isMobile ? 'p-3 pb-safe' : 'p-4'} flex-shrink-0`}>
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          placeholder={
            activeChat === 'global' 
              ? 'Type a message to everyone...' 
              : activeChat === 'group'
              ? `Type a message to ${selectedUser?.name || 'group'}...`
              : `Type a message to ${selectedUser?.displayName || 'user'}...`
          }
        />
      </div>

      {/* Group Settings Modal */}
      <GroupSettingsModal
        group={currentGroup}
        isOpen={showGroupSettings}
        onClose={() => setShowGroupSettings(false)}
        onGroupUpdate={(updatedGroup) => {
          setCurrentGroup(updatedGroup);
          // Update the selected user with new group data
          if (selectedUser && selectedUser._id === updatedGroup._id) {
            // This will trigger a re-render with updated group data
            window.location.reload();
          }
        }}
      />
    </div>
  );
};

export default ChatArea;
