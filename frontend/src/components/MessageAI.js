import React, { useState, useEffect } from 'react';
import { FaRobot, FaLightbulb, FaChartLine, FaMagic, FaBrain, FaCog } from 'react-icons/fa';

const MessageAI = ({ messages, onAIAction }) => {
  const [aiFeatures, setAiFeatures] = useState({
    smartReplies: false,
    messageSummarization: false,
    sentimentAnalysis: false,
    autoTranslation: false,
    smartNotifications: false,
    contentModeration: false
  });
  const [aiInsights, setAiInsights] = useState({
    sentiment: 'neutral',
    topics: [],
    summary: '',
    suggestions: []
  });
  const [loading, setLoading] = useState(false);

  // Analyze messages for AI insights
  useEffect(() => {
    if (messages.length > 0) {
      analyzeMessages();
    }
  }, [messages]);

  const analyzeMessages = async () => {
    setLoading(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const insights = {
        sentiment: analyzeSentiment(messages),
        topics: extractTopics(messages),
        summary: generateSummary(messages),
        suggestions: generateSuggestions(messages)
      };
      
      setAiInsights(insights);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Analyze sentiment
  const analyzeSentiment = (messages) => {
    const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'happy', 'excited'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'frustrated'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    messages.forEach(message => {
      const content = message.content?.toLowerCase() || '';
      positiveWords.forEach(word => {
        if (content.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (content.includes(word)) negativeCount++;
      });
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  // Extract topics
  const extractTopics = (messages) => {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const wordCount = {};
    
    messages.forEach(message => {
      const words = message.content?.toLowerCase().split(/\W+/) || [];
      words.forEach(word => {
        if (word.length > 3 && !commonWords.includes(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  };

  // Generate summary
  const generateSummary = (messages) => {
    if (messages.length === 0) return 'No messages to summarize';
    if (messages.length < 5) return 'Short conversation with few messages';
    
    const recentMessages = messages.slice(-10);
    const topics = extractTopics(recentMessages);
    
    return `Recent conversation focused on: ${topics.join(', ')}. ${messages.length} total messages exchanged.`;
  };

  // Generate suggestions
  const generateSuggestions = (messages) => {
    const suggestions = [];
    
    if (messages.length > 50) {
      suggestions.push('Consider archiving old messages to improve performance');
    }
    
    if (aiInsights.sentiment === 'negative') {
      suggestions.push('Conversation seems tense. Consider taking a break or addressing concerns');
    }
    
    if (messages.some(msg => msg.type === 'image')) {
      suggestions.push('Images detected. Consider using image compression for better performance');
    }
    
    return suggestions;
  };

  // Handle AI feature toggle
  const handleFeatureToggle = (feature) => {
    setAiFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
    
    if (onAIAction) {
      onAIAction(feature, !aiFeatures[feature]);
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Get sentiment icon
  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😔';
      default:
        return '😐';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FaRobot className="h-6 w-6 text-blue-500" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          AI Assistant
        </h3>
      </div>

      {/* AI Insights */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Conversation Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sentiment Analysis */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FaBrain className="h-5 w-5 text-blue-500" />
              <span className="font-medium text-gray-900 dark:text-white">Sentiment</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getSentimentIcon(aiInsights.sentiment)}</span>
              <span className={`font-medium ${getSentimentColor(aiInsights.sentiment)}`}>
                {aiInsights.sentiment.charAt(0).toUpperCase() + aiInsights.sentiment.slice(1)}
              </span>
            </div>
          </div>

          {/* Topics */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FaChartLine className="h-5 w-5 text-green-500" />
              <span className="font-medium text-gray-900 dark:text-white">Topics</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {aiInsights.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FaLightbulb className="h-5 w-5 text-yellow-500" />
            <span className="font-medium text-gray-900 dark:text-white">Summary</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {loading ? 'Analyzing...' : aiInsights.summary}
          </p>
        </div>
      </div>

      {/* AI Features */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          AI Features
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'smartReplies', label: 'Smart Replies', description: 'AI-powered reply suggestions' },
            { key: 'messageSummarization', label: 'Auto Summarization', description: 'Automatic message summaries' },
            { key: 'sentimentAnalysis', label: 'Sentiment Analysis', description: 'Real-time mood detection' },
            { key: 'autoTranslation', label: 'Auto Translation', description: 'Translate messages automatically' },
            { key: 'smartNotifications', label: 'Smart Notifications', description: 'Intelligent notification filtering' },
            { key: 'contentModeration', label: 'Content Moderation', description: 'Automatic content filtering' }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiFeatures[key]}
                  onChange={() => handleFeatureToggle(key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      {aiInsights.suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            AI Suggestions
          </h4>
          <div className="space-y-2">
            {aiInsights.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <FaMagic className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Settings */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <FaCog className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">AI Settings</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          AI features are powered by advanced machine learning algorithms to enhance your messaging experience.
        </p>
      </div>
    </div>
  );
};

export default MessageAI;
