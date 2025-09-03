import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMessageCache } from './MessageCache';

const MessagePerformance = ({ messages, chatId, onLoadMore, hasMore }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getCachedMessages, setCachedMessages, addMessageToCache } = useMessageCache();

  // Memoize processed messages
  const processedMessages = useMemo(() => {
    return messages.map(message => ({
      ...message,
      isOptimized: true,
      timestamp: new Date(message.createdAt).getTime()
    }));
  }, [messages]);

  // Load messages with caching
  const loadMessages = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cachedMessages = getCachedMessages(chatId);
      if (cachedMessages.length > 0 && page === 1) {
        setLoading(false);
        return cachedMessages;
      }

      // Load from API
      const newMessages = await onLoadMore(page);
      
      // Cache messages
      if (page === 1) {
        setCachedMessages(chatId, newMessages);
      } else {
        newMessages.forEach(message => addMessageToCache(chatId, message));
      }
      
      setLoading(false);
      return newMessages;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [chatId, onLoadMore, getCachedMessages, setCachedMessages, addMessageToCache]);

  // Virtual scrolling for large message lists
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [containerHeight, setContainerHeight] = useState(0);
  const [itemHeight] = useState(80); // Estimated height per message

  const visibleMessages = useMemo(() => {
    return processedMessages.slice(visibleRange.start, visibleRange.end);
  }, [processedMessages, visibleRange]);

  // Handle scroll for virtual scrolling
  const handleScroll = useCallback((e) => {
    const { scrollTop, clientHeight } = e.target;
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + Math.ceil(clientHeight / itemHeight) + 10, processedMessages.length);
    
    setVisibleRange({ start, end });
  }, [itemHeight, processedMessages.length]);

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      console.log(`MessagePerformance render time: ${endTime - startTime}ms`);
    };
  });

  return {
    processedMessages,
    visibleMessages,
    loading,
    error,
    loadMessages,
    handleScroll,
    containerHeight,
    setContainerHeight
  };
};

export default MessagePerformance;
