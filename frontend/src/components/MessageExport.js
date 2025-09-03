import React, { useState } from 'react';
import { FaDownload, FaFilePdf, FaFileWord, FaFileText, FaFileCsv } from 'react-icons/fa';

const MessageExport = ({ messages, chatName, onClose }) => {
  const [exportFormat, setExportFormat] = useState('txt');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filter messages by date range
  const filteredMessages = messages.filter(message => {
    if (!dateRange.start && !dateRange.end) return true;
    
    const messageDate = new Date(message.createdAt);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    
    if (startDate && messageDate < startDate) return false;
    if (endDate && messageDate > endDate) return false;
    
    return true;
  });

  // Format message for export
  const formatMessage = (message) => {
    const timestamp = new Date(message.createdAt).toLocaleString();
    const sender = message.sender?.displayName || message.sender?.username || 'Unknown';
    
    if (includeMetadata) {
      return `[${timestamp}] ${sender}: ${message.content || '[Media/File]'}`;
    } else {
      return `${sender}: ${message.content || '[Media/File]'}`;
    }
  };

  // Export as text
  const exportAsText = () => {
    const content = [
      `Chat Export: ${chatName}`,
      `Exported on: ${new Date().toLocaleString()}`,
      `Total messages: ${filteredMessages.length}`,
      '',
      ...filteredMessages.map(formatMessage)
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatName}_export_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const exportAsCSV = () => {
    const headers = ['Timestamp', 'Sender', 'Message', 'Type', 'Reactions'];
    const rows = filteredMessages.map(message => [
      new Date(message.createdAt).toLocaleString(),
      message.sender?.displayName || message.sender?.username || 'Unknown',
      message.content || '[Media/File]',
      message.type || 'text',
      message.reactions?.length || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatName}_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export as JSON
  const exportAsJSON = () => {
    const exportData = {
      chatName,
      exportDate: new Date().toISOString(),
      totalMessages: filteredMessages.length,
      messages: filteredMessages.map(message => ({
        id: message._id,
        timestamp: message.createdAt,
        sender: {
          id: message.sender._id,
          username: message.sender.username,
          displayName: message.sender.displayName
        },
        content: message.content,
        type: message.type,
        reactions: message.reactions || [],
        replyTo: message.replyTo
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatName}_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle export
  const handleExport = () => {
    switch (exportFormat) {
      case 'txt':
        exportAsText();
        break;
      case 'csv':
        exportAsCSV();
        break;
      case 'json':
        exportAsJSON();
        break;
      default:
        exportAsText();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Export Messages
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <FaDownload className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'txt', label: 'Text', icon: FaFileText },
                { value: 'csv', label: 'CSV', icon: FaFileCsv },
                { value: 'json', label: 'JSON', icon: FaFileWord }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setExportFormat(value)}
                  className={`p-3 rounded-lg border transition-colors ${
                    exportFormat === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Start date"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="End date"
              />
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Include timestamps and metadata
              </span>
            </label>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Export Preview:
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              {filteredMessages.length} messages from {chatName}
            </p>
            {dateRange.start && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                From: {new Date(dateRange.start).toLocaleDateString()}
              </p>
            )}
            {dateRange.end && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                To: {new Date(dateRange.end).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <FaDownload className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageExport;
