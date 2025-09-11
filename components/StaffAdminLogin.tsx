'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Lock, Loader2, CheckCircle, UserCheck, Shield } from 'lucide-react'
// bcrypt will be handled server-side

interface StaffMember {
  id: string
  name: string
  email: string
  password_hash: string
  is_active: boolean
  role: {
    name: string
    display_name_ar: string
  }
}

export default function StaffAdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'login' | 'success'>('login')
  const [loginType, setLoginType] = useState<'admin' | 'staff'>('staff')

  const handleStaffLogin = async (email: string, password: string) => {
    try {
      // البحث عن الموظف في قاعدة البيانات
      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select(`
          *,
          role:staff_roles(name, display_name_ar)
        `)
        .eq('email', email.trim())
        .eq('is_active', true)
        .single()

      if (staffError || !staffData) {
        throw new Error('بيانات دخول غير صحيحة')
      }

      // التحقق من كلمة المرور (مقارنة مباشرة لأن التشفير لم يتم تطبيقه بعد)
      if (staffData.password_hash !== password) {
        throw new Error('بيانات دخول غير صحيحة')
      }

      // تحديث آخر دخول
      await supabase
        .from('staff_members')
        .update({ last_login: new Date().toISOString() })
        .eq('email', email.trim())

      // حفظ بيانات الموظف في localStorage
      localStorage.setItem('staff_user', JSON.stringify({
        id: staffData.id,
        name: staffData.name,
        email: staffData.email,
        role: staffData.role,
        login_type: 'staff'
      }))

      return { success: true, user: staffData }
    } catch (error: any) {
      throw new Error(error.message || 'حدث خطأ في تسجيل الدخول')
    }
  }

  const handleAdminLogin = async (email: string, password: string) => {
    try {
      // محاولة تسجيل الدخول عبر Supabase Auth
      let { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      // إذا لم يكن المستخدم موجود، إنشاء حساب جديد
      if (error && error.message.includes('Invalid login credentials')) {
        console.log('Admin not found, creating account...')
        toast.info('إنشاء حساب الأدمن...')
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        })

        if (signUpError) {
          throw new Error('فشل في إنشاء الحساب: ' + signUpError.message)
        }

        console.log('Account created, attempting login...')
        
        // محاولة تسجيل الدخول مرة أخرى
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        })

        if (loginError) {
          throw new Error('فشل في تسجيل الدخول بعد إنشاء الحساب: ' + loginError.message)
        }

        data = loginData
      } else if (error) {
        throw new Error('خطأ في تسجيل الدخول: ' + error.message)
      }

      // حفظ بيانات الأدمن في localStorage
      if (data?.user) {
        localStorage.setItem('staff_user', JSON.stringify({
          id: data.user.id,
          name: 'المدير العام',
          email: data.user.email,
          role: { name: 'admin', display_name_ar: 'مدير عام' },
          login_type: 'admin'
        }))
        return { success: true, user: data.user }
      }
    } catch (error: any) {
      throw new Error(error.message || 'حدث خطأ في تسجيل الدخول')
    }
  }

  const handleLogin = async (e: any) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    try {
      console.log('Attempting unified login with:', email)

      // جرب تسجيل دخول الموظف أولاً
      try {
        const staffResult = await handleStaffLogin(email, password)
        if (staffResult.success) {
          console.log('Staff login successful for:', email)
          toast.success('تم تسجيل الدخول بنجاح! جاري التحويل...')
          setStep('success')
          setTimeout(() => {
            window.location.reload()
          }, 1000)
          return
        }
      } catch (staffError) {
        console.log('Staff login failed, trying admin login')
      }

      // إذا فشل تسجيل دخول الموظف، جرب الأدمن
      try {
        const adminResult = await handleAdminLogin(email, password)
        if (adminResult.success) {
          console.log('Admin login successful for:', email)
          toast.success('تم تسجيل الدخول بنجاح! جاري التحويل...')
          setStep('success')
          setTimeout(() => {
            window.location.reload()
          }, 1000)
          return
        }
      } catch (adminError) {
        throw new Error('بيانات دخول غير صحيحة')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'حدث خطأ في تسجيل الدخول')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              تم بنجاح!
            </h2>
            <p className="text-gray-600 mb-6">
              جاري تحميل لوحة التحكم...
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-300 to-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        </div>

        <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <Lock className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
              لوحة التحكم
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              إدارة تطبيق توصيل الطعام الصحي
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto mt-4"></div>
          </div>

          {/* تم إزالة اختيار نوع تسجيل الدخول - النظام يجرب تلقائياً */}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg font-medium"
                placeholder="البريد الإلكتروني"
                required
                disabled={isLoading}
                style={{
                  fontSize: '16px',
                  fontFamily: 'Inter, Arial, sans-serif',
                  color: '#1f2937',
                }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg font-medium"
                placeholder="أدخل كلمة المرور"
                required
                disabled={isLoading}
                style={{
                  fontSize: '16px',
                  fontFamily: 'Inter, Arial, sans-serif',
                  color: '#1f2937',
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg text-lg ${
                loginType === 'admin'
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-6 w-6 mr-3" />
                  <span>جاري المعالجة...</span>
                </div>
              ) : (
                <span>🚀 دخول لوحة التحكم</span>
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                🎯 جاهز للاستخدام
              </h3>
              <div className="space-y-2 text-gray-700">
                {loginType === 'admin' ? (
                  <>
                    <p className="font-mono bg-white px-3 py-2 rounded-lg">
                      المدير: admin@greebite.com
                    </p>
                    <p className="font-mono bg-white px-3 py-2 rounded-lg">
                      كلمة المرور: 123456789
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-mono bg-white px-3 py-2 rounded-lg">
                      الموظف: ahmed@greebite.com
                    </p>
                    <p className="font-mono bg-white px-3 py-2 rounded-lg">
                      كلمة المرور: password123
                    </p>
                  </>
                )}
              </div>
              <p className="text-sm text-green-600 mt-3 font-medium">
                {loginType === 'admin' 
                  ? '✨ ينشئ حساب المدير تلقائياً إذا لم يكن موجود'
                  : '✨ يجب إنشاء حسابات الموظفين من قبل المدير'
                }
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              🔒 دخول آمن للإدارة
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
