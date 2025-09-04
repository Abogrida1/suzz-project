import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { 
  FaSearch, 
  FaPlus, 
  FaUsers, 
  FaUserPlus, 
  FaComments,
  FaArrowLeft,
  FaEllipsisV,
  FaCircle,
  FaPaperPlane,
  FaSmile,
  FaImage,
  FaPaperclip
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ChatLayout = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();

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

        const allConversations = [...privateChats, ...groupChats].sort((a, b) =>
          new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
        
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
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">
                  {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  المحادثات
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {conversations.length} محادثة
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <FaUserPlus size={16} />
              </button>
              <button className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <FaUsers size={16} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border-0 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaComments className="text-blue-500 dark:text-blue-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد محادثات بعد'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'جرب كلمات مختلفة للبحث' : 'ابدأ محادثة جديدة مع أصدقائك'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChat(conversation)}
                  className={`mb-2 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedChat?.id === conversation.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md">
                        <img
                          src={conversation.avatar}
                          alt={conversation.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-semibold truncate ${
                          selectedChat?.id === conversation.id ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>
                          {conversation.name}
                        </h3>
                        <span className={`text-xs ${
                          selectedChat?.id === conversation.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate flex-1 ${
                          selectedChat?.id === conversation.id ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {conversation.lastMessage}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full px-2 py-1 min-w-[18px] text-center font-medium shadow-sm ml-2">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
                      <img
                        src={selectedChat.avatar}
                        alt={selectedChat.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selectedChat.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedChat.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChat.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200">
                    <FaEllipsisV size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaComments className="text-blue-500 dark:text-blue-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ابدأ المحادثة
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  ابدأ المحادثة مع {selectedChat.name}!
                </p>
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 p-4">
              <div className="flex items-end space-x-3 rtl:space-x-reverse">
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200">
                  <FaSmile size={18} />
                </button>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all duration-200">
                  <FaImage size={18} />
                </button>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-all duration-200">
                  <FaPaperclip size={18} />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالة..."
                    className="w-full px-4 py-3 text-sm border-0 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 resize-none shadow-sm transition-all duration-200"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  disabled={!newMessage.trim()}
                  className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 ${
                    newMessage.trim() 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FaPaperPlane size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaComments className="text-blue-500 dark:text-blue-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                مرحباً بك في المحادثات
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                اختر محادثة من القائمة الجانبية لبدء المحادثة
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
