# إصلاح مشكلة ظهور "Replying to" مرتين

## المشكلة ❌
"Replying to suzz" كانت تظهر مرتين في نفس الرسالة، واحدة تحت الأخرى.

## السبب 🔍
كان هناك **كود مكرر** في `MessageBubble.js`:

### المكان الأول (خطأ):
```javascript
// في renderMessageContent function (السطر 190-203)
if (message.replyTo && message.replyTo.message) {
  return (
    <div className="space-y-2">
      <div className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-r-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Replying to {message.replyTo.sender?.displayName || message.replyTo.sender?.username}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {message.replyTo.content}
        </p>
      </div>
      <div className="text-sm">{message.content}</div>
    </div>
  );
}
```

### المكان الثاني (صحيح):
```javascript
// في الـ JSX الرئيسي (السطر 284-297)
{message.replyTo && (
  <div className={`mb-2 p-2 rounded-lg border-l-4 ${
    isOwn 
      ? 'bg-primary-400 border-primary-300' 
      : 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500'
  }`}>
    <p className="text-xs font-medium opacity-75">
      Replying to {message.replyTo.sender?.displayName || message.replyTo.sender?.username || 'Unknown'}
    </p>
    <p className="text-xs opacity-75 truncate">
      {message.replyTo.content}
    </p>
  </div>
)}
```

## الحل ✅
تم **حذف الكود المكرر** من `renderMessageContent` function.

## النتيجة 🎉
الآن "Replying to" تظهر **مرة واحدة فقط** في كل رسالة، كما هو مطلوب.

## الملفات المحدثة
- `frontend/src/components/MessageBubble.js` - حذف الكود المكرر

## التأكيد
✅ لا توجد أخطاء في الكود  
✅ "Replying to" تظهر مرة واحدة فقط  
✅ التصميم يعمل بشكل صحيح  

المشكلة تم حلها بالكامل! 🎉
