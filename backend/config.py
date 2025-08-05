import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'suzu-cafe-secret-key-2024')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Server Configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # Database Configuration
    DATABASE_PATH = os.getenv('DATABASE_PATH', 'suzu_cafe.db')
    
    # GreenAPI Configuration
    GREEN_API_INSTANCE_ID = os.getenv('GREEN_API_INSTANCE_ID', '7105295516')
    GREEN_API_TOKEN = os.getenv('GREEN_API_TOKEN', 'ca6c383f4b8c4441992204cd3f903f882ccb29c65ae44106bf')
    GREEN_API_BASE_URL = 'https://api.green-api.com'
    
    # Admin Configuration
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'Suzz2212')
    
    # OTP Configuration
    OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', 5))
    OTP_LENGTH = int(os.getenv('OTP_LENGTH', 6))
    
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
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = os.getenv('SESSION_COOKIE_HTTPONLY', 'True').lower() == 'true'
    SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'suzu_cafe.log')
    
    # WhatsApp Message Templates
    OTP_MESSAGE_TEMPLATE = os.getenv(
        'OTP_MESSAGE_TEMPLATE',
        "🔐 رمز التحقق الخاص بك في سوزو كافيه: {otp}\n\nYour Suzu Kafé verification code: {otp}\n\nصالح لمدة {minutes} دقائق / Valid for {minutes} minutes"
    )
    
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

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    FLASK_ENV = 'production'
    SESSION_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = 'https'

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True
    DATABASE_PATH = ':memory:'  # Use in-memory database for testing

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
