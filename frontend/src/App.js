import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CallProvider } from './contexts/CallContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import VoiceCallModal from './components/VoiceCallModal';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import ModernChat from './pages/ModernChat';
import MobileChatsPage from './pages/MobileChatsPage';
import MobileChatPage from './pages/MobileChatPage';
import GlobalChatPage from './pages/GlobalChatPage';
import CreateGroupPage from './pages/CreateGroupPage';
import AccountPage from './pages/AccountPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import AdminLogin from './pages/AdminLogin';

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
                      <ModernChat />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <ModernChat />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chat/:chatId" 
                  element={
                    <ProtectedRoute>
                      <ModernChat />
                    </ProtectedRoute>
                  } 
                />
                {/* Mobile Chat Routes */}
                <Route 
                  path="/mobile-chats" 
                  element={
                    <ProtectedRoute>
                      <MobileChatsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/mobile-chat/:chatId" 
                  element={
                    <ProtectedRoute>
                      <MobileChatPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/global-chat" 
                  element={
                    <ProtectedRoute>
                      <GlobalChatPage />
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
                <Route 
                  path="/admin-login" 
                  element={
                    <AdminProtectedRoute>
                      <AdminLogin />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <AdminProtectedRoute>
                      <AdminPage />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/*" 
                  element={
                    <AdminProtectedRoute>
                      <AdminPage />
                    </AdminProtectedRoute>
                  } 
                />
                
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
