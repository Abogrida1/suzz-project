# 📦 Suzu Drive-Thru Kafé - Deployment Package

## 🚀 Essential Files for Hosting

### 📁 Core Application Files
```
├── requirements.txt          # Python dependencies
├── Procfile                 # Heroku deployment config
├── run.py                   # Main application runner
├── .env                     # Environment variables (create from .env.example)
└── backend/
    ├── app.py               # Flask main application
    ├── config.py            # Configuration settings
    ├── models.py            # Database models
    └── requirements.txt     # Backend dependencies
```

### 🎨 Frontend Assets
```
├── static/
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   ├── main.js          # Main JavaScript functionality
│   │   ├── phone-input.js   # Phone input handling
│   │   └── image-optimizer.js # Image optimization
│   └── images/
│       ├── logo.svg         # Brand logo
│       └── [product images]  # Product images (keep only used ones)
└── templates/
    ├── index.html           # Main customer page
    └── admin.html           # Admin panel
```

### 📋 Deployment Checklist

## 🔧 Setup Instructions

### 1. Environment Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables
Create `.env` file:
```
FLASK_ENV=production
HOST=0.0.0.0
PORT=5000
GREEN_API_INSTANCE_ID=your_instance_id
GREEN_API_TOKEN=your_token
ADMIN_PASSWORD=your_admin_password
```

### 3. Database Setup
```bash
# Database will auto-create on first run
# Ensure logs/ directory exists
mkdir logs
```

### 4. Static Assets Optimization
- Keep only used images in static/images/
- Minify CSS/JS if needed
- Ensure all external CDN links are working

## 🌐 Hosting Deployment

### Heroku Deployment
```bash
# Install Heroku CLI
heroku login

# Create app
heroku create suzu-cafe-app

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set GREEN_API_INSTANCE_ID=your_instance_id
heroku config:set GREEN_API_TOKEN=your_token
heroku config:set ADMIN_PASSWORD=your_password

# Deploy
git add .
git commit -m "Initial deployment"
git push heroku main
```

### Alternative Hosting (Any VPS/Shared Hosting)
1. Upload all essential files
2. Install Python dependencies
3. Set up environment variables
4. Run with Gunicorn:
   ```bash
   gunicorn run:app
   ```

## 📊 File Size Optimization

### Remove Development Files
- Remove unused JS files (main-clean.js, main-fixed.js, etc.)
- Remove unused images
- Remove .git directory if not needed
- Remove logs/ directory (will auto-create)

### Essential Files Only (~2-3MB total)
- Python files: ~50KB
- Templates: ~20KB
- CSS: ~15KB
- JS (minified): ~30KB
- Images (optimized): ~2MB

## 🔍 Testing Checklist

- [ ] Phone registration works
- [ ] QR code generation works
- [ ] Admin panel accessible
- [ ] Database creates successfully
- [ ] Static files serve correctly
- [ ] Environment variables loaded
- [ ] WhatsApp integration functional

## 🚨 Common Issues & Solutions

1. **Database Error**: Ensure write permissions for database directory
2. **Static Files 404**: Check static folder path in app.py
3. **WhatsApp Not Working**: Verify Green API credentials
4. **Admin Access**: Ensure ADMIN_PASSWORD is set

## 📞 Support Files

For any issues, check:
- logs/suzu_cafe_*.log (application logs)
- Browser console for frontend errors
- Heroku logs (if using Heroku)

---

**Ready to deploy!** This package contains only the essential files needed for production hosting.
