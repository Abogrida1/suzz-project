import React from 'react';
import { FaCheck, FaCheckDouble, FaClock } from 'react-icons/fa';

const MessageStatus = ({ status, isOwn, readBy = [] }) => {
  if (!isOwn) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <FaClock className="h-3 w-3 text-gray-400 animate-pulse" />;
      case 'sent':
        return <FaCheck className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <FaCheckDouble className="h-3 w-3 text-gray-400" />;
      case 'seen':
        return <FaCheckDouble className="h-3 w-3 text-blue-500" />;
      default:
        return <FaClock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusText = () => {
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

  return (
    <div className="flex items-center space-x-1" title={getStatusText()}>
      {getStatusIcon()}
      {readBy.length > 0 && (
        <span className="text-xs text-gray-500">
          {readBy.length} read
        </span>
      )}
    </div>
  );
};

export default MessageStatus;
