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
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token && user) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
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

      // Handle new messages
      newSocket.on('message_received', (message) => {
        // This will be handled by individual chat components
        // We can emit a custom event here if needed
        window.dispatchEvent(new CustomEvent('newMessage', { detail: message }));
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
        newSocket.close();
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

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('send_message', messageData);
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
    joinGlobalChat,
    leaveGlobalChat,
    joinPrivateChat,
    leavePrivateChat,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageRead,
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
