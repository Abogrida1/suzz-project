#!/usr/bin/env python3
"""
Suzu Drive-Thru Kafé - Deployment Package Creator
Creates a clean deployment folder with only essential files
"""

import os
import shutil
import glob
from pathlib import Path

def create_deployment_package():
    """Create a deployment package with essential files only"""
    
    # Create deployment directory
    deployment_dir = "suzu-deployment"
    if os.path.exists(deployment_dir):
        shutil.rmtree(deployment_dir)
    
    os.makedirs(deployment_dir)
    os.makedirs(f"{deployment_dir}/backend")
    os.makedirs(f"{deployment_dir}/static/css")
    os.makedirs(f"{deployment_dir}/static/js")
    os.makedirs(f"{deployment_dir}/static/images")
    os.makedirs(f"{deployment_dir}/templates")
    os.makedirs(f"{deployment_dir}/logs")
    
    # Essential files to copy
    essential_files = {
        # Root files
        "requirements.txt": "requirements.txt",
        "Procfile": "Procfile",
        "run.py": "run.py",
        
        # Backend files
        "backend/app.py": "backend/app.py",
        "backend/config.py": "backend/config.py",
        "backend/models.py": "backend/models.py",
        "backend/requirements.txt": "backend/requirements.txt",
        
        # Static files
        "static/css/style.css": "static/css/style.css",
        "static/js/main.js": "static/js/main.js",
        "static/js/phone-input.js": "static/js/phone-input.js",
        "static/js/image-optimizer.js": "static/js/image-optimizer.js",
        
        # Templates
        "templates/index.html": "templates/index.html",
        "templates/admin.html": "templates/admin.html",
    }
    
    # Copy essential files
    for source, dest in essential_files.items():
        if os.path.exists(source):
            shutil.copy2(source, f"{deployment_dir}/{dest}")
            print(f"✅ Copied: {source}")
        else:
            print(f"❌ Missing: {source}")
    
    # Copy used images only
    used_images = [
        "static/images/logo.svg",
        "static/images/whatsapp_image_1.jpg",
        "static/images/whatsapp_image_2.jpg",
        "static/images/WhatsApp Image 2025-08-04 at 03.22.59_8508aa3a.jpg",
        "static/images/WhatsApp Image 2025-08-04 at 03.23.05_d23941ee.jpg"
    ]
    
    for img in used_images:
        if os.path.exists(img):
            shutil.copy2(img, f"{deployment_dir}/{img}")
            print(f"✅ Copied image: {img}")
    
    # Create .env.example
    env_example = """# Suzu Drive-Thru Kafé - Environment Variables

# Flask Configuration
FLASK_ENV=production
HOST=0.0.0.0
PORT=5000
DEBUG=False

# Green API Configuration (WhatsApp)
GREEN_API_INSTANCE_ID=your_instance_id_here
GREEN_API_TOKEN=your_token_here

# Admin Configuration
ADMIN_PASSWORD=your_secure_password_here

# Database
DATABASE_PATH=users.db

# Logging
LOG_LEVEL=INFO
"""
    
    with open(f"{deployment_dir}/.env.example", "w", encoding="utf-8") as f:
        f.write(env_example)
    
    # Create deployment README
    deployment_readme = """# 🚀 Suzu Drive-Thru Kafé - Deployment Package

## Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Run Application**
   ```bash
   python run.py
   ```

## Files Included
- ✅ Essential Python files
- ✅ Frontend assets (CSS, JS, images)
- ✅ HTML templates
- ✅ Configuration files
- ✅ Database models

## Deployment Options
- **Heroku**: Use Procfile provided
- **VPS**: Run with gunicorn: `gunicorn run:app`
- **Shared Hosting**: Upload all files and configure Python

## Size
Total package size: ~3MB (optimized for fast deployment)
"""
    
    with open(f"{deployment_dir}/DEPLOYMENT_README.md", "w", encoding="utf-8") as f:
        f.write(deployment_readme)
    
    # Create a zip file
    shutil.make_archive("suzu-deployment-package", 'zip', deployment_dir)
    
    print("\n" + "="*50)
    print("🎉 Deployment Package Created Successfully!")
    print("="*50)
    print(f"📁 Folder: {deployment_dir}/")
    print(f"📦 ZIP: suzu-deployment-package.zip")
    print(f"📊 Size: ~{get_folder_size(deployment_dir):.1f} MB")
    print("\n🚀 Ready for deployment!")

def get_folder_size(folder_path):
    """Get folder size in MB"""
    total_size = 0
    for path, dirs, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(path, file)
            if os.path.exists(file_path):
                total_size += os.path.getsize(file_path)
    return total_size / (1024 * 1024)

if __name__ == "__main__":
    create_deployment_package()
