'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import StaffAdminLogin from '@/components/StaffAdminLogin'
import Dashboard from '@/components/Dashboard'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for staff user in localStorage first
    const checkAuth = async () => {
      try {
        const staffUser = localStorage.getItem('staff_user')
        if (staffUser) {
          console.log('✅ Staff user found in localStorage')
          setUser(JSON.parse(staffUser))
          setLoading(false)
          return
        }

        // Check current Supabase session for admin
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('✅ Admin authenticated:', session.user.email)
          
          // Create admin user object
          const adminUser = {
            id: session.user.id,
            name: 'المدير العام',
            email: session.user.email || 'admin@greebite.com',
            role: { name: 'admin', display_name_ar: 'مدير عام' },
            login_type: 'admin'
          }

          localStorage.setItem('staff_user', JSON.stringify(adminUser))
          setUser(adminUser)
          console.log('✅ Admin user set successfully')
        } else {
          console.log('❌ No session found')
        }
      } catch (error) {
        console.error('❌ Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Admin signed in:', session.user.email)
          
          const adminUser = {
            id: session.user.id,
            name: 'المدير العام',
            email: session.user.email || 'admin@greebite.com',
            role: { name: 'admin', display_name_ar: 'مدير عام' },
            login_type: 'admin'
          }

          localStorage.setItem('staff_user', JSON.stringify(adminUser))
          setUser(adminUser)
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ User signed out')
          localStorage.removeItem('staff_user')
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('🔑 Showing login form')
    return <StaffAdminLogin />
  }

  console.log('🎉 Showing dashboard for:', user.email)
  return <Dashboard user={user} />
}