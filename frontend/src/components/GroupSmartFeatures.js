import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { 
  FaRobot, 
  FaLightbulb, 
  FaChartLine, 
  FaUsers, 
  FaClock, 
  FaStar,
  FaHashtag,
  FaHeart,
  FaThumbsUp,
  FaComment,
  FaShare,
  FaArrowUp,
  FaAward,
  FaMagic,
  FaTimes
} from 'react-icons/fa';

const GroupSmartFeatures = ({ group, isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group && isOpen) {
      loadAnalytics();
      generateInsights();
    }
  }, [group, isOpen]);

  const loadAnalytics = async () => {
    if (!group) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/groups/${group._id}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Mock data for demo
      setAnalytics({
        totalMessages: 1247,
        activeMembers: group.members?.length || 0,
        messagesToday: 23,
        messagesThisWeek: 156,
        mostActiveHour: '8 PM',
        mostActiveDay: 'Friday',
        topContributors: [
          { user: { displayName: 'John Doe' }, messageCount: 45 },
          { user: { displayName: 'Jane Smith' }, messageCount: 38 },
          { user: { displayName: 'Mike Johnson' }, messageCount: 32 }
        ],
        engagementRate: 78,
        responseTime: '2.3 min'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = () => {
    // Mock insights for demo
    const mockInsights = [
      {
        type: 'trend',
        title: 'Activity Peak',
        description: 'Your group is most active on Fridays at 8 PM',
        icon: FaArrowUp,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
      },
      {
        type: 'engagement',
        title: 'High Engagement',
        description: '78% engagement rate - excellent group participation!',
        icon: FaHeart,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20'
      },
      {
        type: 'growth',
        title: 'Growing Community',
        description: 'Group activity increased by 23% this week',
        icon: FaChartLine,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20'
      },
      {
        type: 'suggestion',
        title: 'Smart Suggestion',
        description: 'Consider adding more moderators for better management',
        icon: FaLightbulb,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
      }
    ];
    setInsights(mockInsights);
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: FaChartLine },
    { id: 'insights', label: 'Insights', icon: FaLightbulb },
    { id: 'automation', label: 'Automation', icon: FaRobot },
    { id: 'moderation', label: 'Moderation', icon: FaAward }
  ];

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <FaMagic className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Smart Features
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered insights for {group.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Total Messages</p>
                          <p className="text-2xl font-bold">{analytics?.totalMessages || 0}</p>
                        </div>
                        <FaComment className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-xl text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Active Members</p>
                          <p className="text-2xl font-bold">{analytics?.activeMembers || 0}</p>
                        </div>
                        <FaUsers className="w-8 h-8 text-green-200" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-xl text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Engagement</p>
                          <p className="text-2xl font-bold">{analytics?.engagementRate || 0}%</p>
                        </div>
                        <FaHeart className="w-8 h-8 text-purple-200" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-xl text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm">Response Time</p>
                          <p className="text-2xl font-bold">{analytics?.responseTime || '0 min'}</p>
                        </div>
                        <FaClock className="w-8 h-8 text-orange-200" />
                      </div>
                    </div>
                  </div>

                  {/* Activity Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Activity Patterns
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Most Active Hour</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {analytics?.mostActiveHour || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Most Active Day</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {analytics?.mostActiveDay || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Messages Today</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {analytics?.messagesToday || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">This Week</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {analytics?.messagesThisWeek || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Top Contributors
                      </h3>
                      <div className="space-y-3">
                        {analytics?.topContributors?.slice(0, 3).map((contributor, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {contributor.user.displayName?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <span className="text-gray-900 dark:text-white">
                                {contributor.user.displayName || 'User'}
                              </span>
                            </div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {contributor.messageCount} messages
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl ${insight.bgColor}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                      <insight.icon className={`w-5 h-5 ${insight.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'automation' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <FaRobot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Smart Automation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  AI-powered features coming soon!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <FaAward className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Smart Moderation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  AI-powered moderation tools coming soon!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default GroupSmartFeatures;
