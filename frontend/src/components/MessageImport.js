import React, { useState } from 'react';
import { FaUpload, FaFileText, FaFileCsv, FaFileWord, FaTimes } from 'react-icons/fa';

const MessageImport = ({ onImport, onClose }) => {
  const [file, setFile] = useState(null);
  const [importFormat, setImportFormat] = useState('txt');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    // Determine format from file extension
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (extension === 'csv') {
      setImportFormat('csv');
    } else if (extension === 'json') {
      setImportFormat('json');
    } else {
      setImportFormat('txt');
    }

    // Preview file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setPreview(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
    };
    reader.readAsText(selectedFile);
  };

  // Parse text file
  const parseTextFile = (content) => {
    const lines = content.split('\n');
    const messages = [];

    lines.forEach((line, index) => {
      if (line.trim()) {
        // Try to parse timestamp and sender
        const timestampMatch = line.match(/^\[(.*?)\]/);
        const senderMatch = line.match(/\]\s*([^:]+):\s*(.*)$/);

        if (timestampMatch && senderMatch) {
          messages.push({
            timestamp: timestampMatch[1],
            sender: senderMatch[1].trim(),
            content: senderMatch[2].trim(),
            lineNumber: index + 1
          });
        } else {
          // Fallback: treat as simple message
          messages.push({
            timestamp: new Date().toISOString(),
            sender: 'Imported User',
            content: line.trim(),
            lineNumber: index + 1
          });
        }
      }
    });

    return messages;
  };

  // Parse CSV file
  const parseCSVFile = (content) => {
    const lines = content.split('\n');
    const messages = [];
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim()) {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const message = {};

        headers.forEach((header, index) => {
          message[header.toLowerCase()] = values[index] || '';
        });

        messages.push({
          ...message,
          lineNumber: i + 1
        });
      }
    }

    return messages;
  };

  // Parse JSON file
  const parseJSONFile = (content) => {
    try {
      const data = JSON.parse(content);
      return data.messages || [];
    } catch (err) {
      throw new Error('Invalid JSON format');
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        let messages = [];

        switch (importFormat) {
          case 'txt':
            messages = parseTextFile(content);
            break;
          case 'csv':
            messages = parseCSVFile(content);
            break;
          case 'json':
            messages = parseJSONFile(content);
            break;
          default:
            throw new Error('Unsupported format');
        }

        if (messages.length === 0) {
          setError('No messages found in the file');
          return;
        }

        onImport(messages);
        onClose();
      };
      reader.readAsText(file);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import Messages
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select File
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".txt,.csv,.json"
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <FaUpload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to select file or drag and drop
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  Supported formats: TXT, CSV, JSON
                </span>
              </label>
            </div>
            {file && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-900 dark:text-white">
                  Selected: {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Size: {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>

          {/* Import Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'txt', label: 'Text', icon: FaFileText },
                { value: 'csv', label: 'CSV', icon: FaFileCsv },
                { value: 'json', label: 'JSON', icon: FaFileWord }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setImportFormat(value)}
                  className={`p-3 rounded-lg border transition-colors ${
                    importFormat === value
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

          {/* Preview */}
          {preview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-gray-900 dark:text-white whitespace-pre-wrap">
                  {preview}
                </pre>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
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
            onClick={handleImport}
            disabled={!file}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaUpload className="h-4 w-4" />
            <span>Import</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageImport;
