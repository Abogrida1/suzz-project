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
        try:
            print(f"Connecting to database: {self.db_path}")
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Enable column access by name
            print("Database connection successful")
            return conn
        except Exception as e:
            print(f"Database connection failed: {e}")
            raise e
    
    def init_database(self):
        """Initialize database with required tables"""
        try:
            print(f"=== DATABASE INITIALIZATION ===")
            print(f"Database path: {self.db_path}")
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            print("Creating users table...")
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
            print("Users table created/verified")
            
            print("Creating OTPs table...")
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
            print("OTPs table created/verified")
            
            print("Creating admin_sessions table...")
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
            print("Admin sessions table created/verified")
            
            print("Creating user_sessions table...")
            # Create user_sessions table for user session management
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
            print("User sessions table created/verified")
            
            print("Creating audit_log table...")
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
            print("Audit log table created/verified")
            
            print("Creating indexes...")
            # Create indexes for better performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_code ON users(unique_code)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone_number)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)')
            print("Indexes created/verified")
            
            conn.commit()
            print("Database committed successfully")
            conn.close()
            print("Database connection closed")
            print(f"=== DATABASE INITIALIZATION COMPLETE ===")
            
        except Exception as e:
            print(f"=== DATABASE INITIALIZATION ERROR ===")
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            try:
                conn.close()
            except:
                pass
            raise e

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
            
        except sqlite3.IntegrityError as e:
            print(f"Integrity error in create_user: {e}")
            if 'conn' in locals():
                conn.close()
            return False
        except Exception as e:
            print(f"Error in create_user: {e}")
            if 'conn' in locals():
                conn.close()
            return False

    def create_custom_discount(self, unique_code: str, discount_percentage: int, description: str, created_by: str, qr_code_data: dict = None) -> bool:
        """Create a custom admin discount"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # If no qr_code_data provided, create default one
            if qr_code_data is None:
                qr_code_data = {
                    'unique_code': unique_code,
                    'discount_percentage': discount_percentage,
                    'type': 'custom_admin_discount',
                    'description': description,
                    'created_by': created_by,
                    'created_at': datetime.now().isoformat()
                }
            
            # Convert qr_code_data to JSON string
            qr_code_json = json.dumps(qr_code_data, ensure_ascii=False)
            
            cursor.execute('''
                INSERT INTO users (phone_number, discount_percentage, unique_code, qr_code_data, is_verified, is_admin_discount, admin_description)
                VALUES (?, ?, ?, ?, TRUE, TRUE, ?)
            ''', ('', discount_percentage, unique_code, qr_code_json, description))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Error creating custom discount: {e}")
            if 'conn' in locals():
                conn.close()
            return False
    
    def get_user_by_phone(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Get user by phone number"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM users WHERE phone_number = ?', (phone_number,))
            row = cursor.fetchone()
            
            if row:
                # Get column names
                cursor.execute('PRAGMA table_info(users)')
                columns_info = cursor.fetchall()
                columns = [col[1] for col in columns_info]
                
                # Convert row to dictionary
                user_dict = dict(zip(columns, row))
                conn.close()
                return user_dict
            
            conn.close()
            return None
            
        except Exception as e:
            print(f"Error in get_user_by_phone: {e}")
            if 'conn' in locals():
                conn.close()
            return None
    
    def get_user_by_code(self, unique_code: str) -> Optional[Dict[str, Any]]:
        """Get user by unique code"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM users WHERE unique_code = ?', (unique_code,))
            row = cursor.fetchone()
            
            if row:
                # Get column names
                cursor.execute('PRAGMA table_info(users)')
                columns_info = cursor.fetchall()
                columns = [col[1] for col in columns_info]
                
                # Convert row to dictionary
                user_dict = dict(zip(columns, row))
                conn.close()
                return user_dict
            
            conn.close()
            return None
            
        except Exception as e:
            print(f"Error in get_user_by_code: {e}")
            if 'conn' in locals():
                conn.close()
            return None
    
    def verify_user(self, phone_number: str) -> bool:
        """Mark user as verified"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('UPDATE users SET is_verified = TRUE WHERE phone_number = ?', (phone_number,))
            success = cursor.rowcount > 0
            
            conn.commit()
            conn.close()
            return success
            
        except Exception as e:
            print(f"Error in verify_user: {e}")
            if 'conn' in locals():
                conn.close()
            return False
    
    def use_code(self, unique_code: str) -> bool:
        """Mark code as used"""
        try:
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
            
        except Exception as e:
            print(f"Error in use_code: {e}")
            if 'conn' in locals():
                conn.close()
            return False
    
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Get column names first
            cursor.execute('PRAGMA table_info(users)')
            columns_info = cursor.fetchall()
            columns = [col[1] for col in columns_info]
            
            cursor.execute('''
                SELECT phone_number, discount_percentage, unique_code, is_used, is_verified, created_at, used_at, is_admin_discount, admin_description
                FROM users ORDER BY created_at DESC
            ''')
            
            rows = cursor.fetchall()
            conn.close()
            
            # Convert rows to list of dictionaries
            users = []
            for row in rows:
                users.append({
                    'phone_number': row[0],
                    'discount_percentage': row[1],
                    'unique_code': row[2],
                    'is_used': row[3],
                    'is_verified': row[4],
                    'created_at': row[5],
                    'used_at': row[6],
                    'is_admin_discount': row[7],
                    'admin_description': row[8]
                })
            
            return users
            
        except Exception as e:
            print(f"Error in get_all_users: {e}")
            if 'conn' in locals():
                conn.close()
            return []
    
    def get_user_stats(self) -> Dict[str, int]:
        """Get comprehensive user statistics"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Total users
            cursor.execute('SELECT COUNT(*) FROM users')
            total_users = cursor.fetchone()[0]
            
            # Verified users
            cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = TRUE')
            verified_users = cursor.fetchone()[0]
            
            # Active users (verified and not used)
            cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = TRUE AND is_used = FALSE')
            active_users = cursor.fetchone()[0]
            
            # Used codes
            cursor.execute('SELECT COUNT(*) FROM users WHERE is_used = TRUE')
            used_codes = cursor.fetchone()[0]
            
            # Admin discounts
            cursor.execute('SELECT COUNT(*) FROM users WHERE is_admin_discount = TRUE')
            admin_discounts = cursor.fetchone()[0]
            
            # Regular users (non-admin)
            cursor.execute('SELECT COUNT(*) FROM users WHERE is_admin_discount = FALSE')
            regular_users = cursor.fetchone()[0]
            
            # Pending verification
            cursor.execute('SELECT COUNT(*) FROM users WHERE is_verified = FALSE')
            pending_verification = cursor.fetchone()[0]
            
            # Today's registrations
            cursor.execute('SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE("now")')
            today_registrations = cursor.fetchone()[0]
            
            # This week's registrations
            cursor.execute('SELECT COUNT(*) FROM users WHERE DATE(created_at) >= DATE("now", "-7 days")')
            this_week_registrations = cursor.fetchone()[0]
            
            # This month's registrations
            cursor.execute('SELECT COUNT(*) FROM users WHERE DATE(created_at) >= DATE("now", "-30 days")')
            this_month_registrations = cursor.fetchone()[0]
            
            # Total discounts (same as total users for now)
            total_discounts = total_users
            
            conn.close()
            
            return {
                'total_users': total_users,
                'verified_users': verified_users,
                'active_users': active_users,
                'total_discounts': total_discounts,
                'used_codes': used_codes,
                'admin_discounts': admin_discounts,
                'regular_users': regular_users,
                'pending_verification': pending_verification,
                'today_registrations': today_registrations,
                'this_week_registrations': this_week_registrations,
                'this_month_registrations': this_month_registrations
            }
            
        except Exception as e:
            print(f"Error in get_user_stats: {e}")
            if 'conn' in locals():
                conn.close()
            return {
                'total_users': 0,
                'verified_users': 0,
                'active_users': 0,
                'total_discounts': 0,
                'used_codes': 0,
                'admin_discounts': 0,
                'regular_users': 0,
                'pending_verification': 0,
                'today_registrations': 0,
                'this_week_registrations': 0,
                'this_month_registrations': 0
            }

class OTP:
    """OTP model for managing one-time passwords"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def create_otp(self, phone_number: str, otp_code: str, expiry_minutes: int = 5) -> bool:
        """Create a new OTP"""
        try:
            print(f"=== OTP CREATION DEBUG ===")
            print(f"Phone: {phone_number}")
            print(f"Code: {otp_code}")
            print(f"Expiry: {expiry_minutes} minutes")
            print(f"Database path: {self.db.db_path}")
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            print(f"Database connection established")
            
            # Clean up expired OTPs only, keep active ones
            cursor.execute('DELETE FROM otps WHERE phone_number = ? AND expires_at < ?', 
                         (phone_number, datetime.now()))
            deleted_count = cursor.rowcount
            print(f"Cleaned up {deleted_count} expired OTPs for {phone_number}")
            
            expires_at = datetime.now() + timedelta(minutes=expiry_minutes)
            print(f"OTP will expire at: {expires_at}")
            
            # Check if table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='otps'")
            table_exists = cursor.fetchone()
            print(f"OTPs table exists: {table_exists is not None}")
            
            if not table_exists:
                print("ERROR: OTPs table does not exist!")
                return False
            
            # Check table structure
            cursor.execute("PRAGMA table_info(otps)")
            columns = cursor.fetchall()
            print(f"Table columns: {[col[1] for col in columns]}")
            
            # Insert new OTP
            insert_sql = '''
                INSERT INTO otps (phone_number, otp_code, expires_at)
                VALUES (?, ?, ?)
            '''
            print(f"Insert SQL: {insert_sql}")
            print(f"Insert values: ({phone_number}, {otp_code}, {expires_at})")
            
            cursor.execute(insert_sql, (phone_number, otp_code, expires_at))
            
            print(f"OTP inserted successfully with ID: {cursor.lastrowid}")
            
            conn.commit()
            print(f"Database committed successfully")
            
            conn.close()
            print(f"Database connection closed")
            
            print(f"OTP created successfully: {phone_number} -> {otp_code} expires at {expires_at}")
            print(f"=== OTP CREATION SUCCESS ===")
            return True
            
        except Exception as e:
            print(f"=== OTP CREATION ERROR ===")
            print(f"Error: {e}")
            print(f"Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            
            try:
                if 'conn' in locals():
                    conn.close()
                    print("Database connection closed after error")
            except:
                print("Failed to close database connection")
            
            print(f"=== OTP CREATION FAILED ===")
            return False
    
    def verify_otp(self, phone_number: str, otp_code: str) -> bool:
        """Verify OTP code"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if OTP exists and is valid
            cursor.execute('''
                SELECT id, expires_at FROM otps 
                WHERE phone_number = ? AND otp_code = ? AND is_verified = FALSE
                ORDER BY created_at DESC LIMIT 1
            ''', (phone_number, otp_code))
            
            otp_record = cursor.fetchone()
            
            if not otp_record:
                print(f"OTP not found or already verified: {phone_number} -> {otp_code}")
                conn.close()
                return False
            
            # Check if OTP is expired
            expires_at = datetime.fromisoformat(otp_record[1])
            if expires_at <= datetime.now():
                print(f"OTP expired: {phone_number} -> {otp_code}")
                conn.close()
                return False
            
            # Mark OTP as verified (but don't delete it)
            cursor.execute('''
                UPDATE otps 
                SET is_verified = TRUE 
                WHERE id = ?
            ''', (otp_record[0],))
            
            success = cursor.rowcount > 0
            conn.commit()
            conn.close()
            
            if success:
                print(f"OTP verified successfully: {phone_number} -> {otp_code}")
            else:
                print(f"OTP verification failed: {phone_number} -> {otp_code}")
            
            return success
            
        except Exception as e:
            print(f"Error in verify_otp: {e}")
            if 'conn' in locals():
                conn.close()
            return False
    
    def get_active_otp(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Get active OTP for phone number"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT id, phone_number, otp_code, expires_at, is_verified, created_at, attempts
                FROM otps 
                WHERE phone_number = ? AND is_verified = FALSE
                ORDER BY created_at DESC LIMIT 1
            ''', (phone_number,))
            
            otp_record = cursor.fetchone()
            conn.close()
            
            if otp_record:
                # Check if OTP is expired
                expires_at = datetime.fromisoformat(otp_record[3])  # expires_at is at index 3
                if expires_at > datetime.now():
                    result = {
                        'id': otp_record[0],
                        'phone_number': otp_record[1],
                        'otp_code': otp_record[2],
                        'expires_at': otp_record[3],
                        'is_verified': otp_record[4],
                        'created_at': otp_record[5],
                        'attempts': otp_record[6]
                    }
                    print(f"Active OTP found: {phone_number} -> {result['otp_code']} expires at {expires_at}")
                    return result
                else:
                    print(f"OTP expired: {phone_number} -> {otp_record[3]}")
            else:
                print(f"No OTP found for: {phone_number}")
            return None
            
        except Exception as e:
            print(f"Error in get_active_otp: {e}")
            conn.close()
            return None
    
    def increment_attempts(self, phone_number: str) -> bool:
        """Increment OTP attempts for rate limiting"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                UPDATE otps 
                SET attempts = attempts + 1 
                WHERE phone_number = ? AND is_verified = FALSE
            ''', (phone_number,))
            
            success = cursor.rowcount > 0
            conn.commit()
            conn.close()
            return success
            
        except Exception as e:
            print(f"Error in increment_attempts: {e}")
            conn.close()
            return False
    
    def is_rate_limited(self, phone_number: str, max_attempts: int = 3) -> bool:
        """Check if phone number is rate limited"""
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT attempts, expires_at FROM otps 
                WHERE phone_number = ? AND is_verified = FALSE
                ORDER BY created_at DESC LIMIT 1
            ''', (phone_number,))
            
            otp_record = cursor.fetchone()
            conn.close()
            
            if otp_record:
                # Check if OTP is expired
                expires_at = datetime.fromisoformat(otp_record[1])
                if expires_at > datetime.now() and otp_record[0] >= max_attempts:
                    return True
            return False
            
        except Exception as e:
            print(f"Error in is_rate_limited: {e}")
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
        return f"SUZZ-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
    
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

class UserSession:
    """User session management"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def create_session(self, phone_number: str, session_token: str, expiry_hours: int = 24) -> bool:
        """Create a new user session"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Clean up expired sessions
            cursor.execute('DELETE FROM user_sessions WHERE expires_at < ?', (datetime.now(),))
            
            expires_at = datetime.now() + timedelta(hours=expiry_hours)
            
            cursor.execute('''
                INSERT OR REPLACE INTO user_sessions (phone_number, session_token, expires_at)
                VALUES (?, ?, ?)
            ''', (phone_number, session_token, expires_at))
            
            conn.commit()
            conn.close()
            print(f"User session created: {phone_number}")
            return True
            
        except Exception as e:
            print(f"Error creating user session: {e}")
            if 'conn' in locals():
                conn.close()
            return False
    
    def validate_session(self, session_token: str) -> Optional[str]:
        """Validate session token and return phone number"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT phone_number FROM user_sessions 
                WHERE session_token = ? AND expires_at > ? AND is_active = TRUE
            ''', (session_token, datetime.now()))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                print(f"Valid session found for: {result[0]}")
                return result[0]
            else:
                print("Invalid or expired session")
                return None
                
        except Exception as e:
            print(f"Error validating session: {e}")
            if 'conn' in locals():
                conn.close()
            return None
    
    def get_active_sessions(self, phone_number: str) -> List[Dict[str, Any]]:
        """Get active sessions for phone number"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT session_token, created_at, expires_at 
                FROM user_sessions 
                WHERE phone_number = ? AND expires_at > ? AND is_active = TRUE
                ORDER BY created_at DESC
            ''', (phone_number, datetime.now()))
            
            sessions = []
            for row in cursor.fetchall():
                sessions.append({
                    'session_token': row[0],
                    'created_at': row[1],
                    'expires_at': row[2]
                })
            
            conn.close()
            print(f"Found {len(sessions)} active sessions for {phone_number}")
            return sessions
                
        except Exception as e:
            print(f"Error getting active sessions: {e}")
            if 'conn' in locals():
                conn.close()
            return []
    
    def invalidate_session(self, session_token: str) -> bool:
        """Invalidate a session"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE user_sessions 
                SET is_active = FALSE 
                WHERE session_token = ?
            ''', (session_token,))
            
            success = cursor.rowcount > 0
            conn.commit()
            conn.close()
            
            if success:
                print(f"Session invalidated: {session_token}")
            return success
            
        except Exception as e:
            print(f"Error invalidating session: {e}")
            if 'conn' in locals():
                conn.close()
            return False

# Factory function to create all models
def create_models(db_path: str = 'suzu_cafe.db'):
    """Create all model instances"""
    try:
        print(f"=== CREATING MODELS ===")
        print(f"Database path: {db_path}")
        
        db_manager = DatabaseManager(db_path)
        print("Database manager created successfully")
        
        models = {
            'db_manager': db_manager,
            'user': User(db_manager),
            'otp': OTP(db_manager),
            'user_session': UserSession(db_manager),
            'audit_log': AuditLog(db_manager),
            'code_generator': CodeGenerator(),
            'security': SecurityManager()
        }
        
        print("All models created successfully")
        print(f"=== MODELS CREATION COMPLETE ===")
        
        return models
        
    except Exception as e:
        print(f"=== MODELS CREATION ERROR ===")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise e
