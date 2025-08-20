#!/usr/bin/env python3
"""
Simple database creation script for SUZZ Cafe
"""

import sqlite3
import os
from datetime import datetime

def create_database():
    """Create a new database with all required tables"""
    
    # Database path
    db_path = '../suzu_cafe.db'
    
    print(f"Creating database at: {db_path}")
    
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Removed existing database")
    
    # Create new database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Creating tables...")
    
    # Create users table with improved structure
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT,
            discount_percentage INTEGER NOT NULL,
            unique_code TEXT UNIQUE NOT NULL,
            qr_code_data TEXT NOT NULL,
            is_used BOOLEAN DEFAULT FALSE,
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            used_at TIMESTAMP NULL,
            is_admin_discount BOOLEAN DEFAULT FALSE,
            admin_description TEXT,
            metadata TEXT DEFAULT '{}',
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verification_method TEXT DEFAULT 'whatsapp',
            discount_category TEXT DEFAULT 'regular'
        )
    ''')
    print("✓ Users table created")
    
    # Create OTP table
    cursor.execute('''
        CREATE TABLE otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            otp_code TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            attempts INTEGER DEFAULT 0
        )
    ''')
    print("✓ OTPs table created")
    
    # Create admin_sessions table
    cursor.execute('''
        CREATE TABLE admin_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_token TEXT UNIQUE NOT NULL,
            admin_user TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("✓ Admin sessions table created")
    
    # Create user_sessions table
    cursor.execute('''
        CREATE TABLE user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT NOT NULL,
            session_token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("✓ User sessions table created")
    
    # Create audit_log table
    cursor.execute('''
        CREATE TABLE audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            user_phone TEXT,
            admin_session TEXT,
            details TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            severity TEXT DEFAULT 'info',
            category TEXT DEFAULT 'general'
        )
    ''')
    print("✓ Audit log table created")
    
    # Create website_settings table for storing main image and other settings
    cursor.execute('''
        CREATE TABLE website_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            description TEXT,
            updated_by TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("✓ Website settings table created")
    
    # Create discount_categories table
    cursor.execute('''
        CREATE TABLE discount_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            percentage INTEGER NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("✓ Discount categories table created")
    
    # Create user_activity table for tracking user interactions
    cursor.execute('''
        CREATE TABLE user_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            phone_number TEXT,
            activity_type TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    print("✓ User activity table created")
    
    # Insert initial data
    print("Inserting initial data...")
    
    # Insert default website settings
    cursor.execute('''
        INSERT INTO website_settings (setting_key, setting_value, description, updated_by)
        VALUES 
        ('main_image_url', 'https://i.ibb.co/MDHwvrfG/IMG-5849.jpg', 'الصورة الرئيسية للموقع', 'system'),
        ('site_name', 'SUZZ', 'اسم الموقع', 'system'),
        ('site_description', 'أول Drive-Thru في السويس', 'وصف الموقع', 'system'),
        ('default_discount', '15', 'نسبة الخصم الافتراضية', 'system')
    ''')
    print("✓ Default website settings inserted")
    
    # Insert default discount categories
    cursor.execute('''
        INSERT INTO discount_categories (name, percentage, description)
        VALUES 
        ('خصم عادي', 15, 'خصم عادي للمستخدمين الجدد'),
        ('خصم مميز', 20, 'خصم مميز للمستخدمين النشطين'),
        ('خصم إداري', 25, 'خصم خاص من الإدارة')
    ''')
    print("✓ Default discount categories inserted")
    
    # Insert sample admin discount for testing
    cursor.execute('''
        INSERT INTO users (phone_number, discount_percentage, unique_code, qr_code_data, is_verified, is_admin_discount, admin_description)
        VALUES 
        ('', 25, 'ADMIN-TEST-001', '{"unique_code": "ADMIN-TEST-001", "discount_percentage": 25}', TRUE, TRUE, 'خصم إداري تجريبي')
    ''')
    print("✓ Sample admin discount inserted")
    
    # Create indexes
    cursor.execute('CREATE INDEX idx_users_phone ON users(phone_number) WHERE phone_number IS NOT NULL')
    cursor.execute('CREATE INDEX idx_users_code ON users(unique_code)')
    cursor.execute('CREATE INDEX idx_otps_phone ON otps(phone_number)')
    cursor.execute('CREATE INDEX idx_otps_expires ON otps(expires_at)')
    cursor.execute('CREATE INDEX idx_user_sessions_phone ON user_sessions(phone_number)')
    cursor.execute('CREATE INDEX idx_user_sessions_token ON user_sessions(session_token)')
    cursor.execute('CREATE INDEX idx_audit_created ON audit_log(created_at)')
    print("✓ Indexes created")
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print(f"\n✅ Database created successfully at: {db_path}")
    print("You can now run the application!")

if __name__ == "__main__":
    create_database()
