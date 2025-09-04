import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin
  const isCreatorEmail = user?.email === 'madoabogrida05@gmail.com';
  const isCreatorUsername = user?.username && user.username.toLowerCase() === 'batta';
  
  // Check stored credentials - must be valid admin credentials
  let hasValidCredentials = false;
  try {
    const storedCredentials = localStorage.getItem('adminCredentials');
    if (storedCredentials) {
      const credentials = JSON.parse(storedCredentials);
      hasValidCredentials = credentials.username === 'madoabogrida05@gmail.com' && credentials.password === 'batta1';
    }
  } catch (error) {
    console.error('Error parsing stored credentials:', error);
    hasValidCredentials = false;
  }

  console.log('AdminProtectedRoute - authorization check:', {
    email: user?.email,
    username: user?.username,
    isCreatorEmail,
    isCreatorUsername,
    hasValidCredentials,
    isAuthenticated
  });

  if (isCreatorEmail || isCreatorUsername || hasValidCredentials) {
    console.log('✅ Admin access granted in AdminProtectedRoute');
    return children;
  }

  console.log('❌ Admin access denied - redirecting to home');
  return <Navigate to="/" replace />;
};

export default AdminProtectedRoute;
