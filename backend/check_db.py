#!/usr/bin/env python3
"""
Check database structure
"""

import sqlite3

def check_database():
    """Check the database structure"""
    
    try:
        conn = sqlite3.connect('suzu_cafe.db')
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print("Tables in database:")
        for table in tables:
            print(f"- {table[0]}")
        
        print("\n" + "="*50 + "\n")
        
        # Check users table structure
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        print("Users table columns:")
        for col in columns:
            print(f"- {col[1]} ({col[2]})")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_database()
