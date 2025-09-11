'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Lock, Loader2, CheckCircle } from 'lucide-react'

export default function SimpleAdminLogin() {
  const [email, setEmail] = useState('admin@greebite.com')
  const [password, setPassword] = useState('123456789')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'login' | 'success'>('login')

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Attempting login with:', email)

      // Try to sign in
      let { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      // If user doesn't exist, create it
      if (error && error.message.includes('Invalid login credentials')) {
        console.log('User not found, creating account...')
        toast.info('Creating admin account...')
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        })

        if (signUpError) {
          toast.error('Signup failed: ' + signUpError.message)
          return
        }

        console.log('Account created, attempting login...')
        
        // Try login again
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        })

        if (loginError) {
          toast.error('Login after signup failed: ' + loginError.message)
          return
        }

        data = loginData
      } else if (error) {
        toast.error('Login error: ' + error.message)
        return
      }

      // If we reach here, login was successful
      if (data?.user) {
        console.log('Login successful for:', data.user.email)
        toast.success('Login successful! Redirecting...')
        setStep('success')
        
        // Force reload to trigger auth state change
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }

    } catch (error: any) {
      console.error('Unexpected error:', error)
      toast.error('Unexpected error occurred')
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
              Success!
            </h2>
            <p className="text-gray-600 mb-6">
              Loading dashboard...
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
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              Healthy Food Delivery Management
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto mt-4"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg font-medium"
                placeholder="admin@greebite.com"
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
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg font-medium"
                placeholder="Enter password"
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
              className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-6 w-6 mr-3" />
                  <span>Processing...</span>
                </div>
              ) : (
                <span>🚀 Access Dashboard</span>
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                🎯 Ready to Use
              </h3>
              <div className="space-y-2 text-gray-700">
                <p className="font-mono bg-white px-3 py-2 rounded-lg">
                  Email: admin@greebite.com
                </p>
                <p className="font-mono bg-white px-3 py-2 rounded-lg">
                  Password: 123456789
                </p>
              </div>
              <p className="text-sm text-green-600 mt-3 font-medium">
                ✨ Auto-creates admin account if needed
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              🔒 Secure Admin Access
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}