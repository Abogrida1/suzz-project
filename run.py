#!/usr/bin/env python3
"""
YouTube Downloader - Local Development Server
Run this file to start the application locally
"""

import os
import sys
from app import app

if __name__ == '__main__':
    print("🚀 Starting YouTube Downloader...")
    print("📱 Open your browser and go to: http://localhost:5000")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        app.run(
            debug=True,
            host='0.0.0.0',
            port=int(os.environ.get('PORT', 5000)),
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")
        sys.exit(0)
