'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Courier } from '@/lib/supabaseClient'
import { Truck, Plus, Edit, Trash2, Phone, User, Clock } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

type CourierStatus = 'available' | 'busy' | 'offline'

export default function CouriersPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<CourierStatus | 'all'>('all')
  const queryClient = useQueryClient()

  // Fetch couriers
  const { data: couriers, isLoading, error } = useQuery({
    queryKey: ['couriers', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('couriers')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Courier[]
    },
  })

  // Update courier status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CourierStatus }) => {
      const { error } = await supabase
        .from('couriers')
        .update({ status })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couriers'] })
      toast.success('تم تحديث حالة المندوب بنجاح')
    },
    onError: (error) => {
      toast.error('حدث خطأ في تحديث حالة المندوب')
      console.error(error)
    },
  })

  // Delete courier
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('couriers')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couriers'] })
      toast.success('تم حذف المندوب بنجاح')
    },
    onError: (error) => {
      toast.error('حدث خطأ في حذف المندوب')
      console.error(error)
    },
  })

  const handleStatusChange = (courier: Courier, status: CourierStatus) => {
    updateStatusMutation.mutate({ id: courier.id, status })
  }

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المندوب؟')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (courier: Courier) => {
    setEditingCourier(courier)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingCourier(null)
    setShowModal(true)
  }

  const getStatusText = (status: CourierStatus): string => {
    const statusMap: { [key in CourierStatus]: string } = {
      available: 'متاح',
      busy: 'مشغول',
      offline: 'غير متصل',
    }
    return statusMap[status]
  }

  const getStatusColor = (status: CourierStatus): string => {
    const colorMap: { [key in CourierStatus]: string } = {
      available: 'courier-available',
      busy: 'courier-busy',
      offline: 'courier-offline',
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
        حدث خطأ في تحميل المناديب: {error.message}
      </div>
    )
  }

  // Calculate statistics
  const stats = {
    total: couriers?.length || 0,
    available: couriers?.filter(c => c.status === 'available').length || 0,
    busy: couriers?.filter(c => c.status === 'busy').length || 0,
    offline: couriers?.filter(c => c.status === 'offline').length || 0,
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المناديب</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة مناديب التوصيل وحالاتهم ومتابعة أدائهم
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          إضافة مندوب جديد
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">إجمالي المناديب</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Truck className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">متاحين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">مشغولين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.busy}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Truck className="h-6 w-6 text-gray-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">غير متصلين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.offline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'available', label: 'متاحين' },
              { key: 'busy', label: 'مشغولين' },
              { key: 'offline', label: 'غير متصلين' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key as CourierStatus | 'all')}
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

      {/* Couriers Table */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          {couriers && couriers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم المندوب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الهاتف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإضافة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {couriers.map((courier) => (
                    <tr key={courier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">
                              {courier.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 ml-2" />
                          <div className="text-sm text-gray-900" dir="ltr">
                            {courier.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={courier.status}
                          onChange={(e) => handleStatusChange(courier, e.target.value as CourierStatus)}
                          className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${getStatusColor(courier.status)}`}
                        >
                          <option value="available">متاح</option>
                          <option value="busy">مشغول</option>
                          <option value="offline">غير متصل</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(courier.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(courier)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(courier.id)}
                            className="text-red-600 hover:text-red-900"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedStatus === 'all' 
                  ? 'لا يوجد مناديب' 
                  : `لا يوجد مناديب ${getStatusText(selectedStatus as CourierStatus)}`
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {selectedStatus === 'all'
                  ? 'ابدأ بإضافة مناديب التوصيل للمنصة'
                  : `لا يوجد مناديب بحالة "${getStatusText(selectedStatus as CourierStatus)}" حالياً`
                }
              </p>
              {selectedStatus === 'all' && (
                <button
                  onClick={handleAdd}
                  className="btn-primary"
                >
                  إضافة مندوب جديد
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      {couriers && couriers.length > 0 && (
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            ملخص الأداء
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {((stats.available / stats.total) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">نسبة المتاحين</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {((stats.busy / stats.total) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">نسبة المشغولين</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {((stats.offline / stats.total) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">نسبة غير المتصلين</div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <CourierModal
          courier={editingCourier}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            queryClient.invalidateQueries({ queryKey: ['couriers'] })
          }}
        />
      )}
    </div>
  )
}

// Courier Modal Component
interface CourierModalProps {
  courier: Courier | null
  onClose: () => void
  onSuccess: () => void
}

function CourierModal({ courier, onClose, onSuccess }: CourierModalProps) {
  const [formData, setFormData] = useState({
    name: courier?.name || '',
    phone: courier?.phone || '',
    status: courier?.status || 'offline' as CourierStatus,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (courier) {
        // Update existing courier
        const { error } = await supabase
          .from('couriers')
          .update(formData)
          .eq('id', courier.id)

        if (error) throw error
        toast.success('تم تحديث المندوب بنجاح')
      } else {
        // Create new courier
        const { error } = await supabase
          .from('couriers')
          .insert([formData])

        if (error) throw error
        toast.success('تم إضافة المندوب بنجاح')
      }

      onSuccess()
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('رقم الهاتف موجود مسبقاً')
      } else {
        toast.error('حدث خطأ في حفظ المندوب')
      }
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {courier ? 'تعديل المندوب' : 'إضافة مندوب جديد'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المندوب
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="أدخل اسم المندوب"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رقم الهاتف
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="+20 123 456 7890"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CourierStatus })}
                className="input-field"
              >
                <option value="offline">غير متصل</option>
                <option value="available">متاح</option>
                <option value="busy">مشغول</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ'}
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