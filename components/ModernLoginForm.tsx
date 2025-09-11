'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'

export default function ModernLoginForm() {
  const [email, setEmail] = useState('admin@greebite.com')
  const [password, setPassword] = useState('123456789')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // First, try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        // If user doesn't exist, try to sign up first
        if (error.message.includes('Invalid login credentials')) {
          toast.error('المستخدم غير موجود. جاري إنشاء حساب جديد...')
          
          // Try to sign up
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
          })

          if (signUpError) {
            toast.error('خطأ في إنشاء الحساب: ' + signUpError.message)
            return
          }

          toast.success('تم إنشاء الحساب! جاري تسجيل الدخول...')
          
          // Now try to sign in again
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          })

          if (signInError) {
            toast.error('خطأ في تسجيل الدخول: ' + signInError.message)
            return
          }
        } else {
          toast.error('خطأ: ' + error.message)
          return
        }
      }

      toast.success('تم تسجيل الدخول بنجاح!')
      
      // Force page reload to trigger auth state change
      window.location.reload()
      
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error('حدث خطأ غير متوقع: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Healthy Food Delivery Management
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="admin@greebite.com"
                  required
                  disabled={isLoading}
                  style={{
                    fontSize: '16px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#1f2937',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  style={{
                    fontSize: '16px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#1f2937',
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              🎯 Demo Credentials:
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Email:</strong> admin@greebite.com</p>
              <p><strong>Password:</strong> 123456789</p>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">
              ⚠️ Setup Required:
            </h3>
            <div className="text-sm text-yellow-700">
              <p>1. Run SQL setup in Supabase</p>
              <p>2. Create admin user in Authentication</p>
              <p>3. Then login here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
