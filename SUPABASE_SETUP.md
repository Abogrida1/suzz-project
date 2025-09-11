# 🚀 دليل ربط Admin Dashboard بقاعدة البيانات

## 📋 الخطوات المطلوبة

### 1️⃣ إنشاء مشروع Supabase

1. **اذهب إلى**: https://supabase.com
2. **سجل دخول** أو أنشئ حساب جديد
3. **اضغط على "New Project"**
4. **املأ البيانات**:
   - Project Name: `healthy-food-delivery`
   - Organization: اختر المنظمة
   - Database Password: كلمة مرور قوية (احفظها!)
   - Region: اختر أقرب منطقة (مثل Frankfurt)

### 2️⃣ الحصول على معلومات الاتصال

بعد إنشاء المشروع، ستجد في **Settings → API**:

```
Project URL: https://your-project-id.supabase.co
Project API Keys:
  - anon/public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ إعداد متغيرات البيئة

في مجلد `admin_dashboard`، أنشئ ملف `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4️⃣ إنشاء الجداول في قاعدة البيانات

اذهب إلى **SQL Editor** في Supabase ونفذ الكود التالي:

```sql
-- إنشاء الجداول الأساسية
-- (سيتم تشغيل هذا الكود تلقائياً)
```

### 5️⃣ إضافة بيانات تجريبية

```sql
-- بيانات تجريبية للاختبار
-- (سيتم إضافتها تلقائياً)
```

### 6️⃣ تشغيل Admin Dashboard

```bash
cd admin_dashboard
npm install
npm run dev
```

---

## 🔐 معلومات تسجيل الدخول الافتراضية

**للمدير:**
- Email: admin@greebite.com
- Password: (ستحتاج إنشاءه في Supabase Auth)

---

## ⚡ اختبار الاتصال

عند تشغيل Dashboard، ستتمكن من:
- ✅ تسجيل الدخول
- ✅ عرض الإحصائيات
- ✅ إدارة المطاعم والطلبات
- ✅ إنشاء كوبونات جديدة
