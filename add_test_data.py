#!/usr/bin/env python3
"""
إضافة بيانات تجريبية لاختبار العدادات
"""

import sqlite3
import json
from datetime import datetime

def add_test_data():
    try:
        conn = sqlite3.connect('suzu_cafe.db')
        cursor = conn.cursor()
        
        # تحقق من وجود مستخدمين
        cursor.execute('SELECT COUNT(*) FROM users')
        existing_count = cursor.fetchone()[0]
        print(f"عدد المستخدمين الحاليين: {existing_count}")
        
        # إضافة بيانات تجريبية
        test_users = [
            # (phone, discount, code, qr_data, is_verified, is_used, created_at)
            ('01011111111', 15, 'SUZZ001', '{"test": true}', 1, 0, datetime.now().isoformat()),  # متحقق وغير مستخدم (نشط)
            ('01022222222', 20, 'SUZZ002', '{"test": true}', 1, 1, datetime.now().isoformat()),  # متحقق ومستخدم
            ('01033333333', 25, 'SUZZ003', '{"test": true}', 1, 0, datetime.now().isoformat()),  # متحقق وغير مستخدم (نشط)
            ('01044444444', 30, 'SUZZ004', '{"test": true}', 0, 0, datetime.now().isoformat()),  # غير متحقق
        ]
        
        for phone, discount, code, qr_data, is_verified, is_used, created_at in test_users:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO users 
                    (phone_number, discount_percentage, unique_code, qr_code_data, is_verified, is_used, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (phone, discount, code, qr_data, is_verified, is_used, created_at))
                print(f"✓ أضيف المستخدم: {phone}")
            except Exception as e:
                print(f"❌ خطأ في إضافة {phone}: {e}")
        
        conn.commit()
        
        # عرض الإحصائيات الجديدة
        cursor.execute('SELECT COUNT(*) FROM users')
        total = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = 1')
        verified = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_used = 1')
        used = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = 1 AND is_used = 0')
        active = cursor.fetchone()[0]
        
        print(f"\n=== الإحصائيات الجديدة ===")
        print(f"إجمالي المستخدمين: {total}")
        print(f"المستخدمين المتحققين: {verified}")
        print(f"الأكواد المستخدمة: {used}")
        print(f"المستخدمين النشطين: {active}")
        
        conn.close()
        print("\n✅ تم بنجاح! الآن جرب صفحة الأدمن.")
        
    except Exception as e:
        print(f"خطأ: {e}")

if __name__ == "__main__":
    add_test_data()
