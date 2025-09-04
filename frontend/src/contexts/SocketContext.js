import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [messageStatuses, setMessageStatuses] = useState({});
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token && user) {
      const getSocketURL = () => {
        if (process.env.NODE_ENV === 'production') {
          return window.location.origin;
        }
        return process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
      };

      const newSocket = io(getSocketURL(), {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 30000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5,
        randomizationFactor: 0.5,
        autoConnect: true,
        upgrade: true,
        rememberUpgrade: true
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnected(false);
        // Don't show error toast immediately, let reconnection handle it
      });

      newSocket.on('reconnect', () => {
        console.log('Reconnected to server');
        setConnected(true);
        toast.success('Reconnected to server');
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Reconnection error:', error);
        toast.error('Connection failed. Please refresh the page.');
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Reconnection failed');
        toast.error('Connection failed. Please refresh the page.');
      });

      // Handle user online/offline events
      newSocket.on('user_online', (data) => {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u._id === data.user._id);
          if (!exists) {
            return [...prev, data.user];
          }
          return prev.map(u => 
            u._id === data.user._id ? { ...u, isOnline: true } : u
          );
        });
      });

      newSocket.on('user_offline', (data) => {
        setOnlineUsers(prev => 
          prev.map(u => 
            u._id === data.userId ? { ...u, isOnline: false } : u
          )
        );
      });

      // Handle typing indicators
      newSocket.on('user_typing', (data) => {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: {
            username: data.username,
            displayName: data.displayName
          }
        }));
      });

      newSocket.on('user_stopped_typing', (data) => {
        setTypingUsers(prev => {
          const newTyping = { ...prev };
          delete newTyping[data.userId];
          return newTyping;
        });
      });

      // Handle message delivery updates
      newSocket.on('message_delivery_update', (data) => {
        setMessageStatuses(prev => ({
          ...prev,
          [data.messageId]: {
            ...prev[data.messageId],
            [data.userId]: data.status
          }
        }));
      });

      // Handle message read updates
      newSocket.on('message_read_update', (data) => {
        setMessageStatuses(prev => ({
          ...prev,
          [data.messageId]: {
            ...prev[data.messageId],
            [data.userId]: data.status
          }
        }));
      });

      // Handle message reactions
      newSocket.on('reaction_added', (data) => {
        console.log('Reaction added:', data);
        // Emit custom event for message components to listen to
        window.dispatchEvent(new CustomEvent('reaction_added', { detail: data }));
      });

      newSocket.on('reaction_removed', (data) => {
        console.log('Reaction removed:', data);
        // Emit custom event for message components to listen to
        window.dispatchEvent(new CustomEvent('reaction_removed', { detail: data }));
      });

      newSocket.on('reaction_updated', (data) => {
        console.log('Reaction updated:', data);
        // Emit custom event for message components to listen to
        window.dispatchEvent(new CustomEvent('reaction_updated', { detail: data }));
      });

      // Handle errors
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'An error occurred');
      });

      // Handle new messages
      newSocket.on('message_received', (message) => {
        console.log('New message received:', message);
        // Emit custom event for message handling
        window.dispatchEvent(new CustomEvent('newMessage', { detail: message }));
      });

      // Handle optimistic messages
      newSocket.on('optimistic_message', (message) => {
        // Emit custom event for optimistic messages
        window.dispatchEvent(new CustomEvent('optimisticMessage', { detail: message }));
      });

      // Handle message sent confirmation
      newSocket.on('message_sent', (message) => {
        console.log('SocketContext: message_sent event received:', message);
        // Replace optimistic message with real message
        window.dispatchEvent(new CustomEvent('messageSent', { detail: message }));
        console.log('SocketContext: Dispatched messageSent custom event');
      });

      newSocket.on('new_private_message', (data) => {
        // Show notification for new private messages
        if (data.sender._id !== user._id) {
          toast.success(`New message from ${data.sender.displayName}`, {
            duration: 3000,
          });
        }
      });

      // Handle message read status
      newSocket.on('message_read', (data) => {
        window.dispatchEvent(new CustomEvent('messageRead', { detail: data }));
      });

      // Handle user status updates
      newSocket.on('user_status_updated', (data) => {
        setOnlineUsers(prev => 
          prev.map(u => 
            u._id === data.userId ? { ...u, status: data.status } : u
          )
        );
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
        setSocket(null);
        setConnected(false);
        setOnlineUsers([]);
        setTypingUsers({});
      };
    }
  }, [isAuthenticated, token, user]);

  // Socket event handlers
  const joinGlobalChat = () => {
    if (socket) {
      socket.emit('join_global');
    }
  };

  const leaveGlobalChat = () => {
    if (socket) {
      socket.emit('leave_global');
    }
  };

  const joinPrivateChat = (otherUserId) => {
    if (socket) {
      socket.emit('join_private', { otherUserId });
    }
  };

  const leavePrivateChat = (otherUserId) => {
    if (socket) {
      socket.emit('leave_private', { otherUserId });
    }
  };

  const joinGroupChat = (groupId) => {
    if (socket) {
      socket.emit('join_group', { groupId });
    }
  };

  const leaveGroupChat = (groupId) => {
    if (socket) {
      socket.emit('leave_group', { groupId });
    }
  };

  const sendMessage = (messageData) => {
    if (socket && connected) {
      console.log('Sending message:', messageData);
      socket.emit('send_message', messageData);
    } else {
      console.error('Socket not connected', { socket: !!socket, connected });
      toast.error('Connection lost. Please refresh the page.');
    }
  };

  const startTyping = (chatType, recipients) => {
    if (socket) {
      socket.emit('typing_start', { chatType, recipients });
    }
  };

  const stopTyping = (chatType, recipients) => {
    if (socket) {
      socket.emit('typing_stop', { chatType, recipients });
    }
  };

  const markMessageRead = (messageId) => {
    if (socket) {
      socket.emit('mark_message_read', { messageId });
    }
  };

  const confirmMessageDelivery = (messageId) => {
    if (socket && connected) {
      socket.emit('message_delivered', { messageId });
    }
  };

  const confirmMessageRead = (messageId) => {
    if (socket && connected) {
      socket.emit('message_read', { messageId });
    }
  };

  const addReaction = (messageId, emoji) => {
    if (socket && connected) {
      socket.emit('add_reaction', { messageId, emoji });
    }
  };

  const removeReaction = (messageId, emoji) => {
    if (socket && connected) {
      socket.emit('remove_reaction', { messageId, emoji });
    }
  };

  const updateStatus = (status) => {
    if (socket) {
      socket.emit('update_status', { status });
    }
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    typingUsers,
    messageStatuses,
    joinGlobalChat,
    leaveGlobalChat,
    joinPrivateChat,
    leavePrivateChat,
    joinGroupChat,
    leaveGroupChat,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageRead,
    confirmMessageDelivery,
    confirmMessageRead,
    addReaction,
    removeReaction,
    updateStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
