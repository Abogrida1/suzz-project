'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, MenuItem, Restaurant } from '@/lib/supabaseClient'
import { Package, Plus, Edit, Trash2, Eye, EyeOff, Heart, DollarSign } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'

interface MenuItemsPageProps {
  userRole?: string
  user?: any
  permissions?: {
    canView: (page: string) => boolean
    canEdit: (page: string) => boolean
    canDelete: (page: string) => boolean
    canAdd: (page: string) => boolean
  }
}

export default function MenuItemsPage({ userRole = 'staff', user, permissions }: MenuItemsPageProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const queryClient = useQueryClient()

  // Fetch restaurants for filter
  const { data: restaurants } = useQuery({
    queryKey: ['restaurants-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('active', true)
        .order('name')

      if (error) throw error
      return data as Pick<Restaurant, 'id' | 'name'>[]
    },
  })

  // Fetch menu items
  const { data: menuItems, isLoading, error } = useQuery({
    queryKey: ['menu-items', selectedRestaurant, selectedCategory],
    queryFn: async () => {
      // First get menu items
      let menuQuery = supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedRestaurant !== 'all') {
        menuQuery = menuQuery.eq('restaurant_id', selectedRestaurant)
      }

      if (selectedCategory !== 'all') {
        menuQuery = menuQuery.eq('category', selectedCategory)
      }

      const { data: menuData, error: menuError } = await menuQuery
      if (menuError) {
        console.error('Menu items query error:', menuError)
        throw menuError
      }

      // Get restaurants data separately
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('id, name')

      // Combine data
      const menuWithRestaurants = menuData?.map((item: any) => ({
        ...item,
        restaurants: restaurantsData?.find((r: any) => r.id === item.restaurant_id) || null,
      })) || []

      return menuWithRestaurants as (MenuItem & { restaurants: { name: string } | null })[]
    },
  })

  // Toggle item active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({ active })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('تم تحديث حالة العنصر بنجاح')
    },
    onError: (error) => {
      toast.error('حدث خطأ في تحديث حالة العنصر')
      console.error(error)
    },
  })

  // Delete menu item
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('تم حذف العنصر بنجاح')
    },
    onError: (error) => {
      toast.error('حدث خطأ في حذف العنصر')
      console.error(error)
    },
  })

  const handleToggleActive = (item: MenuItem & { restaurants: { name: string } | null }) => {
    toggleActiveMutation.mutate({
      id: item.id,
      active: !item.active,
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (item: MenuItem & { restaurants: { name: string } | null }) => {
    setEditingItem(item)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
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
        حدث خطأ في تحميل عناصر القائمة: {error.message}
      </div>
    )
  }

  // Get unique categories
  const categories = Array.from(new Set(menuItems?.map(item => item.category) || []))

  // Calculate statistics
  const stats = {
    total: menuItems?.length || 0,
    active: menuItems?.filter(item => item.active).length || 0,
    healthy: menuItems?.filter(item => item.is_healthy).length || 0,
    avgPrice: menuItems?.length ? 
      (menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length).toFixed(2) : '0',
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة عناصر القائمة</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة الوجبات والمشروبات في قوائم المطاعم
          </p>
        </div>
        {permissions?.canAdd('menu-items') && (
          <button
            onClick={handleAdd}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            إضافة عنصر جديد
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">إجمالي العناصر</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">العناصر النشطة</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">الوجبات الصحية</p>
              <p className="text-2xl font-bold text-gray-900">{stats.healthy}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-500">متوسط السعر</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgPrice} ج.م</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="sm:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            المطعم
          </label>
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="input-field"
          >
            <option value="all">جميع المطاعم</option>
            {restaurants?.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الفئة
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">جميع الفئات</option>
            {categories.map((category: string) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          {menuItems && menuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Item Image */}
                  <div className="h-48 bg-gray-200 relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.active ? (
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
                    </div>

                    {/* Healthy Badge */}
                    {item.is_healthy && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Heart className="h-3 w-3 ml-1" />
                          صحي
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="text-lg font-bold text-primary-600">
                        {item.price.toFixed(2)} ج.م
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-2">
                      {item.restaurants?.name || 'غير معروف'}
                    </p>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {item.category}
                      </span>
                      {item.calories && (
                        <span>{item.calories} سعرة</span>
                      )}
                    </div>

                    {/* Actions */}
                    {(permissions?.canEdit('menu-items') || permissions?.canDelete('menu-items')) && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {permissions?.canEdit('menu-items') && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {permissions?.canDelete('menu-items') && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد عناصر في القائمة
              </h3>
              <p className="text-gray-500 mb-4">
                {selectedRestaurant !== 'all' || selectedCategory !== 'all'
                  ? 'لا توجد عناصر تطابق المعايير المحددة'
                  : 'ابدأ بإضافة عناصر إلى قوائم المطاعم'
                }
              </p>
              {permissions?.canAdd('menu-items') && (
                <button
                  onClick={handleAdd}
                  className="btn-primary"
                >
                  إضافة عنصر جديد
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <MenuItemModal
          item={editingItem}
          restaurants={restaurants || []}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            queryClient.invalidateQueries({ queryKey: ['menu-items'] })
          }}
        />
      )}
    </div>
  )
}

// Menu Item Modal Component
interface MenuItemModalProps {
  item: MenuItem | null
  restaurants: Pick<Restaurant, 'id' | 'name'>[]
  onClose: () => void
  onSuccess: () => void
}

function MenuItemModal({ item, restaurants, onClose, onSuccess }: MenuItemModalProps) {
  const [formData, setFormData] = useState({
    restaurant_id: item?.restaurant_id || (restaurants[0]?.id || ''),
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || '',
    calories: item?.calories || undefined,
    is_healthy: item?.is_healthy || false,
    image_url: item?.image_url || '',
    active: item?.active ?? true,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const itemData = {
        ...formData,
        calories: formData.calories || null,
        image_url: formData.image_url || null,
      }

      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', item.id)

        if (error) throw error
        toast.success('تم تحديث العنصر بنجاح')
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData])

        if (error) throw error
        toast.success('تم إضافة العنصر بنجاح')
      }

      onSuccess()
    } catch (error) {
      toast.error('حدث خطأ في حفظ العنصر')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {item ? 'تعديل عنصر القائمة' : 'إضافة عنصر جديد'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المطعم
                </label>
                <select
                  required
                  value={formData.restaurant_id}
                  onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">اختر المطعم</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم العنصر
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="أدخل اسم العنصر"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الوصف
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                placeholder="أدخل وصف العنصر"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السعر (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الفئة
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  placeholder="مثل: أطباق رئيسية، مشروبات"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السعرات (اختياري)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.calories || ''}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="input-field"
                  placeholder="السعرات الحرارية"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رابط الصورة (اختياري)
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="input-field"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_healthy"
                  checked={formData.is_healthy}
                  onChange={(e) => setFormData({ ...formData, is_healthy: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_healthy" className="mr-2 block text-sm text-gray-900">
                  وجبة صحية
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