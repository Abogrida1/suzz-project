import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaEye, FaEyeSlash, FaLock, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../config/axios';

const AdminLogin = () => {
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is authorized to access admin panel
  useEffect(() => {
    const checkAdminAuthorization = async () => {
      if (user) {
        try {
          const response = await api.get('/api/auth/me');
          const userData = response.data;
          const hasAdminRole = userData.role && ['admin', 'super_admin', 'moderator'].includes(userData.role);
          setIsAuthorized(hasAdminRole);
          
          if (!hasAdminRole) {
            toast.error('ليس لديك صلاحية للوصول إلى لوحة الإدارة');
            setTimeout(() => navigate('/'), 2000);
          }
        } catch (error) {
          console.error('Error checking admin authorization:', error);
          setIsAuthorized(false);
          toast.error('خطأ في التحقق من الصلاحيات');
          setTimeout(() => navigate('/'), 2000);
        }
      } else {
        setIsAuthorized(false);
        toast.error('يجب تسجيل الدخول أولاً');
        setTimeout(() => navigate('/login'), 2000);
      }
      setCheckingAuth(false);
    };

    checkAdminAuthorization();
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdminCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!adminCredentials.username || !adminCredentials.password) {
      toast.error('يرجى إدخال جميع البيانات');
      return;
    }

    setLoading(true);
    
    try {
      // Store admin credentials in localStorage for API calls
      localStorage.setItem('adminCredentials', JSON.stringify(adminCredentials));
      
      // Navigate to admin page
      navigate('/admin');
      toast.success('تم تسجيل الدخول بنجاح');
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while checking authorization
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <FaShieldAlt className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            جاري التحقق من الصلاحيات...
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  // If user is not authorized, show error message
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <FaExclamationTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            غير مصرح لك
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            ليس لديك صلاحية للوصول إلى لوحة الإدارة. يجب أن تكون مديراً أو مشرفاً للوصول إلى هذه الصفحة.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-300"
          >
            العودة للصفحة الرئيسية
          </button>
        </motion.div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <FaShieldAlt className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            تسجيل دخول الإدارة
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            أدخل بيانات الإدارة للوصول للوحة التحكم
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              اسم المستخدم
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="username"
                value={adminCredentials.username}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={adminCredentials.password}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="أدخل كلمة المرور"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                جاري التحقق...
              </div>
            ) : (
              <div className="flex items-center">
                <FaShieldAlt className="w-5 h-5 mr-2" />
                دخول الإدارة
              </div>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            العودة للصفحة السابقة
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
