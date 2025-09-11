'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { 
  Building2, 
  ShoppingCart, 
  DollarSign, 
  Users,
  TrendingUp,
  Clock,
  Star,
  Activity,
  Calendar,
  BarChart3
} from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface DashboardStats {
  totalRestaurants: number
  activeRestaurants: number
  totalOrders: number
  todayOrders: number
  totalRevenue: number
  todayRevenue: number
  totalUsers: number
  pendingOrders: number
}

interface DashboardHomeProps {
  onOpenReports?: () => void
}

export default function DashboardHome({ onOpenReports }: DashboardHomeProps) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Get restaurant stats
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('active')
      
      const totalRestaurants = restaurants?.length || 0
      const activeRestaurants = restaurants?.filter(r => r.active).length || 0

      // Get order stats
      const { data: orders } = await supabase
        .from('orders')
        .select('total_price, created_at, status')

      const totalOrders = orders?.length || 0
      const todayOrders = orders?.filter(o => 
        new Date(o.created_at) >= today
      ).length || 0

      const totalRevenue = orders?.reduce((sum, order) => 
        sum + (order.total_price || 0), 0
      ) || 0

      const todayRevenue = orders?.filter(o => 
        new Date(o.created_at) >= today
      ).reduce((sum, order) => 
        sum + (order.total_price || 0), 0
      ) || 0

      const pendingOrders = orders?.filter(o => 
        o.status === 'pending'
      ).length || 0

      // Get user stats
      const { data: users } = await supabase
        .from('users')
        .select('role')
        .eq('role', 'customer')

      const totalUsers = users?.length || 0

      return {
        totalRestaurants,
        activeRestaurants,
        totalOrders,
        todayOrders,
        totalRevenue,
        todayRevenue,
        totalUsers,
        pendingOrders,
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      // Get recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total_price, status, created_at, user_id, restaurant_id')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!ordersData) return []

      // Get related data
      const [usersData, restaurantsData] = await Promise.all([
        supabase.from('users').select('id, name'),
        supabase.from('restaurants').select('id, name')
      ])

      // Combine data
      const ordersWithDetails = ordersData.map((order: any) => ({
        ...order,
        users: usersData.data?.find((u: any) => u.id === order.user_id) || null,
        restaurants: restaurantsData.data?.find((r: any) => r.id === order.restaurant_id) || null,
      }))

      return ordersWithDetails
    },
  })

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
        حدث خطأ في تحميل البيانات
      </div>
    )
  }

  const statCards = [
    {
      name: 'إجمالي المطاعم',
      stat: stats?.totalRestaurants.toString() || '0',
      substat: `${stats?.activeRestaurants || 0} نشط`,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'طلبات اليوم',
      stat: stats?.todayOrders.toString() || '0',
      substat: `من ${stats?.totalOrders || 0} إجمالي`,
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      name: 'إيرادات اليوم',
      stat: `${stats?.todayRevenue?.toFixed(2) || '0'} ج.م`,
      substat: `من ${stats?.totalRevenue?.toFixed(2) || '0'} ج.م إجمالي`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
    {
      name: 'إجمالي العملاء',
      stat: stats?.totalUsers.toString() || '0',
      substat: 'عميل مسجل',
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'طلبات معلقة',
      stat: stats?.pendingOrders.toString() || '0',
      substat: 'تحتاج موافقة',
      icon: Clock,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 animate-fadeIn">
      {/* Ultra Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/90 via-blue-50/90 to-purple-50/90 backdrop-blur-xl rounded-3xl p-8 mb-8 shadow-2xl border border-white/20">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-300">
                  <BarChart3 className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  لوحة التحكم
                </h1>
                <p className="text-xl text-gray-600 font-medium">
                  مرحباً بك في النظام الإداري المتطور
                </p>
              </div>
            </div>
            
            {/* Live Time & Date */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  {format(new Date(), 'EEEE، dd MMMM yyyy', { locale: ar })}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
                <Clock className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  {format(new Date(), 'HH:mm:ss')}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
                <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">النظام متصل</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button onClick={onOpenReports} className="group relative inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-2xl hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <TrendingUp className="h-5 w-5 ml-2 relative z-10" />
              <span className="relative z-10">تقرير مفصل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div
            key={card.name}
            className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${card.color} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">
                      {card.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {card.stat}
                      </p>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">
                  {card.substat}
                </p>
              </div>
              
              {/* Decorative Element */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            
            {/* Hover Effect Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="px-3 py-4 sm:px-6 sm:py-6">
          <h3 className="text-lg sm:text-xl leading-6 font-medium text-gray-900 mb-4">
            Recent Orders
          </h3>
          
          {ordersLoading ? (
            <LoadingSpinner />
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="responsive-table">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                        #{order.id.slice(0, 6)}
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                        {order.users?.name || 'Unknown'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                        <div className="truncate max-w-32 sm:max-w-none">
                          {order.restaurants?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900">
                        ${order.total_price.toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className={`status-${order.status.replace(/_/g, '-') } text-xs`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">
                        {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              لا توجد طلبات حديثة
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    pending: 'في الانتظار',
    accepted: 'مقبول',
    preparing: 'يتم التحضير',
    assigned: 'تم التعيين',
    'out_for_delivery': 'في الطريق',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
  }
  return statusMap[status] || status
}
