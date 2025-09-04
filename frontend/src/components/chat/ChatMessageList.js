import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ChatMessage from './ChatMessage';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';

const ChatMessageList = ({ messages, currentUser, messagesEndRef }) => {
  const scrollRef = useRef(null);

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.timestamp);
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const prevMessageDate = prevMessage ? new Date(prevMessage.timestamp) : null;

      // Check if we need a new date separator
      const needsDateSeparator = !prevMessageDate || 
        messageDate.toDateString() !== prevMessageDate.toDateString();

      // Check if we need a new message group (same sender, within 5 minutes)
      const needsNewGroup = !prevMessage || 
        message.sender.id !== prevMessage.sender.id ||
        (messageDate - prevMessageDate) > 5 * 60 * 1000; // 5 minutes

      if (needsDateSeparator) {
        groups.push({
          type: 'date',
          date: messageDate,
          id: `date-${messageDate.toDateString()}`
        });
      }

      if (needsNewGroup) {
        currentGroup = {
          type: 'message-group',
          id: `group-${message.id}`,
          sender: message.sender,
          messages: [message],
          timestamp: message.timestamp
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });

    return groups;
  };

  const getDateLabel = (date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  const messageGroups = groupMessagesByDate(messages);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesEndRef]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No messages yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start the conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messageGroups.map((group, index) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {group.type === 'date' ? (
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm px-3 py-1 rounded-full">
                {getDateLabel(group.date)}
              </div>
            </div>
          ) : (
            <div className={`flex ${group.sender.id === currentUser._id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${group.sender.id === currentUser._id ? 'order-2' : 'order-1'}`}>
                {/* Sender info for other users */}
                {group.sender.id !== currentUser._id && (
                  <div className="flex items-center space-x-2 mb-1">
                    <img
                      src={group.sender.avatar}
                      alt={group.sender.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {group.sender.name}
                    </span>
                  </div>
                )}

                {/* Messages in group */}
                <div className="space-y-1">
                  {group.messages.map((message, msgIndex) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwn={message.sender.id === currentUser._id}
                      showAvatar={msgIndex === group.messages.length - 1 && message.sender.id !== currentUser._id}
                      showTimestamp={msgIndex === group.messages.length - 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;
