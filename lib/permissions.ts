// نظام الصلاحيات للموظفين
import { ActivePage } from '@/components/Dashboard'

export interface RolePermissions {
  [key: string]: ActivePage[]
}

// تحديد الصلاحيات لكل دور
export const ROLE_PERMISSIONS: RolePermissions = {
  // المدير العام - يرى كل شيء
  'admin': [
    'dashboard',
    'restaurants', 
    'menu-items',
    'orders',
    'coupons',
    'users',
    'couriers',
    'reports',
    'staff',
    'messaging'
  ],
  
  // مدير - يرى معظم الأشياء عدا إدارة الموظفين
  'manager': [
    'dashboard',
    'restaurants',
    'menu-items', 
    'orders',
    'coupons',
    'users',
    'couriers',
    'reports',
    'messaging'
  ],
  
  // مشرف - يرى الطلبات والمطاعم والقوائم
  'supervisor': [
    'dashboard',
    'restaurants',
    'menu-items',
    'orders',
    'reports',
    'messaging'
  ],
  
  // موظف عادي - يرى الطلبات فقط
  'staff': [
    'dashboard',
    'orders',
    'reports',
    'messaging'
  ],
  
  // دعم فني - يرى المستخدمين والرسائل
  'support': [
    'dashboard',
    'users',
    'reports',
    'messaging'
  ]
}

// دالة للتحقق من صلاحية الوصول لصفحة معينة
export function hasPermission(userRole: string, page: ActivePage): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(page)
}

// دالة للحصول على الصفحات المسموحة لدور معين
export function getAllowedPages(userRole: string): ActivePage[] {
  return ROLE_PERMISSIONS[userRole] || ['dashboard']
}

// دالة للحصول على أول صفحة مسموحة (للتوجيه التلقائي)
export function getDefaultPage(userRole: string): ActivePage {
  const allowedPages = getAllowedPages(userRole)
  return allowedPages[0] || 'dashboard'
}

// دالة للتحقق من صلاحيات التعديل والحذف
export function canEdit(userRole: string, page: ActivePage): boolean {
  // المدير العام والأدمن يقدروا يعدلوا كل حاجة
  if (userRole === 'admin' || userRole === 'manager') {
    return hasPermission(userRole, page)
  }
  
  // المشرف يقدر يعدل في المطاعم والقوائم والطلبات والرسائل
  if (userRole === 'supervisor') {
    return ['restaurants', 'menu-items', 'orders', 'messaging'].includes(page)
  }
  
  // الدعم الفني يقدر يعدل المستخدمين والرسائل
  if (userRole === 'support') {
    return ['users', 'messaging'].includes(page)
  }
  
  // الموظف العادي ما يقدرش يعدل حاجة
  return false
}

export function canDelete(userRole: string, page: ActivePage): boolean {
  // المدير العام والأدمن بس اللي يقدروا يحذفوا
  if (userRole === 'admin' || userRole === 'manager') {
    return hasPermission(userRole, page)
  }
  
  // باقي الأدوار ما تقدرش تحذف
  return false
}

export function canAdd(userRole: string, page: ActivePage): boolean {
  // نفس منطق التعديل
  return canEdit(userRole, page)
}

// أسماء الأدوار بالعربية
export const ROLE_DISPLAY_NAMES: { [key: string]: string } = {
  'admin': 'مدير عام',
  'manager': 'مدير', 
  'supervisor': 'مشرف',
  'staff': 'موظف',
  'support': 'دعم فني'
}
