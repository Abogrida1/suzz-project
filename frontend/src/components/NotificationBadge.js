import React, { useState, useEffect } from 'react';
import { FaBell, FaBellSlash } from 'react-icons/fa';
import { useSocket } from '../contexts/SocketContext';

const NotificationBadge = ({ chatId, chatType, onMarkAsRead }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    const handleNewMessage = (message) => {
      if (message.chatType === chatType && message.sender._id !== chatId) {
        setUnreadCount(prev => prev + 1);
        setIsVisible(true);
      }
    };

    // Listen for message read updates
    const handleMessageRead = (data) => {
      if (data.chatId === chatId) {
        setUnreadCount(0);
        setIsVisible(false);
      }
    };

    socket.on('message_received', handleNewMessage);
    socket.on('message_read', handleMessageRead);

    return () => {
      socket.off('message_received', handleNewMessage);
      socket.off('message_read', handleMessageRead);
    };
  }, [socket, chatId, chatType]);

  const handleClick = () => {
    if (onMarkAsRead) {
      onMarkAsRead();
    }
    setUnreadCount(0);
    setIsVisible(false);
  };

  if (!isVisible || unreadCount === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        title={`${unreadCount} unread messages`}
      >
        <FaBell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default NotificationBadge;
