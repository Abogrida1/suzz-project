import os
from pathlib import Path

class ProductionConfig:
    """Production configuration optimized for hosting"""
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'suzu-cafe-production-secret-key-2024')
    FLASK_ENV = 'production'
    DEBUG = False
    
    # Server Configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # Database Configuration - Smart path detection
    def get_database_path():
        """Smart database path detection for different hosting environments"""
        possible_paths = [
            # Common hosting paths
            '/var/www/suzu_cafe.db',
            '/home/*/public_html/suzu_cafe.db',
            '/opt/lampp/htdocs/suzu_cafe.db',
            '/var/www/html/suzu_cafe.db',
            '/usr/local/var/www/suzu_cafe.db',
            
            # Relative paths (fallback)
            './suzu_cafe.db',
            '../suzu_cafe.db',
            '../../suzu_cafe.db',
            
            # Current directory
            str(Path(__file__).parent / 'suzu_cafe.db'),
            str(Path(__file__).parent.parent / 'suzu_cafe.db'),
        ]
        
        # Check environment variable first
        env_path = os.getenv('DATABASE_PATH')
        if env_path:
            return env_path
        
        # Try to find existing database
        for path in possible_paths:
            if '*' in path:  # Handle wildcard paths
                import glob
                matches = glob.glob(path)
                if matches:
                    return matches[0]
            elif os.path.exists(path):
                return path
        
        # Create in current directory if none found
        default_path = str(Path(__file__).parent / 'suzu_cafe.db')
        print(f"Database not found, will create at: {default_path}")
        return default_path
    
    DATABASE_PATH = get_database_path()
    
    # Ultra Messages Configuration
    ULTRA_MSG_INSTANCE_ID = os.getenv('ULTRA_MSG_INSTANCE_ID', 'instance139238')
    ULTRA_MSG_TOKEN = os.getenv('ULTRA_MSG_TOKEN', 'r2730b4840azy8k8')
    ULTRA_MSG_BASE_URL = 'https://api.ultramsg.com'
    
    # Admin Configuration
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'Suzz2212')
    
    # OTP Configuration
    OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', 5))
    OTP_LENGTH = int(os.getenv('OTP_LENGTH', 6))
    OTP_ENABLED = os.getenv('OTP_ENABLED', 'True').lower() == 'true'
    
    # Discount Configuration
    MIN_DISCOUNT = int(os.getenv('MIN_DISCOUNT', 10))
    MAX_DISCOUNT = int(os.getenv('MAX_DISCOUNT', 40))
    DISCOUNT_STEP = int(os.getenv('DISCOUNT_STEP', 5))
    
    # Rate Limiting Configuration
    RATE_LIMIT_REGISTER = int(os.getenv('RATE_LIMIT_REGISTER', 5))
    RATE_LIMIT_OTP = int(os.getenv('RATE_LIMIT_OTP', 10))
    RATE_LIMIT_ADMIN = int(os.getenv('RATE_LIMIT_ADMIN', 20))
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
    
    # Security Configuration
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PREFERRED_URL_SCHEME = 'https'
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', '/var/log/suzu_cafe.log')
    
    # WhatsApp Message Templates
    OTP_MESSAGE_TEMPLATE = os.getenv(
        'OTP_MESSAGE_TEMPLATE',
        "🔐 رمز التحقق الخاص بك في SUZZ كافيه: {otp}\n\nYour SUZZ Kafé verification code: {otp}\n\nصالح لمدة {minutes} دقائق / Valid for {minutes} minutes\n\n🏆 أول Drive-Thru في السويس"
    )
    
    # SMS Fallback Configuration
    SMS_FALLBACK_ENABLED = os.getenv('SMS_FALLBACK_ENABLED', 'False').lower() == 'true'
    SMS_API_KEY = os.getenv('SMS_API_KEY', '')
    SMS_API_BASE_URL = os.getenv('SMS_API_BASE_URL', 'https://api.sms-service.com')
    SMS_SENDER_ID = os.getenv('SMS_SENDER_ID', 'SuzuCafe')
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))  # 16MB
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    
    # Backup Configuration
    BACKUP_ENABLED = os.getenv('BACKUP_ENABLED', 'True').lower() == 'true'
    BACKUP_INTERVAL_HOURS = int(os.getenv('BACKUP_INTERVAL_HOURS', 24))
    BACKUP_RETENTION_DAYS = int(os.getenv('BACKUP_RETENTION_DAYS', 30))
    
    # Analytics Configuration
    GOOGLE_ANALYTICS_ID = os.getenv('GOOGLE_ANALYTICS_ID', '')
    FACEBOOK_PIXEL_ID = os.getenv('FACEBOOK_PIXEL_ID', '')
    
    # Email Configuration
    SMTP_SERVER = os.getenv('SMTP_SERVER', '')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@suzukafe.com')
    
    # Timezone Configuration
    TIMEZONE = os.getenv('TIMEZONE', 'Africa/Cairo')
    
    # Cache Configuration
    CACHE_TYPE = os.getenv('CACHE_TYPE', 'simple')
    CACHE_DEFAULT_TIMEOUT = int(os.getenv('CACHE_DEFAULT_TIMEOUT', 300))

# Production configuration instance
production_config = ProductionConfig()
