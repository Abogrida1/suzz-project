# Ultra Messages Configuration
ULTRA_MSG_INSTANCE_ID=instance139238
ULTRA_MSG_TOKEN=r2730b4840azy8k8

# OTP Configuration
OTP_ENABLED=True
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=suzu-cafe-secret-key-2024

# Server Configuration
HOST=0.0.0.0
PORT=5000

# Database Configuration
DATABASE_PATH=suzu_cafe.db

# Admin Configuration
ADMIN_PASSWORD=Suzz2212

# GreenAPI Configuration (Fallback)
GREEN_API_INSTANCE_ID=7105295516
GREEN_API_TOKEN=ca6c383f4b8c4441992204cd3f903f882ccb29c65ae44106bf

# Rate Limiting Configuration
RATE_LIMIT_REGISTER=5
RATE_LIMIT_OTP=10
RATE_LIMIT_ADMIN=20

# CORS Configuration
CORS_ORIGINS=*

# Security Configuration
SESSION_COOKIE_SECURE=False
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Lax

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=suzu_cafe.log

# WhatsApp Message Template
OTP_MESSAGE_TEMPLATE=🔐 رمز التحقق الخاص بك في سوزو كافيه: {otp}\n\nYour Suzu Kafé verification code: {otp}\n\nصالح لمدة {minutes} دقائق / Valid for {minutes} minutes

# SMS Fallback Configuration
SMS_FALLBACK_ENABLED=False
SMS_API_KEY=
SMS_API_BASE_URL=https://api.sms-service.com
SMS_SENDER_ID=SuzuCafe

# File Upload Configuration
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploads

# Backup Configuration
BACKUP_ENABLED=True
BACKUP_INTERVAL_HOURS=24
BACKUP_RETENTION_DAYS=30

# Analytics Configuration
GOOGLE_ANALYTICS_ID=
FACEBOOK_PIXEL_ID=

# Email Configuration
SMTP_SERVER=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
ADMIN_EMAIL=admin@suzukafe.com

# Timezone Configuration
TIMEZONE=Africa/Cairo

# Cache Configuration
CACHE_TYPE=simple
CACHE_DEFAULT_TIMEOUT=300