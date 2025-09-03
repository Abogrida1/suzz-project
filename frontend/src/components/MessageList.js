import React, { useEffect, useRef, memo } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { formatDistanceToNow } from 'date-fns';

const MessageList = ({ 
  messages, 
  loading, 
  typingUsers, 
  currentUser, 
  messagesEndRef,
  onDeleteMessage,
  onEditMessage,
  onReplyToMessage,
  activeChat = null,
  isMobile = false
}) => {
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  // Check if messages are from the same sender and close in time
  const shouldGroupWithPrevious = (currentMessage, previousMessage) => {
    if (!previousMessage) return false;
    
    const timeDiff = new Date(currentMessage.createdAt) - new Date(previousMessage.createdAt);
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return (
      currentMessage.sender._id === previousMessage.sender._id &&
      timeDiff < fiveMinutes
    );
  };

  const renderMessageGroup = (messageGroup, isLastGroup = false) => {
    return messageGroup.map((message, index) => {
      const isLastMessage = index === messageGroup.length - 1;
      const showAvatar = isLastMessage;
      const showTimestamp = isLastMessage;
      
      return (
        <MessageBubble
          key={message._id}
          message={message}
          isOwn={message.sender._id === currentUser._id}
          showAvatar={showAvatar}
          showTimestamp={showTimestamp}
          isGrouped={!isLastMessage}
          onDelete={onDeleteMessage}
          onEdit={onEditMessage}
          onReply={onReplyToMessage}
          showSenderName={!isLastMessage}
        />
      );
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

  const messageGroups = groupMessagesByDate(messages);
  const dates = Object.keys(messageGroups).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div 
      ref={messagesContainerRef}
      className={`flex-1 overflow-y-auto custom-scrollbar chat-messages-container ${isMobile ? 'p-3' : 'p-4'} space-y-2 min-h-0`}
      style={{ 
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgb(156 163 175) rgb(243 244 246)',
        height: '100%',
        maxHeight: '100%'
      }}
    >
      {dates.map((date, dateIndex) => (
        <div key={date}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-1">
            {messageGroups[date].map((message, messageIndex) => {
              const previousMessage = messageIndex > 0 ? messageGroups[date][messageIndex - 1] : null;
              const isGrouped = shouldGroupWithPrevious(message, previousMessage);
              const isLastMessage = messageIndex === messageGroups[date].length - 1;
              
              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={message.sender._id === currentUser._id}
                  showAvatar={!isGrouped}
                  showTimestamp={isLastMessage}
                  isGrouped={isGrouped}
                  onDelete={onDeleteMessage}
                  onEdit={onEditMessage}
                  onReply={onReplyToMessage}
                  showSenderName={!isGrouped}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className={`flex justify-start ${isMobile ? 'mb-3 px-2' : 'mb-4 px-4'}`}>
          <TypingIndicator users={typingUsers} isMobile={isMobile} />
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default memo(MessageList);
