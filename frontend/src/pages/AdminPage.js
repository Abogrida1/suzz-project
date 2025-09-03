import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import AdminManagement from '../components/AdminManagement';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { 
  FaUsers, 
  FaComments, 
  FaTrash, 
  FaEye, 
  FaChartBar,
  FaGlobe,
  FaUserFriends,
  FaEnvelope,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaDownload,
  FaRedo,
  FaUserCog,
  FaShieldAlt
} from 'react-icons/fa';

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Stats data
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  
  // Users data
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  
  // Messages data
  const [messages, setMessages] = useState([]);
  const [messageSearch, setMessageSearch] = useState('');
  const [chatTypeFilter, setChatTypeFilter] = useState('');
  
  // Groups data
  const [groups, setGroups] = useState([]);
  
  // Check admin credentials on component mount
  // Check admin authorization
  useEffect(() => {
    const checkAdminAuthorization = async () => {
      if (user) {
        try {
          const response = await api.get('/api/auth/me');
          const userData = response.data;
          
          // Check for admin role or if user is the specific admin email
          const hasAdminRole = userData.role && ['admin', 'super_admin', 'moderator'].includes(userData.role);
          const isSpecificAdmin = userData.email === 'madoabogrida05@gmail.com';
          
          setIsAuthorized(hasAdminRole || isSpecificAdmin);
          
          if (!hasAdminRole && !isSpecificAdmin) {
            toast.error('ليس لديك صلاحية للوصول إلى لوحة الإدارة');
            setTimeout(() => navigate('/'), 2000);
            return;
          }
        } catch (error) {
          console.error('Error checking admin authorization:', error);
          // Fallback: check if current user email matches admin email
          const isSpecificAdmin = user?.email === 'madoabogrida05@gmail.com';
          setIsAuthorized(isSpecificAdmin);
          
          if (!isSpecificAdmin) {
            toast.error('خطأ في التحقق من الصلاحيات');
            setTimeout(() => navigate('/'), 2000);
            return;
          }
        }
      } else {
        setIsAuthorized(false);
        toast.error('يجب تسجيل الدخول أولاً');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      setCheckingAuth(false);
    };

    checkAdminAuthorization();
  }, [user, navigate]);

  useEffect(() => {
    const storedCredentials = localStorage.getItem('adminCredentials');
    if (!storedCredentials) {
      navigate('/admin-login');
      return;
    }
    
    try {
      const credentials = JSON.parse(storedCredentials);
      setAdminCredentials(credentials);
    } catch (error) {
      console.error('Error parsing admin credentials:', error);
      navigate('/admin-login');
    }
  }, [navigate]);
  
  useEffect(() => {
    if (adminCredentials) {
      loadStats();
    }
  }, [adminCredentials]);
  
  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/admin/stats', adminCredentials);
      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers);
      setRecentMessages(response.data.recentMessages);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };
  
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/admin/users', adminCredentials);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/api/admin/messages?chatType=${chatTypeFilter}`, adminCredentials);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };
  
  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/admin/groups', adminCredentials);
      setGroups(response.data.groups);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/api/admin/users/${userId}`, { data: adminCredentials });
      toast.success('User deleted successfully');
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };
  
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    try {
      await api.delete(`/api/admin/messages/${messageId}`, { data: adminCredentials });
      toast.success('Message deleted successfully');
      loadMessages();
      loadStats();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };
  
  const handleDeleteAllGlobalMessages = async () => {
    if (!window.confirm('Are you sure you want to delete ALL global messages? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await api.delete('/api/admin/messages/global', { data: adminCredentials });
      toast.success(`Deleted ${response.data.deletedCount} global messages`);
      loadMessages();
      loadStats();
    } catch (error) {
      console.error('Error deleting global messages:', error);
      toast.error('Failed to delete global messages');
    }
  };
  
  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete group "${groupName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/api/admin/groups/${groupId}`, { data: adminCredentials });
      toast.success('Group deleted successfully');
      loadGroups();
      loadStats();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };
  
  // Filter functions
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );
  
  const filteredMessages = messages.filter(message =>
    message.content?.toLowerCase().includes(messageSearch.toLowerCase()) ||
    message.sender?.username?.toLowerCase().includes(messageSearch.toLowerCase()) ||
    message.sender?.displayName?.toLowerCase().includes(messageSearch.toLowerCase())
  );
  
  // Show loading if admin credentials are not loaded yet
  if (!adminCredentials) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  
  const tabs = [
    { id: 'stats', label: 'Statistics', icon: FaChartBar },
    { id: 'users', label: 'Users', icon: FaUsers },
    { id: 'messages', label: 'Messages', icon: FaComments },
    { id: 'groups', label: 'Groups', icon: FaUserFriends },
    { id: 'admins', label: 'Admin Management', icon: FaUserCog }
  ];
  
  // Show loading screen while checking authorization
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <FaShieldAlt className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            جاري التحقق من الصلاحيات...
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  // If user is not authorized, show error message
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <FaExclamationTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            غير مصرح لك
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            ليس لديك صلاحية للوصول إلى لوحة الإدارة. يجب أن تكون مديراً أو مشرفاً للوصول إلى هذه الصفحة.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-300"
          >
            العودة للصفحة الرئيسية
          </button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-page">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Super Admin Control Panel - Handle with care!
          </p>
        </motion.div>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'users') loadUsers();
                if (tab.id === 'messages') loadMessages();
                if (tab.id === 'groups') loadGroups();
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  System Statistics
                </h2>
                <button
                  onClick={loadStats}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaRedo className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
              
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FaUsers className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Users</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {stats.totalUsers}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FaComments className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">Messages</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {stats.totalMessages}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FaUserFriends className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Groups</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                      {stats.totalGroups}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FaGlobe className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Global</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                      {stats.globalMessages}
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FaEnvelope className="w-5 h-5 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Private</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                      {stats.privateMessages}
                    </p>
                  </div>
                  
                  <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FaUserFriends className="w-5 h-5 text-pink-600" />
                      <span className="text-sm font-medium text-pink-800 dark:text-pink-200">Group Msgs</span>
                    </div>
                    <p className="text-2xl font-bold text-pink-900 dark:text-pink-100 mt-1">
                      {stats.groupMessages}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Recent Users
                  </h3>
                  <div className="space-y-2">
                    {recentUsers.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Recent Messages
                  </h3>
                  <div className="space-y-2">
                    {recentMessages.map((message) => (
                      <div key={message._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {message.sender?.displayName || message.sender?.username}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {message.chatType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  User Management
                </h2>
                <button
                  onClick={loadUsers}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaRedo className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Joined</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.displayName || user.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{user.username}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteUser(user._id, user.displayName || user.username)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Message Management
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDeleteAllGlobalMessages}
                    className="flex items-center space-x-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTrash className="w-4 h-4" />
                    <span>Delete All Global</span>
                  </button>
                  <button
                    onClick={loadMessages}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaRedo className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <select
                  value={chatTypeFilter}
                  onChange={(e) => setChatTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="global">Global</option>
                  <option value="private">Private</option>
                  <option value="group">Group</option>
                </select>
              </div>
              
              <div className="space-y-3">
                {filteredMessages.map((message) => (
                  <div key={message._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {message.sender?.displayName || message.sender?.username}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                          {message.chatType}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete Message"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {message.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'admins' && (
            <AdminManagement adminCredentials={adminCredentials} />
          )}
          
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Group Management
                </h2>
                <button
                  onClick={loadGroups}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaRedo className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
              
              <div className="grid gap-4">
                {groups.map((group) => (
                  <div key={group._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Admin: {group.admin?.displayName || group.admin?.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {group.members?.length || 0} members • Created {new Date(group.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteGroup(group._id, group.name)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Group"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
