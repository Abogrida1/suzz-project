'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail, Loader2, Shield, CheckCircle } from 'lucide-react'

export default function ProfessionalLogin() {
  const [email, setEmail] = useState('admin@greebite.com')
  const [password, setPassword] = useState('123456789')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'login' | 'setup' | 'success'>('login')

  const handleEmailConfirmation = async () => {
    try {
      toast.info('جاري تأكيد الإيميل...')
      
      // Try to confirm email by updating auth.users directly via RPC
      const { error } = await supabase.rpc('confirm_admin_email', {
        admin_email: email.trim()
      })

      if (error) {
        console.error('Email confirmation error:', error)
        toast.error('فشل في تأكيد الإيميل. جرب الإعداد التلقائي.')
        return
      }

      toast.success('تم تأكيد الإيميل! جاري تسجيل الدخول...')
      
      // Try login again
      setTimeout(async () => {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        })

        if (!loginError && data.user) {
          setStep('success')
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          toast.error('فشل تسجيل الدخول بعد تأكيد الإيميل')
        }
      }, 1000)

    } catch (error: any) {
      console.error('Email confirmation error:', error)
      toast.error('خطأ في تأكيد الإيميل')
    }
  }

  const handleSetup = async () => {
    try {
      setIsLoading(true)
      
      // Try to create account
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      })

      if (data.user && !error) {
        // Add to users table
        await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            name: 'Admin User',
            phone: '+201234567890',
            email: email.trim(),
            role: 'admin'
          }])

        toast.success('Setup complete! Logging in...')
        
        // Auto login
        setTimeout(async () => {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          })

          if (!loginError) {
            setStep('success')
            setTimeout(() => {
              window.location.reload()
            }, 1000)
          }
        }, 1000)
      } else if (error) {
        toast.error('Setup failed: ' + error.message)
        setStep('login')
      }

    } catch (error: any) {
      toast.error('Setup error: ' + error.message)
      setStep('login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('المستخدم غير موجود. جاري إعداد الحساب...')
          setStep('setup')
          await handleSetup()
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('الإيميل غير مؤكد. جرب الإعداد التلقائي أو قم بتطبيق DISABLE_EMAIL_CONFIRMATION.sql في Supabase')
          toast.info('أو اضغط زر Auto Setup أسفل الصفحة')
        } else {
          toast.error('خطأ: ' + error.message)
        }
        return
      }

      // Check if user is admin or create admin record
      if (data.user) {
        let { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // If user doesn't exist in users table, create admin record
        if (userError || !userData) {
          toast.info('إنشاء ملف المدير...')
          
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              name: 'مدير النظام',
              phone: '+201234567890',
              email: data.user.email,
              role: 'admin'
            }])

          if (insertError) {
            console.error('Error creating admin user:', insertError)
            toast.error('خطأ في إنشاء ملف المدير')
            return
          }

          toast.success('تم إنشاء ملف المدير!')
        } else if (userData.role !== 'admin') {
          // Update user role to admin
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', data.user.id)

          if (updateError) {
            toast.error('خطأ في تحديث الدور')
            return
          }

          toast.success('تم تحديث الدور إلى مدير!')
        }

        setStep('success')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }

    } catch (error: any) {
      console.error('Login error:', error)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Setting Up Admin Account
            </h2>
            <p className="text-gray-600 mb-6">
              Creating admin user and setting up permissions...
            </p>
            <div className="flex justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Login Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Redirecting to dashboard...
            </p>
            <div className="flex justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        </div>

        <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <Lock className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              Healthy Food Delivery
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full mx-auto mt-4"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-lg"
                  placeholder="admin@greebite.com"
                  required
                  disabled={isLoading}
                  style={{
                    fontSize: '16px',
                    fontFamily: 'Inter, Arial, sans-serif',
                    color: '#1f2937',
                    fontWeight: '500',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-lg"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  style={{
                    fontSize: '16px',
                    fontFamily: 'Inter, Arial, sans-serif',
                    color: '#1f2937',
                    fontWeight: '500',
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              style={{
                fontSize: '18px',
                fontFamily: 'Inter, Arial, sans-serif',
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-6 w-6 mr-3" />
                  <span style={{ fontWeight: '600' }}>Signing in...</span>
                </div>
              ) : (
                <span style={{ fontWeight: '700' }}>Access Dashboard</span>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <div className="flex items-center mb-3">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-bold text-blue-900">
                Demo Credentials
              </h3>
            </div>
            <div className="space-y-2 text-blue-800">
              <p className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span className="font-mono bg-blue-100 px-2 py-1 rounded">admin@greebite.com</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Password:</span>
                <span className="font-mono bg-blue-100 px-2 py-1 rounded">123456789</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                setStep('setup')
                handleSetup()
              }}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
              style={{
                fontSize: '16px',
                fontFamily: 'Inter, Arial, sans-serif',
              }}
            >
              🚀 Auto Setup & Login
            </button>
            
            <button
              onClick={handleEmailConfirmation}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
              style={{
                fontSize: '16px',
                fontFamily: 'Inter, Arial, sans-serif',
              }}
            >
              ✅ Fix Email Confirmation
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              🔒 Secure Admin Access Only
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Healthy Food Delivery Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}