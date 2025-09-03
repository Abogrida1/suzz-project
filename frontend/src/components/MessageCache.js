import React, { createContext, useContext, useState, useCallback } from 'react';

const MessageCacheContext = createContext();

export const MessageCacheProvider = ({ children }) => {
  const [cache, setCache] = useState(new Map());
  const [maxCacheSize] = useState(1000); // Maximum number of messages to cache

  const getCachedMessages = useCallback((chatId) => {
    return cache.get(chatId) || [];
  }, [cache]);

  const setCachedMessages = useCallback((chatId, messages) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      
      // Limit cache size
      if (newCache.size >= maxCacheSize) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
      }
      
      newCache.set(chatId, messages);
      return newCache;
    });
  }, [maxCacheSize]);

  const addMessageToCache = useCallback((chatId, message) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      const existingMessages = newCache.get(chatId) || [];
      
      // Check if message already exists
      const messageExists = existingMessages.some(m => m._id === message._id);
      if (!messageExists) {
        newCache.set(chatId, [...existingMessages, message]);
      }
      
      return newCache;
    });
  }, []);

  const updateMessageInCache = useCallback((chatId, messageId, updates) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      const existingMessages = newCache.get(chatId) || [];
      
      const updatedMessages = existingMessages.map(message =>
        message._id === messageId ? { ...message, ...updates } : message
      );
      
      newCache.set(chatId, updatedMessages);
      return newCache;
    });
  }, []);

  const removeMessageFromCache = useCallback((chatId, messageId) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      const existingMessages = newCache.get(chatId) || [];
      
      const filteredMessages = existingMessages.filter(message => message._id !== messageId);
      newCache.set(chatId, filteredMessages);
      
      return newCache;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const clearChatCache = useCallback((chatId) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.delete(chatId);
      return newCache;
    });
  }, []);

  const value = {
    getCachedMessages,
    setCachedMessages,
    addMessageToCache,
    updateMessageInCache,
    removeMessageFromCache,
    clearCache,
    clearChatCache
  };

  return (
    <MessageCacheContext.Provider value={value}>
      {children}
    </MessageCacheContext.Provider>
  );
};

export const useMessageCache = () => {
  const context = useContext(MessageCacheContext);
  if (!context) {
    throw new Error('useMessageCache must be used within a MessageCacheProvider');
  }
  return context;
};
