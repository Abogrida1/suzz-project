import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaTimes, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const MessageSearch = ({ messages, onMessageSelect, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightedMessage, setHighlightedMessage] = useState(null);

  // Search messages
  const searchMessages = useMemo(() => {
    if (!searchQuery.trim() || !messages) return [];

    const query = searchQuery.toLowerCase();
    return messages
      .filter(message => 
        message.content?.toLowerCase().includes(query) ||
        message.sender?.displayName?.toLowerCase().includes(query) ||
        message.sender?.username?.toLowerCase().includes(query)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [messages, searchQuery]);

  useEffect(() => {
    setSearchResults(searchMessages);
    setCurrentIndex(0);
  }, [searchMessages]);

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Navigate through results
  const navigateResults = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : searchResults.length - 1;
    } else {
      newIndex = currentIndex < searchResults.length - 1 ? currentIndex + 1 : 0;
    }

    setCurrentIndex(newIndex);
    const message = searchResults[newIndex];
    setHighlightedMessage(message);
    
    if (onMessageSelect) {
      onMessageSelect(message);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateResults('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateResults('down');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, searchResults, onClose]);

  // Highlight search terms
  const highlightText = (text, query) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : part
    );
  };

  // Format message preview
  const formatMessagePreview = (message) => {
    const maxLength = 100;
    let preview = message.content || '';
    
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength) + '...';
    }
    
    return preview;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Messages
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search messages, users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim() ? (
            searchResults.length > 0 ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                  {searchResults.length > 1 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateResults('up')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Previous result"
                      >
                        <FaArrowUp className="h-4 w-4 text-gray-500" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {currentIndex + 1} of {searchResults.length}
                      </span>
                      <button
                        onClick={() => navigateResults('down')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Next result"
                      >
                        <FaArrowDown className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {searchResults.map((message, index) => (
                    <div
                      key={message._id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        index === currentIndex
                          ? 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                      onClick={() => {
                        setCurrentIndex(index);
                        setHighlightedMessage(message);
                        if (onMessageSelect) {
                          onMessageSelect(message);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {message.sender?.displayName?.charAt(0) || message.sender?.username?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {message.sender?.displayName || message.sender?.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimestamp(message.createdAt)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {highlightText(formatMessagePreview(message), searchQuery)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <FaSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No messages found for "{searchQuery}"
                </p>
              </div>
            )
          ) : (
            <div className="p-8 text-center">
              <FaSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Enter a search term to find messages
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSearch;
