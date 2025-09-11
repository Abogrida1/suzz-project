import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Courier, OrderStatus, OrderWithDetails } from '@/lib/types'
import { ShoppingCart, Clock, User, Phone, Truck } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { ActionButton, NoPermissionMessage } from './PermissionWrapper'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface OrdersPageProps {
  userRole?: string
  user?: any
  permissions?: {
    canView: (page: string) => boolean
    canEdit: (page: string) => boolean
    canDelete: (page: string) => boolean
    canAdd: (page: string) => boolean
  }
}

const OrdersPage: React.FC<OrdersPageProps> = ({ userRole = 'staff', user, permissions }) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const queryClient = useQueryClient()

  // Fetch orders with details
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', selectedStatus],
    queryFn: async () => {
      // First get orders
      let ordersQuery = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedStatus !== 'all') {
        ordersQuery = ordersQuery.eq('status', selectedStatus)
      }

      const { data: ordersData, error: ordersError } = await ordersQuery
      if (ordersError) {
        console.error('Orders query error:', ordersError)
        throw ordersError
      }

      // Get related data
      const [usersData, restaurantsData, couriersData] = await Promise.all([
        supabase.from('users').select('id, name'),
        supabase.from('restaurants').select('id, name'),
        supabase.from('couriers').select('id, name, phone')
      ])

      // Combine data
      const ordersWithDetails = ordersData?.map((order: any) => ({
        ...order,
        users: usersData.data?.find((u: any) => u.id === order.user_id) || null,
        restaurants: restaurantsData.data?.find((r: any) => r.id === order.restaurant_id) || null,
        couriers: couriersData.data?.find((c: any) => c.id === order.courier_id) || null,
      })) || []

      return ordersWithDetails as OrderWithDetails[]
    },
  })

  // Fetch available couriers
  const { data: availableCouriers } = useQuery({
    queryKey: ['available-couriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('couriers')
        .select('*')
        .eq('status', 'available')
        .order('name')

      if (error) throw error
      return data as Courier[]
    },
  })

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('تم تحديث حالة الطلب بنجاح')
    },
    onError: (error: any) => {
      toast.error('حدث خطأ في تحديث حالة الطلب')
      console.error(error)
    },
  })

  // Assign courier
  const assignCourierMutation = useMutation({
    mutationFn: async ({ orderId, courierId }: { orderId: string; courierId: string }) => {
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('assignCourier', {
        body: { orderId, courierId }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['available-couriers'] })
      toast.success('تم تعيين المندوب بنجاح')
      setShowAssignModal(false)
      setSelectedOrder(null)
    },
    onError: (error: any) => {
      toast.error('حدث خطأ في تعيين المندوب')
      console.error(error)
    },
  })

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status })
  }

  const handleAssignCourier = (order: OrderWithDetails) => {
    setSelectedOrder(order)
    setShowAssignModal(true)
  }

  const getStatusText = (status: OrderStatus): string => {
    const statusMap: Record<OrderStatus, string> = {
      pending: 'في الانتظار',
      accepted: 'مقبول',
      preparing: 'يتم التحضير',
      assigned: 'تم التعيين',
      out_for_delivery: 'في الطريق',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
    }
    return statusMap[status]
  }

  const getStatusColor = (status: OrderStatus): string => {
    const colorMap: Record<OrderStatus, string> = {
      pending: 'status-pending',
      accepted: 'status-accepted',
      preparing: 'status-preparing',
      assigned: 'status-assigned',
      out_for_delivery: 'status-out-for-delivery',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
    }
    return colorMap[status]
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
        حدث خطأ في تحميل الطلبات: {(error as Error).message}
      </div>
    )
  }

  // Calculate statistics
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'pending').length || 0,
    preparing: orders?.filter((o: any) => o.status === 'preparing').length || 0,
    outForDelivery: orders?.filter((o: any) => o.status === 'out_for_delivery').length || 0,
    delivered: orders?.filter((o: any) => o.status === 'delivered').length || 0,
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
        <p className="mt-1 text-sm text-gray-500">
          عرض وإدارة جميع الطلبات وتعيين المناديب
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">إجمالي الطلبات</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">في الانتظار</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">يتم التحضير</p>
              <p className="text-2xl font-bold text-gray-900">{stats.preparing}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">في الطريق</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outForDelivery}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">تم التوصيل</p>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs - فقط للمسموح لهم بالتعديل */}
      {permissions?.canEdit('orders') && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { key: 'all', label: 'الكل' },
                { key: 'pending', label: 'في الانتظار' },
                { key: 'accepted', label: 'مقبول' },
                { key: 'preparing', label: 'يتم التحضير' },
                { key: 'assigned', label: 'تم التعيين' },
                { key: 'out_for_delivery', label: 'في الطريق' },
                { key: 'delivered', label: 'تم التوصيل' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key as OrderStatus | 'all')}
                  className={`${
                    selectedStatus === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          {orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الطلب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المطعم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المندوب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    {permissions?.canEdit('orders') && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 ml-2" />
                          <div className="text-sm text-gray-900">
                            {order.users?.name || 'غير معروف'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.restaurants?.name || 'غير معروف'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.total_price.toFixed(2)} ج.م
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {permissions?.canEdit('orders') ? (
                          // المسموح لهم بالتعديل يقدروا يعدلوا الحالة
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${getStatusColor(order.status)}`}
                          >
                            <option value="pending">في الانتظار</option>
                            <option value="accepted">مقبول</option>
                            <option value="preparing">يتم التحضير</option>
                            <option value="assigned">تم التعيين</option>
                            <option value="out_for_delivery">في الطريق</option>
                            <option value="delivered">تم التوصيل</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        ) : (
                          // الباقي يشوف الحالة بس بدون تعديل
                          <span className={`text-xs font-medium rounded-full px-2 py-1 ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.couriers ? (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 ml-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.couriers.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.couriers.phone}
                              </div>
                            </div>
                          </div>
                        ) : permissions?.canEdit('orders') ? (
                          <button
                            onClick={() => handleAssignCourier(order)}
                            className="text-sm text-primary-600 hover:text-primary-900 disabled:text-gray-400"
                            disabled={!['accepted', 'preparing'].includes(order.status)}
                          >
                            تعيين مندوب
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">غير مسموح</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </div>
                      </td>
                      {permissions?.canEdit('orders') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {/* Show order details */}}
                            className="text-primary-600 hover:text-primary-900 text-sm"
                          >
                            عرض التفاصيل
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد طلبات
              </h3>
              <p className="text-gray-500">
                {selectedStatus === 'all' 
                  ? 'لم يتم تسجيل أي طلبات بعد'
                  : `لا توجد طلبات بحالة "${getStatusText(selectedStatus as OrderStatus)}"`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Courier Modal */}
      {showAssignModal && selectedOrder && (
        <AssignCourierModal
          order={selectedOrder}
          couriers={availableCouriers || []}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedOrder(null)
          }}
          onAssign={(courierId) => {
            assignCourierMutation.mutate({
              orderId: selectedOrder.id,
              courierId
            })
          }}
          isLoading={assignCourierMutation.isPending}
        />
      )}
    </div>
  )
}

// Assign Courier Modal Component
interface AssignCourierModalProps {
  order: OrderWithDetails
  couriers: Courier[]
  onClose: () => void
  onAssign: (courierId: string) => void
  isLoading: boolean
}

const AssignCourierModal: React.FC<AssignCourierModalProps> = ({ 
  order, 
  couriers, 
  onClose, 
  onAssign, 
  isLoading 
}) => {
  const [selectedCourierId, setSelectedCourierId] = useState('')

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (selectedCourierId) {
      onAssign(selectedCourierId)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            تعيين مندوب للطلب #{order.id.slice(0, 8).toUpperCase()}
          </h3>
          
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>العميل:</strong> {order.users?.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>المطعم:</strong> {order.restaurants?.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>المبلغ:</strong> {order.total_price.toFixed(2)} ج.م
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر المندوب
              </label>
              {couriers.length > 0 ? (
                <select
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">اختر مندوب...</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.name} - {courier.phone}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  لا يوجد مناديب متاحين حالياً
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading || !selectedCourierId || couriers.length === 0}
                className="flex-1 btn-primary"
              >
                {isLoading ? 'جاري التعيين...' : 'تعيين المندوب'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OrdersPage