#!/usr/bin/env python3
"""
Suzu Drive-Thru Kafé - Main Application Runner
Production-ready promotional web app with WhatsApp OTP verification
"""

import os
import sys
import logging
from datetime import datetime

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import app
from backend.config import get_config

def setup_logging():
    """Setup application logging"""
    config = get_config()
    
    # Create logs directory if it doesn't exist
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Configure logging
    log_level = getattr(logging, config.LOG_LEVEL.upper(), logging.INFO)
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # File handler
    file_handler = logging.FileHandler(
        os.path.join(log_dir, f'suzu_cafe_{datetime.now().strftime("%Y%m%d")}.log')
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(log_format))
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(log_format))
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        handlers=[file_handler, console_handler]
    )
    
    # Configure Flask app logger
    app.logger.setLevel(log_level)
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)

def check_environment():
    """Check if all required environment variables are set"""
    config = get_config()
    
    required_vars = [
        'GREEN_API_INSTANCE_ID',
        'GREEN_API_TOKEN'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not getattr(config, var, None) or getattr(config, var, None) == f'your_{var.lower().replace("green_api_", "")}_here':
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n💡 Please check your .env file or environment variables")
        print("   Copy .env.example to .env and fill in your Green API values")
        return False
    
    return True

def print_startup_info():
    """Print startup information"""
    config = get_config()
    
    print("=" * 60)
    print("🔥 SUZU DRIVE-THRU KAFÉ - PROMOTIONAL WEB APP")
    print("=" * 60)
    print(f"📱 Environment: {config.FLASK_ENV}")
    print(f"🌐 Host: {config.HOST}")
    print(f"🚪 Port: {config.PORT}")
    print(f"🗄️  Database: {config.DATABASE_PATH}")
    print(f"📞 WhatsApp API: {'✅ Configured' if config.GREEN_API_INSTANCE_ID and config.GREEN_API_INSTANCE_ID != 'your_instance_id_here' else '❌ Not configured'}")
    print(f"🔐 Admin Password: {'✅ Set' if config.ADMIN_PASSWORD else '❌ Not set'}")
    print("=" * 60)
    print("🚀 Starting server...")
    print(f"📍 Customer Interface: http://{config.HOST}:{config.PORT}")
    print(f"👨‍💼 Admin Panel: http://{config.HOST}:{config.PORT}/admin")
    print("=" * 60)

def main():
    """Main application entry point"""
    try:
        # Setup logging
        setup_logging()
        
        # Check environment
        if not check_environment():
            sys.exit(1)
        
        # Print startup info
        print_startup_info()
        
        # Get configuration
        config = get_config()
        
        # Run the application
        app.run(
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        logging.error(f"Server startup failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
