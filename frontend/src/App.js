import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CallProvider } from './contexts/CallContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import VoiceCallModal from './components/VoiceCallModal';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import ChatsPage from './pages/ChatsPage';
import MobileChatsPage from './pages/MobileChatsPage';
import CreateGroupPage from './pages/CreateGroupPage';
import AccountPage from './pages/AccountPage';
import SettingsPage from './pages/SettingsPage';
import AdminRoutes from './routes/AdminRoutes';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CallProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chats" 
                  element={
                    <ProtectedRoute>
                      <ChatsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/mobile-chats" 
                  element={
                    <ProtectedRoute>
                      <MobileChatsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/create-group" 
                  element={
                    <ProtectedRoute>
                      <CreateGroupPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/account" 
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
                {/* Admin routes - only accessible to authorized users */}
                <Route path="/admin-login" element={<AdminRoutes />} />
                <Route path="/admin/*" element={<AdminRoutes />} />
                
                {/* Catch all route - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
                            <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--toast-bg)',
                    color: 'var(--toast-color)',
                  },
                }}
              />
              <VoiceCallModal />
            </div>
          </Router>
          </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
