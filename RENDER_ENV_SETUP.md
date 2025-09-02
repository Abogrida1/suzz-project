# 🔧 إعداد متغيرات البيئة في Render

## 📋 متغيرات البيئة المطلوبة

### **1. اذهب إلى Render Dashboard:**
- https://dashboard.render.com
- اختر مشروعك: `suzz-project-3`

### **2. اضغط "Environment":**

#### **Backend Environment Variables:**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://madoabogrida05_db_user:gdfk1C6pfnlFIG6I@cluster0.3kkot5p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=secure-chat-app-super-secret-jwt-key-2024-production
CLIENT_URL=https://suzz-project-3.onrender.com
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=https://suzz-project-3.onrender.com
```

#### **Frontend Environment Variables (إذا كان منفصل):**
```
REACT_APP_SERVER_URL=https://suzz-project-3.onrender.com
REACT_APP_APP_NAME=Secure Chat App
```

### **3. بعد إضافة المتغيرات:**
- اضغط "Save Changes"
- اضغط "Manual Deploy" → "Deploy latest commit"
- انتظر إعادة النشر

### **4. التحقق من النشر:**
- **Health Check:** https://suzz-project-3.onrender.com/api/health
- **تطبيق الشات:** https://suzz-project-3.onrender.com/app
- **الصفحة الرئيسية:** https://suzz-project-3.onrender.com

## ✅ النتيجة المتوقعة:
- ✅ MongoDB سيتصل بنجاح
- ✅ Frontend سيعمل بشكل صحيح
- ✅ تطبيق الشات سيكون متاحاً بالكامل
- ✅ لا توجد أخطاء CORS
- ✅ Socket.IO سيعمل بشكل صحيح

## 🚨 ملاحظات مهمة:
- تأكد من نسخ المتغيرات بدقة
- لا تضع مسافات إضافية
- تأكد من أن MongoDB URI صحيح
- JWT_SECRET يجب أن يكون قوياً
