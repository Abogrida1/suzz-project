'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Restaurant } from '@/lib/supabaseClient'
import { Building2, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

interface RestaurantsPageProps {
  userRole?: string
  user?: any
  permissions?: {
    canView: (page: string) => boolean
    canEdit: (page: string) => boolean
    canDelete: (page: string) => boolean
    canAdd: (page: string) => boolean
  }
}

export default function RestaurantsPage({ userRole = 'staff', user, permissions }: RestaurantsPageProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)
  const queryClient = useQueryClient()

  // Fetch restaurants
  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Restaurant[]
    },
  })

  // Toggle restaurant active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('restaurants')
        .update({ active })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      toast.success('تم تحديث حالة المطعم بنجاح')
    },
    onError: (error) => {
      toast.error('حدث خطأ في تحديث حالة المطعم')
      console.error(error)
    },
  })

  // Delete restaurant
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      toast.success('تم حذف المطعم بنجاح')
    },
    onError: (error) => {
      toast.error('حدث خطأ في حذف المطعم')
      console.error(error)
    },
  })

  const handleToggleActive = (restaurant: Restaurant) => {
    toggleActiveMutation.mutate({
      id: restaurant.id,
      active: !restaurant.active,
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المطعم؟')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingRestaurant(null)
    setShowModal(true)
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
        حدث خطأ في تحميل المطاعم: {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Restaurants Management
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            Manage partner restaurants and cloud kitchens
          </p>
        </div>
        <div className="flex-shrink-0">
          {permissions?.canAdd('restaurants') && (
            <button
              onClick={handleAdd}
              className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="whitespace-nowrap">Add Restaurant</span>
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">إجمالي المطاعم</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">المطاعم النشطة</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants?.filter(r => r.active).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">المطابخ السحابية</p>
              <p className="text-2xl font-bold text-gray-900">
                {restaurants?.filter(r => r.is_cloud_kitchen).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          {restaurants && restaurants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      اسم المطعم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العنوان
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النوع
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التقييم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  {(permissions?.canEdit('restaurants') || permissions?.canDelete('restaurants')) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {restaurants.map((restaurant) => (
                    <tr key={restaurant.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {restaurant.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {restaurant.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          restaurant.is_cloud_kitchen
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {restaurant.is_cloud_kitchen ? 'مطبخ سحابي' : 'مطعم شريك'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">
                            {restaurant.rating.toFixed(1)}
                          </span>
                          <span className="text-yellow-400 mr-1">★</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {permissions?.canEdit('restaurants') ? (
                          <button
                            onClick={() => handleToggleActive(restaurant)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              restaurant.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {restaurant.active ? (
                              <>
                                <Eye className="h-3 w-3 ml-1" />
                                نشط
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 ml-1" />
                                غير نشط
                              </>
                            )}
                          </button>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            restaurant.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {restaurant.active ? (
                              <>
                                <Eye className="h-3 w-3 ml-1" />
                                نشط
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 ml-1" />
                                غير نشط
                              </>
                            )}
                          </span>
                        )}
                      </td>
                      {(permissions?.canEdit('restaurants') || permissions?.canDelete('restaurants')) && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {permissions?.canEdit('restaurants') && (
                              <button
                                onClick={() => handleEdit(restaurant)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {permissions?.canDelete('restaurants') && (
                              <button
                                onClick={() => handleDelete(restaurant.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد مطاعم
              </h3>
              <p className="text-gray-500 mb-4">
                ابدأ بإضافة أول مطعم إلى المنصة
              </p>
              <button
                onClick={handleAdd}
                className="btn-primary"
              >
                إضافة مطعم جديد
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <RestaurantModal
          restaurant={editingRestaurant}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            queryClient.invalidateQueries({ queryKey: ['restaurants'] })
          }}
        />
      )}
    </div>
  )
}

// Restaurant Modal Component
interface RestaurantModalProps {
  restaurant: Restaurant | null
  onClose: () => void
  onSuccess: () => void
}

function RestaurantModal({ restaurant, onClose, onSuccess }: RestaurantModalProps) {
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    address: restaurant?.address || '',
    open_hours: restaurant?.open_hours || '8:00 AM - 11:00 PM',
    is_cloud_kitchen: restaurant?.is_cloud_kitchen || false,
    rating: restaurant?.rating || 4.5,
    active: restaurant?.active ?? true,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (restaurant) {
        // Update existing restaurant
        const { error } = await supabase
          .from('restaurants')
          .update(formData)
          .eq('id', restaurant.id)

        if (error) throw error
        toast.success('تم تحديث المطعم بنجاح')
      } else {
        // Create new restaurant
        const { error } = await supabase
          .from('restaurants')
          .insert([{
            ...formData,
            owner_id: '00000000-0000-0000-0000-000000000001', // Default admin
            delivery_zones: ['وسط البلد', 'الحكمة', 'الصاغة'],
            images: [],
          }])

        if (error) throw error
        toast.success('تم إضافة المطعم بنجاح')
      }

      onSuccess()
    } catch (error) {
      toast.error('حدث خطأ في حفظ المطعم')
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
            {restaurant ? 'تعديل المطعم' : 'إضافة مطعم جديد'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المطعم
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="أدخل اسم المطعم"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العنوان
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field"
                placeholder="أدخل عنوان المطعم"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ساعات العمل
              </label>
              <input
                type="text"
                required
                value={formData.open_hours}
                onChange={(e) => setFormData({ ...formData, open_hours: e.target.value })}
                className="input-field"
                placeholder="8:00 AM - 11:00 PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التقييم
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                className="input-field"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_cloud_kitchen"
                checked={formData.is_cloud_kitchen}
                onChange={(e) => setFormData({ ...formData, is_cloud_kitchen: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_cloud_kitchen" className="mr-2 block text-sm text-gray-900">
                مطبخ سحابي
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="mr-2 block text-sm text-gray-900">
                نشط
              </label>
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