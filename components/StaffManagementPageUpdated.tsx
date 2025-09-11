'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon,
  ShieldCheckIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon,
  LockClosedIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
// Password hashing will be handled server-side
// Using crypto for client-side password handling

interface PermissionType {
  id: string
  name: string
  display_name_ar: string
  description_ar: string
  category: string
}

interface StaffPermission {
  id: string
  staff_id: string
  permission_name: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

interface Staff {
  id: string
  name: string
  email: string
  password_hash?: string
  role_id: string
  is_active: boolean
  last_login?: string
  created_at: string
  role?: {
    id: string
    name: string
    display_name_ar: string
  }
  permissions?: StaffPermission[]
}

interface Role {
  id: string
  name: string
  display_name_ar: string
  description: string
}

interface StaffFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role_id: string
  is_active: boolean
}

export default function StaffManagementPageUpdated() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissionTypes, setPermissionTypes] = useState<PermissionType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedStaffPermissions, setSelectedStaffPermissions] = useState<StaffPermission[]>([])
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role_id: '',
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // تحميل الموظفين
      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select(`
          *,
          role:staff_roles(id, name, display_name_ar)
        `)
        .order('created_at', { ascending: false })

      if (staffError) throw staffError
      setStaff(staffData || [])

      // تحميل الأدوار
      const { data: rolesData, error: rolesError } = await supabase
        .from('staff_roles')
        .select('*')
        .order('name')

      if (rolesError) throw rolesError
      setRoles(rolesData || [])

      // تحميل أنواع الصلاحيات
      const { data: permissionTypesData, error: permissionTypesError } = await supabase
        .from('permission_types')
        .select('*')
        .order('category', { ascending: true })

      if (permissionTypesError) throw permissionTypesError
      setPermissionTypes(permissionTypesData || [])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert('كلمتا المرور غير متطابقتان')
      return
    }

    if (formData.password.length < 8) {
      alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }

    try {
      // تشفير كلمة المرور سيتم على الخادم
      const hashedPassword = formData.password // سيتم التشفير على الخادم

      const { error } = await supabase
        .from('staff_members')
        .insert({
          name: formData.name,
          email: formData.email,
          password_hash: hashedPassword,
          role_id: formData.role_id,
          is_active: formData.is_active
        })

      if (error) throw error

      // إضافة صلاحيات افتراضية للموظف الجديد
      const { data: newStaff } = await supabase
        .from('staff_members')
        .select('id, role_id')
        .eq('email', formData.email)
        .single()

      if (newStaff) {
        // إضافة صلاحية dashboard افتراضية
        await supabase
          .from('staff_permissions')
          .insert({
            role_id: newStaff.role_id,
            page_name: 'dashboard',
            can_view: true,
            can_create: false,
            can_edit: false,
            can_delete: false
          })
      }

      setShowAddModal(false)
      resetForm()
      loadData()
      toast.success('تم إضافة الموظف بنجاح! يمكنك الآن تعديل صلاحياته.')
    } catch (error: any) {
      console.error('Error adding staff:', error)
      alert('حدث خطأ أثناء إضافة الموظف: ' + error.message)
    }
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStaff) return

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role_id: formData.role_id,
        is_active: formData.is_active
      }

      // إذا تم إدخال كلمة مرور جديدة
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          alert('كلمتا المرور غير متطابقتان')
          return
        }
        if (formData.password.length < 8) {
          alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
          return
        }
        updateData.password_hash = formData.password // سيتم التشفير على الخادم
      }

      const { error } = await supabase
        .from('staff_members')
        .update(updateData)
        .eq('id', selectedStaff.id)

      if (error) throw error

      setShowAddModal(false)
      setSelectedStaff(null)
      resetForm()
      loadData()
      alert('تم تحديث بيانات الموظف بنجاح!')
    } catch (error: any) {
      console.error('Error updating staff:', error)
      alert('حدث خطأ أثناء تحديث الموظف: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role_id: '',
      is_active: true
    })
  }

  const handleToggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .update({ is_active: !currentStatus })
        .eq('id', staffId)

      if (error) throw error
      loadData()
    } catch (error: any) {
      console.error('Error updating staff status:', error)
      alert('حدث خطأ أثناء تحديث حالة الموظف')
    }
  }

  const loadStaffPermissions = async (staffId: string) => {
    try {
      console.log('🔍 Loading permissions for staff:', staffId)
      
      // البحث عن الموظف للحصول على role_id
      const { data: staffMember, error: staffError } = await supabase
        .from('staff_members')
        .select('role_id, name, email')
        .eq('id', staffId)
        .single()

      if (staffError) {
        console.error('❌ Error fetching staff member:', staffError)
        throw staffError
      }

      console.log('👤 Staff member found:', staffMember)

      // تحميل الصلاحيات حسب الدور
      const { data, error } = await supabase
        .from('staff_permissions')
        .select('*')
        .eq('role_id', staffMember.role_id)

      if (error) {
        console.error('❌ Error fetching permissions:', error)
        throw error
      }

      console.log('🔑 Raw permissions data:', data)

      // تحويل البيانات للشكل المطلوب
      const formattedPermissions = (data || []).map((perm: any) => ({
        id: perm.id,
        staff_id: staffId, // نحتفظ بـ staff_id للواجهة
        permission_name: perm.page_name,
        can_view: perm.can_view || false,
        can_create: perm.can_create || false, // إضافة can_create
        can_edit: perm.can_edit || false,
        can_delete: perm.can_delete || false
      }))

      console.log('✅ Formatted permissions:', formattedPermissions)
      return formattedPermissions
    } catch (error) {
      console.error('💥 Error loading staff permissions:', error)
      toast.error('حدث خطأ في تحميل الصلاحيات!')
      return []
    }
  }

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الموظف "${staffName}"؟ سيتم حذف جميع صلاحياته أيضاً.`)) {
      return
    }

    try {
      // حذف صلاحيات الموظف أولاً
      const { data: staffMember } = await supabase
        .from('staff_members')
        .select('role_id')
        .eq('id', staffId)
        .single()

      if (staffMember) {
        await supabase
          .from('staff_permissions')
          .delete()
          .eq('role_id', staffMember.role_id)
      }

      // حذف الموظف
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', staffId)

      if (error) throw error

      loadData()
      toast.success('تم حذف الموظف بنجاح!')
    } catch (error: any) {
      console.error('Error deleting staff:', error)
      toast.error('حدث خطأ أثناء حذف الموظف: ' + error.message)
    }
  }

  const showStaffPermissions = async (staff: Staff) => {
    setSelectedStaff(staff)
    const permissions = await loadStaffPermissions(staff.id)
    setSelectedStaffPermissions(permissions)
    setShowPermissionsModal(true)
  }

  const updateStaffPermission = async (
    staffId: string, 
    permissionName: string, 
    actionType: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ) => {
    try {
      // البحث عن الموظف للحصول على role_id
      const { data: staffMember, error: staffError } = await supabase
        .from('staff_members')
        .select('role_id')
        .eq('id', staffId)
        .single()

      if (staffError) throw staffError

      // الحصول على الصلاحية الحالية أولاً
      const { data: existingPermission } = await supabase
        .from('staff_permissions')
        .select('*')
        .eq('role_id', staffMember.role_id)
        .eq('page_name', permissionName)
        .single()

      // إعداد البيانات للتحديث مع إضافة can_create
      const updateData: any = {
        role_id: staffMember.role_id,
        page_name: permissionName,
        can_view: existingPermission?.can_view || (actionType === 'can_view' ? value : true),
        can_create: existingPermission?.can_create || false,
        can_edit: existingPermission?.can_edit || false,
        can_delete: existingPermission?.can_delete || false
      }

      // تحديث الصلاحية المحددة
      updateData[actionType] = value

      console.log('🔄 تحديث الصلاحية:', { permissionName, actionType, value, updateData })

      const { data: result, error } = await supabase
        .from('staff_permissions')
        .upsert(updateData, {
          onConflict: 'role_id,page_name',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error('❌ خطأ في حفظ الصلاحية:', error)
        throw error
      }
      
      console.log('✅ تم حفظ الصلاحية بنجاح:', result)
      
      // تحديث الحالة المحلية
      setSelectedStaffPermissions(prev => {
        const existing = prev.find(p => p.permission_name === permissionName)
        if (existing) {
          return prev.map(p => 
            p.permission_name === permissionName 
              ? { ...p, [actionType]: value }
              : p
          )
        } else {
          return [...prev, {
            id: '',
            staff_id: staffId,
            permission_name: permissionName,
            can_view: actionType === 'can_view' ? value : false,
            can_create: actionType === 'can_create' ? value : false,
            can_edit: actionType === 'can_edit' ? value : false,
            can_delete: actionType === 'can_delete' ? value : false
          }]
        }
      })
      
      // إعادة تحميل الصلاحيات للتأكد من التحديث
      await loadStaffPermissions(staffId)
      
      // إشعار بالنجاح
      toast.success(`✅ تم تحديث صلاحية "${actionType}" لصفحة "${permissionName}" بنجاح!`)
    } catch (error: any) {
      console.error('❌ خطأ شامل في تحديث الصلاحية:', error)
      toast.error(`حدث خطأ: ${error.message}`)
    }
  }

  const getPermissionValue = (permissionName: string, actionType: string): boolean => {
    const permission = selectedStaffPermissions.find(p => p.permission_name === permissionName)
    return permission ? (permission as any)[actionType] : false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // تجميع الصلاحيات حسب الفئة
  const permissionsByCategory = permissionTypes.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, PermissionType[]>)

  // Ensure reports permission appears in UI if permission_types table missing it
  if (!permissionsByCategory['analytics']) {
    permissionsByCategory['analytics'] = []
  }
  const hasReportsPermission = permissionsByCategory['analytics'].some(p => p.name === 'reports')
  if (!hasReportsPermission) {
    permissionsByCategory['analytics'].push({
      id: 'virtual-reports',
      name: 'reports',
      display_name_ar: 'التقارير',
      description_ar: 'الوصول إلى صفحة التقارير التفصيلية',
      category: 'analytics'
    })
  }

  const categoryNames: Record<string, string> = {
    'general': 'عام',
    'management': 'الإدارة',
    'operations': 'العمليات',
    'marketing': 'التسويق',
    'communication': 'التواصل',
    'admin': 'الإدارة العليا',
    'analytics': 'التحليلات'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 animate-fadeIn">
      {/* Ultra Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/90 via-blue-50/90 to-purple-50/90 backdrop-blur-xl rounded-3xl p-8 mb-8 shadow-2xl border border-white/20">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-300">
                  <UserGroupIcon className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <div>
                <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  إدارة الموظفين
                </h1>
                <p className="text-xl text-gray-600 font-medium">
                  إدارة الموظفين وصلاحياتهم في النظام بشكل متطور ⚡
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <PlusIcon className="h-6 w-6 ml-2 relative z-10" />
              <span className="relative z-10">إضافة موظف جديد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="group bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <UserGroupIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{staff.length}</p>
              <p className="text-sm text-gray-600 font-medium">إجمالي الموظفين</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white/90 to-emerald-50/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{staff.filter(s => s.is_active).length}</p>
              <p className="text-sm text-gray-600 font-medium">موظفين نشطين</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full animate-pulse" style={{width: `${staff.length > 0 ? (staff.filter(s => s.is_active).length / staff.length) * 100 : 0}%`}}></div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{roles.length}</p>
              <p className="text-sm text-gray-600 font-medium">الأدوار المتاحة</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-white/90 to-indigo-50/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{permissionTypes.length}</p>
              <p className="text-sm text-gray-600 font-medium">أنواع الصلاحيات</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Ultra Modern Staff Table */}
      <div className="bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/20">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            قائمة الموظفين المتطورة
          </h2>
          <p className="text-gray-600 mt-1">إدارة شاملة لجميع الموظفين والصلاحيات</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm">
              <tr>
                <th className="px-8 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                  👤 الموظف
                </th>
                <th className="px-8 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                  🎭 الدور
                </th>
                <th className="px-8 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                  ⏰ آخر دخول
                </th>
                <th className="px-8 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                  📊 الحالة
                </th>
                <th className="px-8 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                  ⚡ الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-gradient-to-br from-white/50 to-blue-50/30 backdrop-blur-sm divide-y divide-white/20">
              {staff.map((member, index) => (
                <tr 
                  key={member.id} 
                  className="group hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-purple-50/60 hover:scale-[1.01] transition-all duration-300 hover:shadow-lg animate-slideInRight"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <span className="text-white font-bold text-lg">
                            {member.name?.charAt(0)?.toUpperCase() || 'M'}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {member.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span>📧</span>
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 shadow-md group-hover:scale-105 transition-transform">
                       {member.role?.display_name_ar || 'غير محدد'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.last_login 
                      ? new Date(member.last_login).toLocaleDateString('ar-EG')
                      : 'لم يسجل دخول بعد'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStaffStatus(member.id, member.is_active)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors`}
                    >
                      {member.is_active ? (
                        <>
                          <CheckCircleIcon className="w-3 h-3 ml-1" />
                          نشط
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-3 h-3 ml-1" />
                          غير نشط
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                    <button
                      onClick={() => showStaffPermissions(member)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="إدارة الصلاحيات"
                    >
                      <ShieldCheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStaff(member)
                        setFormData({
                          name: member.name,
                          email: member.email,
                          password: '',
                          confirmPassword: '',
                          role_id: member.role_id,
                          is_active: member.is_active
                        })
                        setShowAddModal(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                      title="تعديل"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.id, member.name)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      title="حذف"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {selectedStaff ? 'تعديل موظف' : 'إضافة موظف جديد'}
            </h3>
            <form onSubmit={selectedStaff ? handleUpdateStaff : handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل الاسم الكامل"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="example@greebite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور {selectedStaff && '(اتركها فارغة إذا لم ترد تغييرها)'}
                </label>
                <input
                  type="password"
                  required={!selectedStaff}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="8 أحرف على الأقل"
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  required={!selectedStaff || formData.password.length > 0}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أعد إدخال كلمة المرور"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الدور
                </label>
                <select
                  required
                  value={formData.role_id}
                  onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">اختر الدور</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.display_name_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="mr-2 block text-sm text-gray-900">
                  حساب نشط
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedStaff(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {selectedStaff ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                إدارة صلاحيات: {selectedStaff.name}
              </h3>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-medium text-gray-900">{categoryNames[category] || category}</h4>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-medium text-gray-900">{permission.display_name_ar}</div>
                              <div className="text-sm text-gray-500">{permission.description_ar}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { key: 'can_view', label: 'عرض', color: 'blue' },
                              { key: 'can_create', label: 'إنشاء', color: 'green' },
                              { key: 'can_edit', label: 'تعديل', color: 'yellow' },
                              { key: 'can_delete', label: 'حذف', color: 'red' }
                            ].map(({ key, label, color }) => (
                              <div key={key} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`${permission.name}_${key}`}
                                  checked={getPermissionValue(permission.name, key)}
                                  onChange={(e) => updateStaffPermission(
                                    selectedStaff.id, 
                                    permission.name, 
                                    key as any, 
                                    e.target.checked
                                  )}
                                  className={`h-4 w-4 text-${color}-600 focus:ring-${color}-500 border-gray-300 rounded`}
                                />
                                <label 
                                  htmlFor={`${permission.name}_${key}`} 
                                  className="mr-2 block text-sm text-gray-900"
                                >
                                  {label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

