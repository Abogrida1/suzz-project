#!/usr/bin/env python3
"""
SUZZ Drive-Thru Website Launcher
شتغيل الموقع بسهولة
"""

import os
import sys
import webbrowser
import time
from threading import Timer

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 فحص المتطلبات...")
    
    required_packages = ['flask', 'flask_cors', 'requests', 'pyotp']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"  ✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"  ❌ {package} - مفقود")
    
    if missing_packages:
        print(f"\n⚠️  المطلوب تثبيت: {', '.join(missing_packages)}")
        print("تشغيل الأمر: pip install -r backend/requirements.txt")
        return False
    
    print("✅ جميع المتطلبات متوفرة!")
    return True

def start_flask_server():
    """Start the Flask server"""
    print("\n🚀 بدء تشغيل خادم SUZZ...")
    
    # Add backend directory to Python path
    backend_path = os.path.join(os.getcwd(), 'backend')
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)
    
    # Import and run Flask app
    try:
        from app import app
        print("✅ تم تحميل التطبيق بنجاح!")
        print("🌐 الموقع متاح على: http://localhost:5000")
        print("🏠 الصفحة الرئيسية: http://localhost:5000/home")
        print("🎫 كود الخصم: http://localhost:5000/")
        print("\n⌨️  اضغط Ctrl+C لإيقاف الخادم")
        
        # Open browser after 2 seconds
        Timer(2.0, lambda: webbrowser.open('http://localhost:5000/home')).start()
        
        # Start Flask server
        app.run(host='0.0.0.0', port=5000, debug=True)
        
    except Exception as e:
        print(f"❌ خطأ في تشغيل الخادم: {e}")
        return False

def main():
    """Main function"""
    print("=" * 50)
    print("🚗 SUZZ Drive-Thru Website")
    print("أول وأسرع Drive-Thru في السويس")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('backend/app.py'):
        print("❌ يرجى تشغيل هذا السكريپت من مجلد المشروع الرئيسي")
        print("المسار الصحيح: D:/suzz/suzz-project/")
        return
    
    # Check dependencies
    if not check_dependencies():
        return
    
    # Check if static files exist
    print("\n🔍 فحص الملفات...")
    static_files = [
        'static/images/logo.jpg',
        'static/videos/hero-video.mp4',
        'static/images/menu/menu photo 1.jpg',
        'static/images/menu/menu photo 2.jpg'
    ]
    
    for file_path in static_files:
        if os.path.exists(file_path):
            print(f"  ✅ {file_path}")
        else:
            print(f"  ⚠️  {file_path} - مفقود")
    
    print("\n📋 صفحات الموقع المتاحة:")
    print("  🏠 /home - الصفحة الرئيسية مع فيديو drive-thru")
    print("  🍽️ /menu - المنيو مع صور المنتجات")
    print("  📍 /location - معلومات الموقع")
    print("  🛒 /order - الطلب المسبق")
    print("  🎫 / - كود الخصم (QR Code)")
    
    # Start the server
    start_flask_server()

if __name__ == "__main__":
    main()
