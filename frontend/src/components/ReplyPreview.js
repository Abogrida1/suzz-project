import React from 'react';
import { FaReply, FaTimes } from 'react-icons/fa';

const ReplyPreview = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 border-l-4 border-blue-500 pl-3 py-2 mb-2 rounded-r-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaReply className="h-3 w-3 text-blue-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Replying to {replyTo.sender?.displayName || replyTo.sender?.username}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Cancel reply"
        >
          <FaTimes className="h-3 w-3 text-gray-500" />
        </button>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-1">
        {replyTo.content}
      </p>
    </div>
  );
};

export default ReplyPreview;
