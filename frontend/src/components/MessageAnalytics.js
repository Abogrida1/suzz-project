import React, { useState, useEffect, useMemo } from 'react';
import { FaChartLine, FaUsers, FaClock, FaHeart, FaReply, FaEdit } from 'react-icons/fa';

const MessageAnalytics = ({ messages, chatType, chatId }) => {
  const [analytics, setAnalytics] = useState(null);

  // Calculate analytics
  const calculatedAnalytics = useMemo(() => {
    if (!messages || messages.length === 0) return null;

    const totalMessages = messages.length;
    const totalReactions = messages.reduce((sum, msg) => sum + (msg.reactions?.length || 0), 0);
    const totalReplies = messages.filter(msg => msg.replyTo).length;
    const totalEdits = messages.filter(msg => msg.edited).length;
    
    // Message frequency by hour
    const hourlyStats = messages.reduce((stats, msg) => {
      const hour = new Date(msg.createdAt).getHours();
      stats[hour] = (stats[hour] || 0) + 1;
      return stats;
    }, {});

    // Most active users
    const userStats = messages.reduce((stats, msg) => {
      const userId = msg.sender._id;
      if (!stats[userId]) {
        stats[userId] = {
          user: msg.sender,
          count: 0,
          reactions: 0,
          replies: 0
        };
      }
      stats[userId].count++;
      stats[userId].reactions += msg.reactions?.length || 0;
      if (msg.replyTo) stats[userId].replies++;
      return stats;
    }, {});

    const mostActiveUsers = Object.values(userStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Message types
    const messageTypes = messages.reduce((types, msg) => {
      types[msg.type] = (types[msg.type] || 0) + 1;
      return types;
    }, {});

    // Average response time (for private chats)
    let avgResponseTime = null;
    if (chatType === 'private' && messages.length > 1) {
      const responseTimes = [];
      for (let i = 1; i < messages.length; i++) {
        const prevMsg = messages[i - 1];
        const currMsg = messages[i];
        if (prevMsg.sender._id !== currMsg.sender._id) {
          const timeDiff = new Date(currMsg.createdAt) - new Date(prevMsg.createdAt);
          responseTimes.push(timeDiff);
        }
      }
      if (responseTimes.length > 0) {
        avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      }
    }

    return {
      totalMessages,
      totalReactions,
      totalReplies,
      totalEdits,
      hourlyStats,
      mostActiveUsers,
      messageTypes,
      avgResponseTime
    };
  }, [messages, chatType]);

  useEffect(() => {
    setAnalytics(calculatedAnalytics);
  }, [calculatedAnalytics]);

  if (!analytics) return null;

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FaChartLine className="h-6 w-6 text-blue-500" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Chat Analytics
        </h3>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaUsers className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Messages</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {analytics.totalMessages}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaHeart className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Reactions</span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            {analytics.totalReactions}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaReply className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Replies</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {analytics.totalReplies}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FaEdit className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Edits</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {analytics.totalEdits}
          </p>
        </div>
      </div>

      {/* Most Active Users */}
      {analytics.mostActiveUsers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Most Active Users
          </h4>
          <div className="space-y-2">
            {analytics.mostActiveUsers.map((user, index) => (
              <div key={user.user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.user.displayName || user.user.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.count} messages
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {user.reactions} reactions
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {user.replies} replies
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Average Response Time */}
      {analytics.avgResponseTime && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Average Response Time
          </h4>
          <div className="flex items-center space-x-2">
            <FaClock className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {formatTime(analytics.avgResponseTime)}
            </span>
          </div>
        </div>
      )}

      {/* Message Types */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Message Types
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(analytics.messageTypes).map(([type, count]) => (
            <div key={type} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                {type}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {count}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageAnalytics;
