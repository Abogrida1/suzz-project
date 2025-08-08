import sqlite3
import hashlib
import secrets
import qrcode
import io
import base64
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import json

class DatabaseManager:
    """Database manager for Suzu Café application"""
    
    def __init__(self, db_path: str = 'suzu_cafe.db'):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        return conn
    
    def init_database(self):
        """Initialize database with required tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                used_at TIMESTAMP NULL,
                metadata TEXT DEFAULT '{}'
            )
        ''')
        
        # Create OTP table
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
        
        # Create admin_sessions table for session management
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admin_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            )
        ''')
        
        # Create audit_log table for tracking actions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                user_phone TEXT,
                admin_session TEXT,
                details TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_code ON users(unique_code)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone_number)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)')
        
        conn.commit()
        conn.close()

class User:
    """User model for managing customer data"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def create_user(self, phone_number: str, discount: int, unique_code: str, qr_code_data: str, is_verified: bool = False) -> bool:
        """Create a new user"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO users (phone_number, discount_percentage, unique_code, qr_code_data, is_verified)
                VALUES (?, ?, ?, ?, ?)
            ''', (phone_number, discount, unique_code, qr_code_data, is_verified))
            
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            return False
    
    def get_user_by_phone(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Get user by phone number"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE phone_number = ?', (phone_number,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_user_by_code(self, unique_code: str) -> Optional[Dict[str, Any]]:
        """Get user by unique code"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE unique_code = ?', (unique_code,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def verify_user(self, phone_number: str) -> bool:
        """Mark user as verified"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE users SET is_verified = TRUE WHERE phone_number = ?', (phone_number,))
        success = cursor.rowcount > 0
        
        conn.commit()
        conn.close()
        return success
    
    def use_code(self, unique_code: str) -> bool:
        """Mark code as used"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users 
            SET is_used = TRUE, used_at = CURRENT_TIMESTAMP 
            WHERE unique_code = ? AND is_verified = TRUE AND is_used = FALSE
        ''', (unique_code,))
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT phone_number, discount_percentage, unique_code, is_used, is_verified, created_at, used_at
            FROM users ORDER BY created_at DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_user_stats(self) -> Dict[str, int]:
        """Get user statistics"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        # Total users
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        
        # Verified users
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = TRUE')
        verified_users = cursor.fetchone()[0]
        
        # Active codes
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = TRUE AND is_used = FALSE')
        active_codes = cursor.fetchone()[0]
        
        # Redeemed codes
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_used = TRUE')
        redeemed_codes = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'total_users': total_users,
            'verified_users': verified_users,
            'active_codes': active_codes,
            'redeemed_codes': redeemed_codes
        }

class OTP:
    """OTP model for managing one-time passwords"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def create_otp(self, phone_number: str, otp_code: str, expiry_minutes: int = 5) -> bool:
        """Create a new OTP"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            expires_at = datetime.now() + timedelta(minutes=expiry_minutes)
            
            cursor.execute('''
                INSERT INTO otps (phone_number, otp_code, expires_at)
                VALUES (?, ?, ?)
            ''', (phone_number, otp_code, expires_at))
            
            conn.commit()
            conn.close()
            return True
        except Exception:
            return False
    
    def verify_otp(self, phone_number: str, otp_code: str) -> bool:
        """Verify OTP code"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        # Check if OTP exists and is valid
        cursor.execute('''
            SELECT id FROM otps 
            WHERE phone_number = ? AND otp_code = ? AND expires_at > ? AND is_verified = FALSE
            ORDER BY created_at DESC LIMIT 1
        ''', (phone_number, otp_code, datetime.now()))
        
        otp_record = cursor.fetchone()
        
        if otp_record:
            # Mark OTP as verified
            cursor.execute('UPDATE otps SET is_verified = TRUE WHERE id = ?', (otp_record[0],))
            conn.commit()
            conn.close()
            return True
        
        conn.close()
        return False
    
    def cleanup_expired_otps(self):
        """Remove expired OTPs"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM otps WHERE expires_at < ?', (datetime.now(),))
        deleted_count = cursor.rowcount
        
        conn.commit()
        conn.close()
        return deleted_count

class AuditLog:
    """Audit log model for tracking system actions"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def log_action(self, action: str, user_phone: str = None, admin_session: str = None, 
                   details: str = None, ip_address: str = None, user_agent: str = None):
        """Log an action"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO audit_log (action, user_phone, admin_session, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (action, user_phone, admin_session, details, ip_address, user_agent))
        
        conn.commit()
        conn.close()
    
    def get_recent_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent audit logs"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM audit_log 
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

class CodeGenerator:
    """Utility class for generating codes and QR codes"""
    
    @staticmethod
    def generate_unique_code() -> str:
        """Generate a unique code for the user"""
        return f"SUZU-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
    
    @staticmethod
    def generate_qr_code(data: str) -> str:
        """Generate QR code and return as base64 string"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=5,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode()
    
    @staticmethod
    def parse_qr_data(qr_data: str) -> Dict[str, str]:
        """Parse QR code data"""
        try:
            parts = qr_data.split('|')
            if len(parts) >= 3:
                return {
                    'unique_code': parts[0],
                    'phone_number': parts[1],
                    'discount': parts[2]
                }
        except Exception:
            pass
        
        return {'unique_code': qr_data}

class SecurityManager:
    """Security utilities"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return SecurityManager.hash_password(password) == hashed
    
    @staticmethod
    def generate_session_token() -> str:
        """Generate secure session token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def validate_egyptian_phone(phone: str) -> bool:
        """Validate Egyptian phone number format"""
        import re
        # Egyptian phone numbers: 11 digits starting with 01
        pattern = r'^01[0-9]{9}$'
        return bool(re.match(pattern, phone.replace(' ', '').replace('-', '')))

    @staticmethod
    def normalize_egyptian_phone(phone: str) -> str:
        """Normalize Egyptian phone number by removing spaces, dashes, and handling +20 prefix"""
        import re
        if not phone:
            return None
        phone = phone.strip()
        # Remove spaces and dashes
        phone = re.sub(r'[\s\-]', '', phone)
        # Remove +20 country code if present
        if phone.startswith('+20'):
            phone = phone[3:]
        # Validate normalized phone
        if re.match(r'^01[0-9]{9}$', phone):
            return phone
        return None
    
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitize user input"""
        if not text:
            return ""
        
        # Remove potentially dangerous characters
        import html
        return html.escape(text.strip())

# Factory function to create all models
def create_models(db_path: str = 'suzu_cafe.db'):
    """Create all model instances"""
    db_manager = DatabaseManager(db_path)
    
    return {
        'db_manager': db_manager,
        'user': User(db_manager),
        'otp': OTP(db_manager),
        'audit_log': AuditLog(db_manager),
        'code_generator': CodeGenerator(),
        'security': SecurityManager()
    }
