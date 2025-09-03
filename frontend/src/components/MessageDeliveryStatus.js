import React from 'react';
import { FaCheck, FaCheckDouble, FaClock, FaEye } from 'react-icons/fa';

const MessageDeliveryStatus = ({ message, currentUserId }) => {
  if (!message) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <FaClock className="h-3 w-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <FaCheck className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <FaCheckDouble className="h-3 w-3 text-gray-400" />;
      case 'seen':
        return <FaEye className="h-3 w-3 text-blue-500" />;
      default:
        return <FaClock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'seen':
        return 'Seen';
      default:
        return 'Unknown';
    }
  };

  // For group messages, show status for each member
  if (message.chatType === 'group' && message.deliveryStatus) {
    return (
      <div className="flex items-center space-x-1">
        {message.deliveryStatus.map((status, index) => (
          <div
            key={index}
            className="flex items-center space-x-1"
            title={`${status.user?.displayName || status.user?.username}: ${getStatusText(status.status)}`}
          >
            {getStatusIcon(status.status)}
          </div>
        ))}
      </div>
    );
  }

  // For private messages, show single status
  return (
    <div className="flex items-center space-x-1" title={getStatusText(message.status)}>
      {getStatusIcon(message.status)}
    </div>
  );
};

export default MessageDeliveryStatus;
