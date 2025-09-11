'use client'

import { useState, useEffect } from 'react'
import { User } from '@/lib/supabaseClient'
import { usePermissions } from '@/hooks/usePermissions'
import Sidebar from './Sidebar'
import Header from './Header'
import DashboardHome from './DashboardHome'
import RestaurantsPage from './RestaurantsPage'
import MenuItemsPage from './MenuItemsPage'
// تم إزالة PermissionsDebugger
import OrdersPage from './OrdersPage'
import CouponsPage from './CouponsPage'
import UsersPage from './UsersPage'
import CouriersPage from './CouriersPage'
import StaffManagementPageUpdated from './StaffManagementPageUpdated'
import ReportsPage from './ReportsPage'
import MessagingPage from './MessagingPage'

interface DashboardProps {
  user: User
}

export type ActivePage = 
  | 'dashboard' 
  | 'restaurants' 
  | 'menu-items' 
  | 'orders' 
  | 'coupons' 
  | 'users' 
  | 'couriers'
  | 'staff'
  | 'messaging'
  | 'reports'

export default function Dashboard({ user }: DashboardProps) {
  // تحديد دور المستخدم
  const userRole = typeof user.role === 'object' ? user.role?.name : user.role || 'staff'
  
  // جلب الصلاحيات الحقيقية من قاعدة البيانات
  const { 
    permissions, 
    loading: permissionsLoading, 
    canView, 
    canEdit, 
    canDelete, 
    canAdd,
    getAllowedPages 
  } = usePermissions(userRole, user.id, user.email)
  
  // تعيين الصفحة الافتراضية حسب الصلاحيات الفعلية
  const allowedPages = getAllowedPages()
  console.log('🔍 Dashboard - User role:', userRole)
  console.log('🔍 Dashboard - User email:', user.email)
  console.log('🔍 Dashboard - Permissions loading:', permissionsLoading)
  console.log('🔍 Dashboard - Raw permissions object:', permissions)
  console.log('🔍 Dashboard - Final allowed pages:', allowedPages)
  
  // تحقق إضافي من صلاحية menu-items
  const canViewMenuItems = canView('menu-items')
  console.log('🔍 Dashboard - Can view menu-items:', canViewMenuItems)
  console.log('🔍 Dashboard - menu-items permission details:', permissions['menu-items'])
  
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // تحديث الصفحة النشطة عند تحميل الصلاحيات
  useEffect(() => {
    if (!permissionsLoading && allowedPages.length > 0) {
      // إذا الصفحة الحالية مش مسموحة، اختار أول صفحة مسموحة
      if (!allowedPages.includes(activePage)) {
        setActivePage(allowedPages[0])
      }
    }
  }, [permissionsLoading, allowedPages, activePage])
  
  // دالة لتغيير الصفحة مع التحقق من الصلاحيات الفعلية
  const handlePageChange = (page: ActivePage) => {
    if (canView(page)) {
      setActivePage(page)
    }
  }

  // عرض loading إذا الصلاحيات لسة بتتحمل
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الصلاحيات...</p>
        </div>
      </div>
    )
  }

  const renderActivePage = () => {
    // تمرير الصلاحيات الفعلية لجميع المكونات
    const commonProps = {
      userRole,
      user,
      permissions: {
        canView: (page: string) => canView(page as ActivePage),
        canEdit: (page: string) => canEdit(page as ActivePage),
        canDelete: (page: string) => canDelete(page as ActivePage),
        canAdd: (page: string) => canAdd(page as ActivePage),
      },
    }
    
    // التحقق من الصلاحية قبل عرض الصفحة
    if (!canView(activePage)) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ليس لديك صلاحية الوصول
          </h3>
          <p className="text-gray-500">
            ليس لديك صلاحية لعرض هذه الصفحة
          </p>
        </div>
      )
    }
    
    switch (activePage) {
      case 'dashboard':
        return <DashboardHome onOpenReports={() => handlePageChange('reports')} />
      case 'restaurants':
        return <RestaurantsPage {...commonProps} />
      case 'menu-items':
        return <MenuItemsPage {...commonProps} />
      case 'orders':
        return <OrdersPage {...commonProps} />
      case 'coupons':
        return <CouponsPage />
      case 'users':
        return <UsersPage {...commonProps} />
      case 'couriers':
        return <CouriersPage />
      case 'staff':
        return <StaffManagementPageUpdated />
      case 'messaging':
        return <MessagingPage />
      case 'reports':
        return <ReportsPage />
      default:
        return <DashboardHome />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={handlePageChange}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        allowedPages={allowedPages}
      />

      {/* Main Content - Modern Responsive Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
        {/* Compact Topbar (account chip + logout) */}
        <div className="sticky top-0 z-50 flex items-center justify-between bg-white/90 backdrop-blur-md border-b px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
          <button
            type="button"
            className="p-2 text-gray-600 lg:hidden rounded-xl hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="open sidebar"
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-2.5 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">
                  {user.name || 'المدير'}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-[160px]">
                  {(typeof user.role === 'object' ? (user.role as any)?.display_name_ar : user.role) || 'مدير'}
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  const staffUser = localStorage.getItem('staff_user')
                  if (staffUser) {
                    const userData = JSON.parse(staffUser)
                    if (userData.login_type === 'staff') {
                      localStorage.removeItem('staff_user')
                    } else {
                      const { error } = await (await import('@/lib/supabaseClient')).supabase.auth.signOut()
                      if (error) throw error
                      localStorage.removeItem('staff_user')
                    }
                  } else {
                    const { error } = await (await import('@/lib/supabaseClient')).supabase.auth.signOut()
                    if (error) throw error
                  }
                  window.location.reload()
                } catch (e) {
                  console.error(e)
                }
              }}
              className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl px-3 py-1.5"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
        
        {/* Enhanced Main Content Area */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto">
          <div className="max-w-full">
            {/* Modern Content Container */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
              {renderActivePage()}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
