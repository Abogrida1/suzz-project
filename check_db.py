#!/usr/bin/env python3
import sqlite3

def check_database():
    try:
        conn = sqlite3.connect('suzu_cafe.db')
        cursor = conn.cursor()
        
        # Check total users
        cursor.execute('SELECT COUNT(*) FROM users')
        total = cursor.fetchone()[0]
        
        # Check verified users
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = 1')
        verified = cursor.fetchone()[0]
        
        # Check used codes
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_used = 1')
        used = cursor.fetchone()[0]
        
        # Check active users (verified but not used)
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = 1 AND is_used = 0')
        active = cursor.fetchone()[0]
        
        print("=== قاعدة البيانات ===")
        print(f"إجمالي المستخدمين: {total}")
        print(f"المستخدمين المتحققين: {verified}")
        print(f"الأكواد المستخدمة: {used}")
        print(f"المستخدمين النشطين: {active}")
        
        # Show all users
        cursor.execute('SELECT phone_number, is_verified, is_used FROM users')
        users = cursor.fetchall()
        print(f"\n=== تفاصيل المستخدمين ===")
        for user in users:
            phone, verified, used = user
            status = "متحقق" if verified else "غير متحقق"
            usage = "مستخدم" if used else "غير مستخدم"
            print(f"  {phone}: {status} - {usage}")
        
        conn.close()
        
    except Exception as e:
        print(f"خطأ: {e}")

if __name__ == "__main__":
    check_database()
