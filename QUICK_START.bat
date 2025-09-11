@echo off
chcp 65001 >nul
echo 🚀 Starting Greebite Admin Dashboard
echo ===================================
echo.

cd /d D:\greebite\admin_dashboard

echo 📋 Checking Node.js...
node --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo 📦 Installing dependencies...
npm install

echo.
echo 🌐 Starting development server...
echo.
echo 🎯 Admin Dashboard will be available at:
echo    http://localhost:3000
echo.
echo ✨ Features available:
echo    - Staff Management ✅
echo    - Order Management ✅  
echo    - Restaurant Management ✅
echo    - User Management ✅
echo    - Analytics & Reports ✅
echo    - Coupon Management ✅
echo    - Courier Management ✅
echo.

start http://localhost:3000

npm run dev
