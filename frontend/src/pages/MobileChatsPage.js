import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  FaSearch, 
  FaPlus, 
  FaUsers, 
  FaUserPlus, 
  FaComments,
  FaArrowLeft,
  FaEllipsisV,
  FaCircle,
  FaGlobe
} from 'react-icons/fa';
import Navigation from '../components/Navigation';

const MobileChatsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newUserQuery, setNewUserQuery] = useState('');
  
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
      
        // Fetch private conversations
        const privateResponse = await fetch('/api/conversations/private', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        let privateChats = [];
        if (privateResponse.ok) {
          const privateData = await privateResponse.json();
          privateChats = privateData.map(chat => ({
            id: chat._id,
            type: 'private',
            name: chat.otherUser.displayName || chat.otherUser.username,
            avatar: chat.otherUser.avatar || `https://ui-avatars.com/api/?name=${chat.otherUser.username}&background=3b82f6&color=fff`,
            lastMessage: chat.lastMessage?.content || 'No messages yet',
            lastMessageTime: chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt) : new Date(),
            unreadCount: chat.unreadCount || 0,
            isOnline: onlineUsers.includes(chat.otherUser._id),
            status: chat.otherUser.status || 'Available',
            userId: chat.otherUser._id
          }));
        }

        // Fetch group conversations
        const groupResponse = await fetch('/api/conversations/groups', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        let groupChats = [];
        if (groupResponse.ok) {
          const groupData = await groupResponse.json();
          groupChats = groupData.map(chat => ({
            id: chat._id,
            type: 'group',
            name: chat.name,
            avatar: chat.avatar || `https://ui-avatars.com/api/?name=${chat.name}&background=6366f1&color=fff`,
            lastMessage: chat.lastMessage?.content || 'No messages yet',
            lastMessageTime: chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt) : new Date(),
            unreadCount: chat.unreadCount || 0,
            isOnline: false,
            status: 'Group chat',
            members: chat.members?.length || 0,
            groupId: chat._id
          }));
        }

        const allConversations = [...privateChats, ...groupChats]
          .filter(conv => conv.userId !== user._id) // إزالة الشات مع النفس
          .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        
        setConversations(allConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user, onlineUsers]);

  // Search users with smart suggestions
  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&smart=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const users = await response.json();
        // Filter out current user and sort by relevance
        const filteredUsers = users
          .filter(u => u._id !== user._id)
          .sort((a, b) => {
            // Prioritize exact matches
            const aExact = a.username.toLowerCase().startsWith(query.toLowerCase()) || 
                          a.displayName?.toLowerCase().startsWith(query.toLowerCase());
            const bExact = b.username.toLowerCase().startsWith(query.toLowerCase()) || 
                          b.displayName?.toLowerCase().startsWith(query.toLowerCase());
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Then by display name similarity
            const aDisplay = a.displayName?.toLowerCase() || '';
            const bDisplay = b.displayName?.toLowerCase() || '';
            const aUsername = a.username.toLowerCase();
            const bUsername = b.username.toLowerCase();
            
            const aScore = aDisplay.includes(query.toLowerCase()) ? 1 : 0;
            const bScore = bDisplay.includes(query.toLowerCase()) ? 1 : 0;
            
            return bScore - aScore;
          });
        
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Create group
  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          members: selectedUsers.map(u => u._id)
        })
      });

      if (response.ok) {
        setShowGroupCreate(false);
        setGroupName('');
        setGroupDescription('');
        setSelectedUsers([]);
        // Refresh conversations
        window.location.reload();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Start private chat
  const startPrivateChat = async (userId) => {
    try {
      // For now, just navigate directly to the chat with the userId
      // The chat page will handle loading the messages
      navigate(`/mobile-chat/${userId}`);
      setShowUserSearch(false);
    } catch (error) {
      console.error('Error starting private chat:', error);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `${minutes}د`;
    if (hours < 24) return `${hours}س`;
    if (days < 7) return `${days}أ`;
    return date.toLocaleDateString('ar-EG');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900">
      <Navigation user={user} />
      
      {/* Modern Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl border-b border-gray-200/30 dark:border-gray-700/30 sticky top-0 z-40">
        <div className="px-6 py-5">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-blue-100 dark:ring-blue-900/30">
                <span className="text-white font-bold text-xl">
                  {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 shadow-lg"></div>
              </div>
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  المحادثات
              </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {conversations.length} محادثة نشطة
              </p>
            </div>
          </div>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <button 
                onClick={() => navigate('/global-chat')}
                className="p-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:rotate-3"
                title="الشات العالمي"
              >
                <FaGlobe size={18} />
              </button>
            <button 
                onClick={() => setShowUserSearch(true)}
                className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:rotate-3"
                title="إضافة مستخدم"
            >
                <FaUserPlus size={18} />
            </button>
            <button 
                onClick={() => setShowGroupCreate(true)}
                className="p-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:rotate-3"
                title="إنشاء مجموعة"
            >
                <FaUsers size={18} />
            </button>
          </div>
        </div>
            </div>

        {/* Modern Search Bar */}
        <div className="px-6 pb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <div className="relative">
              <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
            <input
              type="text"
                placeholder="🔍 ابحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-4 border-0 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            />
            </div>
              </div>
            </div>
                      </div>
                      
      {/* Conversations List */}
      <div className="overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 pb-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <p className="text-gray-500 dark:text-gray-400">جاري التحميل...</p>
                      </div>
                    </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 pb-20">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaComments className="text-blue-500 dark:text-blue-400" size={32} />
              </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد محادثات بعد'}
          </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery ? 'جرب كلمات مختلفة للبحث' : 'ابدأ محادثة جديدة مع أصدقائك'}
            </p>
            {!searchQuery && (
                <button
                onClick={() => setShowUserSearch(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                ابدأ محادثة جديدة
              </button>
            )}
          </div>
        ) : (
          <div className="px-6 py-4 pb-20 space-y-4">
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/mobile-chat/${conversation.userId || conversation.groupId || conversation.id}`)}
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:scale-[1.02]"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="relative group/avatar">
                      <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-xl ring-4 ring-white/50 dark:ring-gray-700/50 group-hover/avatar:ring-blue-200 dark:group-hover/avatar:ring-blue-800 transition-all duration-300">
                        <img
                          src={conversation.avatar}
                          alt={conversation.name}
                          className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-300"
                        />
                      </div>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-white dark:border-gray-800 shadow-lg animate-pulse"></div>
                      )}
                      {conversation.type === 'group' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
                          <FaUsers className="text-white" size={10} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {conversation.name}
                        </h3>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              {conversation.status}
                            </p>
                            {conversation.type === 'group' && (
                              <span className="text-xs text-purple-500 font-medium bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                                مجموعة
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 rtl:space-y-reverse">
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full font-medium">
                            {formatTime(conversation.lastMessageTime)}
                            </span>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full px-3 py-1 min-w-[24px] text-center font-bold shadow-lg animate-bounce">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors duration-200">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                  </div>
                </motion.div>
              ))}
            </div>
        )}
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white dark:bg-gray-800 w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  إضافة مستخدم
                </h2>
                <button
                  onClick={() => setShowUserSearch(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FaArrowLeft size={20} />
                </button>
              </div>

              <div className="relative mb-4">
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن المستخدمين... (حرفين على الأقل)"
                  value={newUserQuery}
                  onChange={(e) => {
                    setNewUserQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {newUserQuery.length > 0 && newUserQuery.length < 2 && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-orange-500">أدخل حرفين على الأقل</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {searchResults.length === 0 && newUserQuery.length >= 2 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaSearch className="text-gray-400" size={20} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      لم يتم العثور على مستخدمين مطابقين
                    </p>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <motion.div
                    key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.98 }}
                    onClick={() => startPrivateChat(user._id)}
                      className="flex items-center space-x-3 rtl:space-x-reverse p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-all duration-200 border border-gray-100 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md"
                  >
                      <div className="relative">
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=3b82f6&color=fff`}
                      alt={user.username}
                          className="w-12 h-12 rounded-full object-cover shadow-md"
                        />
                        {onlineUsers.includes(user._id) && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.displayName || user.username}
              </h3>
                          {onlineUsers.includes(user._id) && (
                            <span className="text-xs text-green-500 font-medium">متصل</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                        {user.status && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1">
                            {user.status}
                          </p>
                        )}
                    </div>
                      <div className="text-gray-400">
                        <FaCircle size={8} />
                  </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Create Modal */}
      <AnimatePresence>
        {showGroupCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white dark:bg-gray-800 w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  إنشاء مجموعة
                </h2>
                <button
                  onClick={() => setShowGroupCreate(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FaArrowLeft size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اسم المجموعة
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل اسم المجموعة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وصف المجموعة (اختياري)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="أدخل وصف المجموعة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    إضافة أعضاء
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ابحث عن المستخدمين... (حرفين على الأقل)"
                      onChange={(e) => searchUsers(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FaSearch className="text-gray-400" size={16} />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ابحث عن المستخدمين لإضافتهم للمجموعة
                        </p>
                      </div>
                    ) : (
                      searchResults.map((user) => (
                        <motion.div
                        key={user._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (selectedUsers.find(u => u._id === user._id)) {
                            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
                          } else {
                            setSelectedUsers([...selectedUsers, user]);
                          }
                        }}
                          className={`flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                          selectedUsers.find(u => u._id === user._id)
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 shadow-md'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-700'
                        }`}
                      >
                          <div className="relative">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=3b82f6&color=fff`}
                          alt={user.username}
                              className="w-10 h-10 rounded-full object-cover shadow-sm"
                            />
                            {onlineUsers.includes(user._id) && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user.displayName || user.username}
                          </h3>
                              {onlineUsers.includes(user._id) && (
                                <span className="text-xs text-green-500 font-medium">متصل</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              @{user.username}
                            </p>
                        </div>
                          {selectedUsers.find(u => u._id === user._id) ? (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-white text-xs font-bold">✓</span>
            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                          )}
                        </motion.div>
                      ))
          )}
      </div>
                </div>

                <button
                  onClick={createGroup}
                  disabled={!groupName.trim() || selectedUsers.length === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  إنشاء المجموعة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileChatsPage;
