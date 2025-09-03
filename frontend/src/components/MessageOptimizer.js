import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from '../contexts/SocketContext';

const MessageOptimizer = ({ messages, onLoadMore, hasMore, loading }) => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { confirmMessageDelivery, confirmMessageRead } = useSocket();

  // Memoize message processing
  const processedMessages = useMemo(() => {
    return messages.map(message => ({
      ...message,
      isOptimized: true,
      timestamp: new Date(message.createdAt).getTime()
    }));
  }, [messages]);

  // Handle message delivery and read status
  const handleMessageVisibility = useCallback((message) => {
    if (message._id && !message.isOwn) {
      // Confirm delivery when message is rendered
      confirmMessageDelivery(message._id);
      
      // Confirm read when message is visible for 2 seconds
      setTimeout(() => {
        confirmMessageRead(message._id);
      }, 2000);
    }
  }, [confirmMessageDelivery, confirmMessageRead]);

  // Load more messages
  const handleLoadMore = useCallback(async () => {
    if (hasMore && !loading && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, loading, isLoadingMore, onLoadMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleLoadMore();
          }
        });
      },
      { threshold: 0.1 }
    );

    const loadMoreElement = document.getElementById('load-more-messages');
    if (loadMoreElement) {
      observer.observe(loadMoreElement);
    }

    return () => {
      if (loadMoreElement) {
        observer.unobserve(loadMoreElement);
      }
    };
  }, [handleLoadMore]);

  // Update visible messages
  useEffect(() => {
    setVisibleMessages(processedMessages);
  }, [processedMessages]);

  // Handle message visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const message = visibleMessages.find(m => m._id === messageId);
            if (message) {
              handleMessageVisibility(message);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const messageElements = document.querySelectorAll('[data-message-id]');
    messageElements.forEach(element => observer.observe(element));

    return () => {
      messageElements.forEach(element => observer.unobserve(element));
    };
  }, [visibleMessages, handleMessageVisibility]);

  return {
    visibleMessages,
    isLoadingMore,
    handleLoadMore
  };
};

export default MessageOptimizer;
