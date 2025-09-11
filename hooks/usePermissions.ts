'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabaseClient'
import { ActivePage } from '@/components/Dashboard'

interface DatabasePermission {
  id: string
  role_id: string
  page_name: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
}

interface UserPermissions {
  [page: string]: {
    can_view: boolean
    can_edit: boolean
    can_delete: boolean
  }
}

export function usePermissions(userRole: string, userId?: string, userEmail?: string) {
  const [permissions, setPermissions] = useState<UserPermissions>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // دالة لإعادة تحميل الصلاحيات (للاستدعاء من الخارج)
  const refreshPermissions = () => {
    loadUserPermissions()
  }

  useEffect(() => {
    loadUserPermissions()
  }, [userRole, userId])

  const loadUserPermissions = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Loading permissions for role:', userRole, 'userId:', userId, 'email:', userEmail)

      // إذا كان admin، يحصل على كل الصلاحيات
      if (userRole === 'admin') {
        console.log('✅ Admin detected - granting all permissions')
        const allPermissions: UserPermissions = {
          'dashboard': { can_view: true, can_edit: true, can_delete: true },
          'restaurants': { can_view: true, can_edit: true, can_delete: true },
          'menu-items': { can_view: true, can_edit: true, can_delete: true },
          'orders': { can_view: true, can_edit: true, can_delete: true },
          'coupons': { can_view: true, can_edit: true, can_delete: true },
          'users': { can_view: true, can_edit: true, can_delete: true },
          'couriers': { can_view: true, can_edit: true, can_delete: true },
          'staff': { can_view: true, can_edit: true, can_delete: true },
          'messaging': { can_view: true, can_edit: true, can_delete: true },
          'reports': { can_view: true, can_edit: true, can_delete: true }
        }
        setPermissions(allPermissions)
        setLoading(false)
        return
      }

      // للموظفين العاديين، جلب الصلاحيات من قاعدة البيانات
      console.log('🔍 Fetching permissions for staff with email:', userEmail)
      
      if (!userEmail) {
        console.error('❌ No email provided for staff member')
        throw new Error('البريد الإلكتروني مطلوب لجلب الصلاحيات')
      }

      // أولاً: جلب بيانات الموظف من staff_members
      const { data: staffMember, error: staffError } = await supabase
        .from('staff_members')
        .select(`
          id, 
          email, 
          role_id,
          staff_roles!inner(id, name, display_name_ar)
        `)
        .eq('email', userEmail)
        .single()

      if (staffError) {
        console.error('❌ Error fetching staff member:', staffError)
        console.log('⚠️ Staff member not found, using limited permissions')
        const limitedPermissions: UserPermissions = {
          'dashboard': { can_view: true, can_edit: false, can_delete: false }
        }
        setPermissions(limitedPermissions)
        setLoading(false)
        return
      }

      console.log('✅ Staff member found:', staffMember)
      const roleId = staffMember.role_id

      // ثانياً: جلب الصلاحيات من قاعدة البيانات
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('staff_permissions')
        .select('*')
        .eq('role_id', roleId)

      console.log('🔍 Permissions query result:', { permissionsData, permissionsError })

      if (permissionsError) {
        console.error('❌ Error fetching permissions:', permissionsError)
        throw new Error('خطأ في جلب الصلاحيات')
      }

      // تحويل البيانات للشكل المطلوب
      const userPermissions: UserPermissions = {}
      
      // إضافة الصلاحيات الموجودة في قاعدة البيانات
      if (permissionsData && permissionsData.length > 0) {
        console.log(`📋 Found ${permissionsData.length} permissions in database`)
        permissionsData.forEach((perm: DatabasePermission) => {
          console.log(`📋 Permission: ${perm.page_name} - View:${perm.can_view} Edit:${perm.can_edit} Delete:${perm.can_delete}`)
          userPermissions[perm.page_name] = {
            can_view: perm.can_view,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete
          }
        })
      } else {
        console.log('⚠️ No permissions found in database!')
        console.log('⚠️ This means the user will only see pages with can_view: false')
        console.log('⚠️ Make sure permissions are set correctly in staff_permissions table')
        
        // لا نعطي صلاحيات افتراضية - المستخدم يجب أن يحصل على ما هو محدد له فقط
      }

      console.log('✅ Final permissions loaded:', userPermissions)
      console.log('✅ Available pages:', Object.keys(userPermissions))
      
      // تحقق من أن المستخدم لديه صلاحيات
      const hasAnyPermissions = Object.keys(userPermissions).some(page => 
        userPermissions[page].can_view
      )
      
      if (!hasAnyPermissions) {
        console.log('⚠️ User has NO view permissions for any page!')
        console.log('⚠️ Check staff_permissions table for role_id:', roleId)
      }
      
      setPermissions(userPermissions)
    } catch (err: any) {
      console.error('Error loading permissions:', err)
      setError(err.message || 'خطأ في تحميل الصلاحيات')
    } finally {
      setLoading(false)
    }
  }

  // دوال مساعدة للتحقق من الصلاحيات
  const canView = (page: ActivePage): boolean => {
    return permissions[page]?.can_view || false
  }

  const canEdit = (page: ActivePage): boolean => {
    return permissions[page]?.can_edit || false
  }

  const canDelete = (page: ActivePage): boolean => {
    return permissions[page]?.can_delete || false
  }

  const canAdd = (page: ActivePage): boolean => {
    // إذا يقدر يعدل، يبقى يقدر يضيف
    return canEdit(page)
  }

  // جلب الصفحات المسموحة
  const getAllowedPages = (): ActivePage[] => {
    const allowed = Object.keys(permissions).filter(page => 
      permissions[page]?.can_view
    ) as ActivePage[]
    
    console.log('🔍 getAllowedPages - All permissions:', permissions)
    console.log('🔍 getAllowedPages - Allowed pages result:', allowed)
    
    return allowed
  }

  return {
    permissions,
    loading,
    error,
    canView,
    canEdit,
    canDelete,
    canAdd,
    getAllowedPages,
    refreshPermissions: loadUserPermissions
  }
}
