#!/usr/bin/env python3
"""
Suzu Cafe - Main Application Runner
Enhanced with OTP system and improved UI
"""

import os
import sys
import logging
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Import Flask app
from app import app, config

def setup_logging():
    """Setup comprehensive logging"""
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / 'suzu_cafe.log', encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )

def check_environment():
    """Check environment configuration"""
    logger = logging.getLogger(__name__)
    
    # Check Ultra Messages configuration
    if config.OTP_ENABLED:
        if not config.ULTRA_MSG_INSTANCE_ID or not config.ULTRA_MSG_TOKEN:
            logger.error("Ultra Messages not configured. OTP will not work.")
        else:
            logger.info("Ultra Messages configured successfully.")
    
    # Check database
    if not os.path.exists(config.DATABASE_PATH):
        logger.info(f"Database not found. Will be created at: {config.DATABASE_PATH}")
    
    # Check static and template directories
    static_dir = Path('static')
    templates_dir = Path('templates')
    
    if not static_dir.exists():
        logger.warning("Static directory not found. Some features may not work.")
    
    if not templates_dir.exists():
        logger.warning("Templates directory not found. Some features may not work.")

def main():
    """Main application entry point"""
    setup_logging()
    logger = logging.getLogger(__name__)
    
    logger.info("Starting Suzu Cafe Application...")
    logger.info(f"Environment: {config.FLASK_ENV}")
    logger.info(f"Debug Mode: {config.DEBUG}")
    logger.info(f"OTP Enabled: {config.OTP_ENABLED}")
    
    check_environment()
    
    try:
        # Run the application
        app.run(
            debug=config.DEBUG,
            host=config.HOST,
            port=config.PORT,
            threaded=True
        )
    except KeyboardInterrupt:
        logger.info("Application stopped by user.")
    except Exception as e:
        logger.error(f"Application error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
