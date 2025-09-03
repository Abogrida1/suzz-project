import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminPage from '../pages/AdminPage';
import AdminLogin from '../pages/AdminLogin';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/admin-login" 
        element={
          <ProtectedRoute>
            <AdminLogin />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default AdminRoutes;
