# 🚀 دليل نشر SUZZ Cafe على الاستضافة

## 📋 المتطلبات الأساسية

### **1. متطلبات الاستضافة:**
- **Python 3.8+** مدعوم
- **SQLite** مدعوم (مدمج مع Python)
- **Flask** مدعوم
- **HTTPS** مدعوم
- **SSH** أو **FTP** للرفع

### **2. متطلبات Python:**
```bash
pip install -r requirements_production.txt
```

## 🔧 إعدادات الإنتاج

### **1. ملف الإعدادات:**
استخدم `production_config.env` أو أنشئ ملف `.env` في مجلد الاستضافة:

```env
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-super-secret-production-key-here
DATABASE_PATH=/path/to/your/hosting/suzu_cafe.db
```

### **2. مسارات قاعدة البيانات الشائعة:**

#### **للاستضافة المشتركة (Shared Hosting):**
```env
DATABASE_PATH=/home/username/public_html/suzu_cafe.db
DATABASE_PATH=/home/username/domains/yourdomain.com/public_html/suzu_cafe.db
```

#### **للاستضافة VPS/Dedicated:**
```env
DATABASE_PATH=/var/www/suzu_cafe.db
DATABASE_PATH=/opt/lampp/htdocs/suzu_cafe.db
```

#### **للاستضافة Windows:**
```env
DATABASE_PATH=C:\inetpub\wwwroot\suzu_cafe.db
DATABASE_PATH=C:\xampp\htdocs\suzu_cafe.db
```

## 📁 هيكل الملفات للإنتاج

```
yourdomain.com/
├── wsgi.py                    # نقطة الدخول الرئيسية
├── app_production.py          # التطبيق المحسن للإنتاج
├── config_production.py       # إعدادات الإنتاج
├── requirements_production.txt # متطلبات الإنتاج
├── production_config.env      # متغيرات البيئة
├── suzu_cafe.db              # قاعدة البيانات
├── static/                    # الملفات الثابتة
│   ├── css/
│   ├── js/
│   └── images/
└── templates/                 # قوالب HTML
    ├── index.html
    └── admin.html
```

## 🚀 خطوات النشر

### **الخطوة 1: رفع الملفات**
```bash
# عبر FTP/SFTP
ftp yourdomain.com
cd public_html
put -r *

# أو عبر Git
git clone https://github.com/yourusername/suzz-project.git
cd suzz-project
```

### **الخطوة 2: تثبيت المتطلبات**
```bash
# في مجلد الاستضافة
pip install -r requirements_production.txt

# أو تثبيت كل حزمة على حدة
pip install Flask==2.3.3
pip install Flask-CORS==4.0.0
pip install requests==2.31.0
pip install pyotp==2.9.0
pip install qrcode==7.4.2
pip install Pillow==10.0.1
pip install python-dotenv==1.0.0
```

### **الخطوة 3: إعداد قاعدة البيانات**
```bash
# إنشاء قاعدة البيانات
python -c "
from backend.models import create_models
from backend.config_production import production_config
models = create_models(production_config.DATABASE_PATH)
print('Database created successfully!')
"
```

### **الخطوة 4: اختبار التطبيق**
```bash
# تشغيل التطبيق محلياً للاختبار
python wsgi.py

# أو
python backend/app_production.py
```

## 🌐 إعدادات الخادم

### **1. Apache (mod_wsgi):**
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /path/to/your/hosting
    
    WSGIDaemonProcess suzz python-path=/path/to/your/hosting
    WSGIProcessGroup suzz
    WSGIScriptAlias / /path/to/your/hosting/wsgi.py
    
    <Directory /path/to/your/hosting>
        Require all granted
    </Directory>
</VirtualHost>
```

### **2. Nginx + Gunicorn:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static {
        alias /path/to/your/hosting/static;
    }
}
```

### **3. Gunicorn Configuration:**
```bash
# gunicorn.conf.py
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
```

## 🔒 إعدادات الأمان

### **1. متغيرات البيئة:**
```env
SECRET_KEY=your-super-secret-production-key-here
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Lax
```

### **2. HTTPS:**
```apache
# Redirect HTTP to HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### **3. Rate Limiting:**
```python
# في app_production.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
```

## 📊 مراقبة الأداء

### **1. Health Check:**
```bash
# اختبار صحة النظام
curl https://yourdomain.com/health
```

### **2. Logs:**
```bash
# مراقبة السجلات
tail -f /var/log/suzu_cafe.log
tail -f /var/log/apache2/error.log
tail -f /var/log/nginx/error.log
```

### **3. Database Monitoring:**
```bash
# فحص قاعدة البيانات
sqlite3 suzu_cafe.db ".tables"
sqlite3 suzu_cafe.db "SELECT COUNT(*) FROM users;"
```

## 🛠️ استكشاف الأخطاء

### **1. مشاكل قاعدة البيانات:**
```bash
# فحص الصلاحيات
ls -la suzu_cafe.db
chmod 644 suzu_cafe.db

# فحص المسار
python -c "
import os
print('Current directory:', os.getcwd())
print('Database path:', '/path/to/your/hosting/suzu_cafe.db')
print('Database exists:', os.path.exists('/path/to/your/hosting/suzu_cafe.db'))
"
```

### **2. مشاكل Python:**
```bash
# فحص إصدار Python
python --version
python3 --version

# فحص الحزم المثبتة
pip list
pip3 list
```

### **3. مشاكل الخادم:**
```bash
# فحص حالة Apache
sudo systemctl status apache2
sudo apache2ctl -t

# فحص حالة Nginx
sudo systemctl status nginx
sudo nginx -t
```

## 📱 اختبار الوظائف

### **1. اختبار التسجيل:**
```bash
curl -X POST https://yourdomain.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "1234567890"}'
```

### **2. اختبار لوحة الإدارة:**
```bash
curl -X POST https://yourdomain.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "mado", "password": "Suzz2212"}'
```

### **3. اختبار الصفحة الرئيسية:**
```bash
curl https://yourdomain.com/
```

## 🔄 التحديثات والصيانة

### **1. النسخ الاحتياطي:**
```bash
# نسخ احتياطي لقاعدة البيانات
cp suzu_cafe.db suzu_cafe_backup_$(date +%Y%m%d_%H%M%S).db

# نسخ احتياطي للملفات
tar -czf suzz_backup_$(date +%Y%m%d_%H%M%S).tar.gz *
```

### **2. التحديثات:**
```bash
# سحب التحديثات من Git
git pull origin main

# إعادة تشغيل الخادم
sudo systemctl restart apache2
sudo systemctl restart nginx
```

### **3. المراقبة المستمرة:**
```bash
# إنشاء script مراقبة
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
    if ! curl -s https://yourdomain.com/health > /dev/null; then
        echo "$(date): Site is down!" >> /var/log/suzz_monitor.log
        # إرسال تنبيه
    fi
    sleep 300  # فحص كل 5 دقائق
done
EOF

chmod +x monitor.sh
nohup ./monitor.sh &
```

## 📞 الدعم والمساعدة

### **1. معلومات الاتصال:**
- **المطور:** [اسمك]
- **البريد الإلكتروني:** [بريدك]
- **GitHub:** [رابط المستودع]

### **2. الموارد المفيدة:**
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/2.3.x/deploying/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Gunicorn Documentation](https://docs.gunicorn.org/)

### **3. الأخطاء الشائعة:**
- **خطأ 500:** مشكلة في قاعدة البيانات أو الكود
- **خطأ 404:** مسار خاطئ أو ملف مفقود
- **خطأ 403:** مشكلة في الصلاحيات

## ✅ قائمة التحقق النهائية

- [ ] تم رفع جميع الملفات
- [ ] تم تثبيت المتطلبات
- [ ] تم إنشاء قاعدة البيانات
- [ ] يعمل التطبيق محلياً
- [ ] تم إعداد الخادم
- [ ] يعمل HTTPS
- [ ] تم اختبار جميع الوظائف
- [ ] تم إعداد النسخ الاحتياطي
- [ ] تم إعداد المراقبة

---

**🎉 تهانينا! موقع SUZZ Cafe يعمل الآن على الاستضافة!**

**🌐 الرابط:** https://yourdomain.com
**🔐 لوحة الإدارة:** https://yourdomain.com/admin
**📊 فحص الصحة:** https://yourdomain.com/health
