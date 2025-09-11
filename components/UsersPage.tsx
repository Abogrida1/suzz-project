'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, User } from '@/lib/supabaseClient'
import { Users, Phone, Mail, Calendar, Filter } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

type UserRole = 'customer' | 'restaurant_owner' | 'admin'

interface UsersPageProps {
  userRole?: string
  user?: any
  permissions?: {
    canView: (page: string) => boolean
    canEdit: (page: string) => boolean
    canDelete: (page: string) => boolean
    canAdd: (page: string) => boolean
  }
}

export default function UsersPage({ userRole = 'staff', user, permissions }: UsersPageProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users', selectedRole],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedRole !== 'all') {
        query = query.eq('role', selectedRole)
      }

      const { data, error } = await query
      if (error) throw error
      return data as User[]
    },
  })

  // Filter users by search term
  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || []

  const getRoleText = (role: UserRole): string => {
    const roleMap: { [key in UserRole]: string } = {
      customer: 'عميل',
      restaurant_owner: 'صاحب مطعم',
      admin: 'مدير',
    }
    return roleMap[role]
  }

  const handleBanUser = async (userId: string, userName: string, userRole: UserRole, currentStatus: boolean) => {
    // منع حظر الأدمن
    if (userRole === 'admin') {
      alert('❌ لا يمكن حظر المديرين!')
      return
    }

    // منع المستخدم من حظر نفسه
    if (userId === user?.id) {
      alert('❌ لا يمكنك حظر نفسك!')
      return
    }

    const action = currentStatus ? 'إلغاء حظر' : 'حظر'
    if (!confirm(`هل أنت متأكد من ${action} المستخدم "${userName}"؟`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_banned: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      // إعادة تحميل البيانات
      window.location.reload()
      
    } catch (error: any) {
      console.error('Error updating user ban status:', error)
      alert('حدث خطأ أثناء تحديث حالة المستخدم: ' + error.message)
    }
  }

  const getRoleColor = (role: UserRole): string => {
    const colorMap: { [key in UserRole]: string } = {
      customer: 'bg-blue-100 text-blue-800',
      restaurant_owner: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800',
    }
    return colorMap[role]
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        حدث خطأ في تحميل المستخدمين: {error.message}
      </div>
    )
  }

  // Calculate statistics
  const stats = {
    total: users?.length || 0,
    customers: users?.filter(u => u.role === 'customer').length || 0,
    restaurantOwners: users?.filter(u => u.role === 'restaurant_owner').length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Ultra Modern Header */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 border border-blue-100 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
                <Users className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  إدارة المستخدمين
                </h1>
                <p className="text-gray-600 text-xl mt-2">
                  عرض وإدارة العملاء وأصحاب المطاعم والمديرين
                </p>
              </div>
            </div>
            
            {/* Live Stats Bar */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all">
                <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-lg font-bold text-gray-700">إجمالي: {users?.length || 0}</span>
              </div>
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all">
                <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-lg font-bold text-gray-700">العملاء: {stats.customers}</span>
              </div>
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all">
                <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-lg font-bold text-gray-700">المطاعم: {stats.restaurantOwners}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">العملاء</p>
              <p className="text-2xl font-bold text-gray-900">{stats.customers}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">أصحاب المطاعم</p>
              <p className="text-2xl font-bold text-gray-900">{stats.restaurantOwners}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">المديرين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="البحث بالاسم أو الهاتف أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pr-10"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Role Filter */}
        <div className="sm:w-48">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
            className="input-field"
          >
            <option value="all">جميع الأدوار</option>
            <option value="customer">العملاء</option>
            <option value="restaurant_owner">أصحاب المطاعم</option>
            <option value="admin">المديرين</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          {filteredUsers.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-500">
                عرض {filteredUsers.length} من أصل {users?.length || 0} مستخدم
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الاسم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الهاتف
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        البريد الإلكتروني
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الدور
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ التسجيل
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      {permissions?.canEdit('users') && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((tableUser) => (
                      <tr key={tableUser.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {tableUser.name.charAt(0)}
                              </span>
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-medium text-gray-900">
                                {tableUser.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 ml-2" />
                            <div className="text-sm text-gray-900" dir="ltr">
                              {tableUser.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {tableUser.email ? (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-400 ml-2" />
                              <div className="text-sm text-gray-900">
                                {tableUser.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">غير محدد</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(tableUser.role)}`}>
                            {getRoleText(tableUser.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 ml-2" />
                            <div className="text-sm text-gray-500">
                              {format(new Date(tableUser.created_at), 'dd/MM/yyyy', { locale: ar })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tableUser.is_banned 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {tableUser.is_banned ? '🚫 محظور' : '✅ نشط'}
                          </span>
                        </td>
                        {permissions?.canEdit('users') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {/* منع حظر الأدمن أو المستخدم الحالي */}
                            {tableUser.role !== 'admin' && tableUser.id !== user?.id && (
                              <button
                                onClick={() => handleBanUser(tableUser.id, tableUser.name, tableUser.role, tableUser.is_banned || false)}
                                className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                                  tableUser.is_banned
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                } transition-colors`}
                              >
                                {tableUser.is_banned ? 'إلغاء الحظر' : 'حظر المستخدم'}
                              </button>
                            )}
                            {/* رسالة للأدمن */}
                            {tableUser.role === 'admin' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                                👑 مدير محمي
                              </span>
                            )}
                            {/* رسالة للمستخدم الحالي */}
                            {tableUser.id === user?.id && (
                              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                                👤 هذا أنت
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedRole !== 'all' 
                  ? 'لا توجد نتائج' 
                  : 'لا يوجد مستخدمين'
                }
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedRole !== 'all'
                  ? 'جرب تغيير معايير البحث أو التصفية'
                  : 'سيظهر المستخدمون هنا بعد التسجيل في التطبيق'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Activity Summary */}
      {users && users.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              التسجيلات الأخيرة
            </h3>
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 text-sm font-medium">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="mr-3">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getRoleText(user.role)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(user.created_at), 'dd/MM', { locale: ar })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              إحصائيات سريعة
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">المستخدمين النشطين:</span>
                <span className="text-sm font-medium text-gray-900">{stats.customers + stats.restaurantOwners}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">لديهم بريد إلكتروني:</span>
                <span className="text-sm font-medium text-gray-900">
                  {users.filter(u => u.email).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">التسجيلات هذا الشهر:</span>
                <span className="text-sm font-medium text-gray-900">
                  {users.filter(u => {
                    const userDate = new Date(u.created_at)
                    const now = new Date()
                    return userDate.getMonth() === now.getMonth() && 
                           userDate.getFullYear() === now.getFullYear()
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}