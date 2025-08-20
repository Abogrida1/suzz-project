#!/usr/bin/env python3
"""
Quick Fix Script for SUZZ Cafe Database Issues
This script helps fix common database problems on hosting
"""

import os
import sqlite3
import sys
from pathlib import Path

def find_database_path():
    """Find the best database path for the current environment"""
    possible_paths = [
        # Current directory
        './suzu_cafe.db',
        '../suzu_cafe.db',
        '../../suzu_cafe.db',
        
        # Backend directory
        './backend/suzu_cafe.db',
        '../backend/suzu_cafe.db',
        
        # Common hosting paths
        '/var/www/suzu_cafe.db',
        '/home/*/public_html/suzu_cafe.db',
        '/opt/lampp/htdocs/suzu_cafe.db',
        '/var/www/html/suzu_cafe.db',
        
        # Windows paths
        'C:\\inetpub\\wwwroot\\suzu_cafe.db',
        'C:\\xampp\\htdocs\\suzu_cafe.db',
    ]
    
    print("🔍 Searching for database...")
    
    # Check environment variable first
    env_path = os.getenv('DATABASE_PATH')
    if env_path and os.path.exists(env_path):
        print(f"✅ Found database via environment variable: {env_path}")
        return env_path
    
    # Check possible paths
    for path in possible_paths:
        if '*' in path:  # Handle wildcard paths
            import glob
            matches = glob.glob(path)
            if matches:
                print(f"✅ Found database via wildcard: {matches[0]}")
                return matches[0]
        elif os.path.exists(path):
            print(f"✅ Found existing database: {path}")
            return path
    
    # Create in current directory if none found
    default_path = './suzu_cafe.db'
    print(f"❌ Database not found, will create at: {default_path}")
    return default_path

def create_database(db_path):
    """Create database with all required tables"""
    try:
        print(f"🔧 Creating database at: {db_path}")
        
        # Ensure directory exists
        db_dir = Path(db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)
        
        # Create database connection
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("📋 Creating tables...")
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT UNIQUE NOT NULL,
                discount_percentage INTEGER NOT NULL,
                unique_code TEXT UNIQUE NOT NULL,
                qr_code_data TEXT NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                is_admin_discount BOOLEAN DEFAULT FALSE,
                admin_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used_at TIMESTAMP NULL,
                metadata TEXT DEFAULT '{}'
            )
        ''')
        print("✅ Users table created")
        
        # Create OTPs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS otps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT NOT NULL,
                otp_code TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                attempts INTEGER DEFAULT 0
            )
        ''')
        print("✅ OTPs table created")
        
        # Create admin_sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admin_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            )
        ''')
        print("✅ Admin sessions table created")
        
        # Create user_sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            )
        ''')
        print("✅ User sessions table created")
        
        # Create audit_log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                user_id INTEGER,
                details TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ Audit log table created")
        
        # Create website_settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS website_settings (
                id INTEGER PRIMARY KEY AUTOINESTAMP,
                setting_key TEXT UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("✅ Website settings table created")
        
        # Create indexes
        print("🔍 Creating indexes...")
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_code ON users(unique_code)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone_number)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(session_token)')
        print("✅ Indexes created")
        
        # Insert default website settings
        cursor.execute('''
            INSERT OR REPLACE INTO website_settings (setting_key, setting_value) 
            VALUES ('main_image_url', 'https://i.ibb.co/MDHwvrfG/IMG-5849.jpg')
        ''')
        print("✅ Default website settings inserted")
        
        # Commit changes
        conn.commit()
        print("💾 Database committed successfully")
        
        # Close connection
        conn.close()
        print("🔒 Database connection closed")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def test_database(db_path):
    """Test database functionality"""
    try:
        print(f"🧪 Testing database at: {db_path}")
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Test basic operations
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"📊 Users count: {user_count}")
        
        cursor.execute("SELECT COUNT(*) FROM otps")
        otp_count = cursor.fetchone()[0]
        print(f"📊 OTPs count: {otp_count}")
        
        cursor.execute("SELECT setting_value FROM website_settings WHERE setting_key = 'main_image_url'")
        setting = cursor.fetchone()
        if setting:
            print(f"🌐 Main image URL: {setting[0]}")
        
        # Test insert operation
        test_phone = "9999999999"
        cursor.execute("""
            INSERT OR IGNORE INTO users 
            (phone_number, discount_percentage, unique_code, qr_code_data, is_admin_discount) 
            VALUES (?, ?, ?, ?, ?)
        """, (test_phone, 20, "TEST123", "{}", True))
        
        if cursor.rowcount > 0:
            print("✅ Test insert successful")
        else:
            print("ℹ️ Test user already exists")
        
        # Clean up test data
        cursor.execute("DELETE FROM users WHERE phone_number = ?", (test_phone,))
        print("🧹 Test data cleaned up")
        
        conn.commit()
        conn.close()
        
        print("✅ Database test completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def fix_permissions(db_path):
    """Fix database file permissions"""
    try:
        print(f"🔐 Fixing permissions for: {db_path}")
        
        if os.path.exists(db_path):
            # Set read/write permissions for owner and group
            os.chmod(db_path, 0o644)
            print(f"✅ Permissions fixed: {oct(os.stat(db_path).st_mode)[-3:]}")
        else:
            print("⚠️ Database file doesn't exist yet")
            
        return True
        
    except Exception as e:
        print(f"❌ Error fixing permissions: {e}")
        return False

def main():
    """Main function"""
    print("🚀 SUZZ Cafe Database Quick Fix Tool")
    print("=" * 50)
    
    # Find database path
    db_path = find_database_path()
    
    # Create database if needed
    if not os.path.exists(db_path):
        if create_database(db_path):
            print("✅ Database created successfully")
        else:
            print("❌ Failed to create database")
            sys.exit(1)
    else:
        print("✅ Database already exists")
    
    # Fix permissions
    fix_permissions(db_path)
    
    # Test database
    if test_database(db_path):
        print("🎉 Database is working correctly!")
    else:
        print("❌ Database test failed")
        sys.exit(1)
    
    print("\n📋 Next steps:")
    print("1. Set DATABASE_PATH environment variable to:", db_path)
    print("2. Restart your web server")
    print("3. Test your website")
    
    print("\n🔧 Environment variable example:")
    print(f"export DATABASE_PATH='{os.path.abspath(db_path)}'")
    
    print("\n🌐 Test your website:")
    print(f"curl http://localhost:5000/health")
    
    print("\n✅ Quick fix completed!")

if __name__ == "__main__":
    main()
