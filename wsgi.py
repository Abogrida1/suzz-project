#!/usr/bin/env python3
"""
WSGI entry point for SUZZ Cafe production server
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Set environment variables for production
os.environ['FLASK_ENV'] = 'production'
os.environ['FLASK_DEBUG'] = 'False'

# Import the production app
from backend.app_production import app

if __name__ == "__main__":
    app.run()
