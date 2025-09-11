import React from 'react'
import { Menu, LogOut, User as UserIcon } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@/lib/types'
import toast from 'react-hot-toast'

interface HeaderProps {
  user: User
  setSidebarOpen: (open: boolean) => void
}

const Header: React.FC<HeaderProps> = ({ user, setSidebarOpen }) => {
  const handleSignOut = async () => {
    try {
      // Check if this is a staff user or admin
      const staffUser = localStorage.getItem('staff_user')
      
      if (staffUser) {
        const userData = JSON.parse(staffUser)
        
        if (userData.login_type === 'staff') {
          // Staff logout - just remove from localStorage
          localStorage.removeItem('staff_user')
          toast.success('تم تسجيل الخروج بنجاح')
        } else {
          // Admin logout - sign out from Supabase
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          localStorage.removeItem('staff_user')
          toast.success('تم تسجيل الخروج بنجاح')
        }
      } else {
        // Fallback - sign out from Supabase
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        toast.success('تم تسجيل الخروج بنجاح')
      }
      
      // Force reload to reset state
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      console.error('Error signing out:', error)
      toast.error('حدث خطأ أثناء تسجيل الخروج')
    }
  }

  return (
    <div className="sticky top-0 z-50 flex h-20 shrink-0 items-center gap-x-6 bg-gradient-to-r from-white/95 via-blue-50/95 to-purple-50/95 backdrop-blur-2xl px-6 lg:px-8 shadow-2xl border-b border-white/30 animate-slideInRight">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="relative z-10 flex items-center gap-x-6 w-full">
        {/* Ultra Modern Mobile Menu Button */}
        <button
          type="button"
          className="group p-3 text-gray-700 lg:hidden hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-md hover:shadow-lg"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6 group-hover:text-blue-600 transition-colors" />
        </button>

        {/* Ultra Modern Search Bar */}
        <div className="flex flex-1 items-center min-w-0 max-w-lg">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <div className="w-6 h-6 text-gray-400 group-focus-within:text-blue-500 group-focus-within:scale-110 transition-all">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 border-0 rounded-2xl bg-white/70 backdrop-blur-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-base font-medium"
              placeholder="البحث في لوحة التحكم المتطورة..."
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>

        {/* Ultra Modern Right Side Actions */}
        <div className="flex items-center gap-x-4">
          {/* Advanced Notifications */}
          <button className="relative group p-3 text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-md hover:shadow-lg">
            <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 3a9 9 0 11-9 9 9 9 0 019-9z" />
            </svg>
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">3</span>
            </span>
          </button>

          {/* Advanced Settings */}
          <button className="group p-3 text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-md hover:shadow-lg">
            <svg className="w-6 h-6 group-hover:animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Ultra Modern User Profile */}
          <div className="flex items-center gap-x-4 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="hidden lg:block text-right">
              <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {user.name || 'المدير الأعلى'}
              </p>
              <p className="text-sm text-gray-600 font-medium">
                👑 {typeof user.role === 'object' ? (user.role as any)?.display_name_ar || 'مدير النظام' : user.role || 'مدير النظام'}
              </p>
            </div>
            
            <div className="relative group">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl ring-4 ring-white group-hover:scale-110 transition-all duration-300">
                <span className="text-white text-xl font-black">
                  {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                </span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 ring-2 ring-white"></span>
              </span>
            </div>
          </div>
          
          {/* Ultra Modern Logout Button */}
          <button
            onClick={handleSignOut}
            className="group relative inline-flex items-center gap-x-3 rounded-2xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-6 py-4 text-base font-bold text-white shadow-2xl hover:from-red-600 hover:via-red-700 hover:to-red-800 hover:shadow-3xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <LogOut className="h-5 w-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="hidden sm:inline relative z-10">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header