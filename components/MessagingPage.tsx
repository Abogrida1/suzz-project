'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  PaperAirplaneIcon,
  SpeakerWaveIcon,
  UserIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  BellIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  user_metadata: {
    first_name?: string
    last_name?: string
    phone?: string
  }
}

interface Message {
  id: string
  title: string
  content: string
  message_type: 'info' | 'warning' | 'success' | 'error'
  is_broadcast: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  recipient_id?: string
  created_at: string
  is_read: boolean
}

interface MessageFormData {
  title: string
  content: string
  message_type: 'info' | 'warning' | 'success' | 'error'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  recipient_id: string
  is_broadcast: boolean
}

interface NotificationFormData {
  title: string
  body: string
  icon: string
  action_url: string
  recipient_id: string
  is_broadcast: boolean
}

export default function MessagingPage() {
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages')
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  
  const [messageForm, setMessageForm] = useState<MessageFormData>({
    title: '',
    content: '',
    message_type: 'info',
    priority: 'normal',
    recipient_id: '',
    is_broadcast: false
  })

  const [notificationForm, setNotificationForm] = useState<NotificationFormData>({
    title: '',
    body: '',
    icon: '',
    action_url: '',
    recipient_id: '',
    is_broadcast: false
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // تحميل المستخدمين من جدول users بدلاً من Admin API (للعميل)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, user_metadata')
        .order('created_at', { ascending: false })
        .limit(200)
      if (usersError) throw usersError
      setUsers((usersData as any) || [])

      // تحميل الرسائل
      const { data: messagesData, error: messagesError } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (messagesError) throw messagesError
      setMessages(messagesData || [])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const currentUser = await supabase.auth.getUser()
      if (!currentUser.data.user) throw new Error('غير مسموح')

      const messageData = {
        sender_id: currentUser.data.user.id,
        title: messageForm.title,
        content: messageForm.content,
        message_type: messageForm.message_type,
        priority: messageForm.priority,
        is_broadcast: messageForm.is_broadcast,
        ...(messageForm.is_broadcast ? {} : { recipient_id: messageForm.recipient_id })
      }

      const { error } = await supabase
        .from('admin_messages')
        .insert(messageData)

      if (error) throw error

      // إرسال إشعار مباشر عبر Supabase Realtime
      if (messageForm.is_broadcast) {
        await supabase.channel('broadcast_messages').send({
          type: 'broadcast',
          event: 'new_message',
          payload: messageData
        })
      } else {
        await supabase.channel(`user_${messageForm.recipient_id}`).send({
          type: 'broadcast',
          event: 'new_message',
          payload: messageData
        })
      }

      setShowMessageModal(false)
      setMessageForm({
        title: '',
        content: '',
        message_type: 'info',
        priority: 'normal',
        recipient_id: '',
        is_broadcast: false
      })
      loadData()
      alert('تم إرسال الرسالة بنجاح!')
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert('حدث خطأ أثناء إرسال الرسالة: ' + error.message)
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const currentUser = await supabase.auth.getUser()
      if (!currentUser.data.user) throw new Error('غير مسموح')

      const notificationData = {
        sender_id: currentUser.data.user.id,
        title: notificationForm.title,
        body: notificationForm.body,
        icon: notificationForm.icon,
        action_url: notificationForm.action_url,
        is_broadcast: notificationForm.is_broadcast,
        ...(notificationForm.is_broadcast ? {} : { recipient_id: notificationForm.recipient_id })
      }

      const { error } = await supabase
        .from('push_notifications')
        .insert(notificationData)

      if (error) throw error

      // هنا يمكن إضافة integration مع خدمة إشعارات مثل Firebase Cloud Messaging
      // لإرسال push notifications فعلية للأجهزة المحمولة

      setShowNotificationModal(false)
      setNotificationForm({
        title: '',
        body: '',
        icon: '',
        action_url: '',
        recipient_id: '',
        is_broadcast: false
      })
      alert('تم إرسال الإشعار بنجاح!')
    } catch (error: any) {
      console.error('Error sending notification:', error)
      alert('حدث خطأ أثناء إرسال الإشعار: ' + error.message)
    }
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-600" />
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الرسائل والإشعارات</h1>
          <p className="text-gray-600">إرسال رسائل وإشعارات مباشرة للمستخدمين</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowMessageModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            رسالة جديدة
          </button>
          <button
            onClick={() => setShowNotificationModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <BellIcon className="w-5 h-5" />
            إشعار جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              <p className="text-gray-600">إجمالي الرسائل</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <SpeakerWaveIcon className="w-8 h-8 text-green-600" />
            <div className="mr-4">
              <p className="text-2xl font-bold text-gray-900">
                {messages.filter(m => m.is_broadcast).length}
              </p>
              <p className="text-gray-600">رسائل جماعية</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UserIcon className="w-8 h-8 text-purple-600" />
            <div className="mr-4">
              <p className="text-2xl font-bold text-gray-900">
                {messages.filter(m => !m.is_broadcast).length}
              </p>
              <p className="text-gray-600">رسائل فردية</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UsersIcon className="w-8 h-8 text-orange-600" />
            <div className="mr-4">
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-gray-600">إجمالي المستخدمين</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            الرسائل المرسلة
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            الإشعارات المرسلة
          </button>
        </nav>
      </div>

      {/* Messages List */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">الرسائل المرسلة</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                لا توجد رسائل مرسلة حتى الآن
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getMessageIcon(message.message_type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{message.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                            {message.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{message.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {new Date(message.created_at).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            {message.is_broadcast ? (
                              <>
                                <SpeakerWaveIcon className="w-3 h-3" />
                                رسالة جماعية
                              </>
                            ) : (
                              <>
                                <UserIcon className="w-3 h-3" />
                                رسالة فردية
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">إرسال رسالة جديدة</h3>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عنوان الرسالة
                </label>
                <input
                  type="text"
                  required
                  value={messageForm.title}
                  onChange={(e) => setMessageForm({...messageForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل عنوان الرسالة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  محتوى الرسالة
                </label>
                <textarea
                  required
                  rows={4}
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل محتوى الرسالة"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع الرسالة
                  </label>
                  <select
                    value={messageForm.message_type}
                    onChange={(e) => setMessageForm({...messageForm, message_type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="info">معلومات</option>
                    <option value="success">نجاح</option>
                    <option value="warning">تحذير</option>
                    <option value="error">خطأ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الأولوية
                  </label>
                  <select
                    value={messageForm.priority}
                    onChange={(e) => setMessageForm({...messageForm, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">منخفضة</option>
                    <option value="normal">عادية</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={messageForm.is_broadcast}
                    onChange={(e) => setMessageForm({...messageForm, is_broadcast: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">إرسال لجميع المستخدمين</span>
                </label>
              </div>

              {!messageForm.is_broadcast && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المستخدم المستهدف
                  </label>
                  <select
                    required
                    value={messageForm.recipient_id}
                    onChange={(e) => setMessageForm({...messageForm, recipient_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر المستخدم</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.user_metadata?.first_name || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  إرسال الرسالة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">إرسال إشعار جديد</h3>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عنوان الإشعار
                </label>
                <input
                  type="text"
                  required
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل عنوان الإشعار"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  محتوى الإشعار
                </label>
                <textarea
                  required
                  rows={3}
                  value={notificationForm.body}
                  onChange={(e) => setNotificationForm({...notificationForm, body: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل محتوى الإشعار"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رابط الإجراء (اختياري)
                </label>
                <input
                  type="url"
                  value={notificationForm.action_url}
                  onChange={(e) => setNotificationForm({...notificationForm, action_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationForm.is_broadcast}
                    onChange={(e) => setNotificationForm({...notificationForm, is_broadcast: e.target.checked})}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">إرسال لجميع المستخدمين</span>
                </label>
              </div>

              {!notificationForm.is_broadcast && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المستخدم المستهدف
                  </label>
                  <select
                    required
                    value={notificationForm.recipient_id}
                    onChange={(e) => setNotificationForm({...notificationForm, recipient_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">اختر المستخدم</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.user_metadata?.first_name || user.email} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <BellIcon className="w-4 h-4" />
                  إرسال الإشعار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
