# مجلد تطبيق أندرويد (APK & Android App)

تم تجهيز هذا المشروع بدعم أندرويد كامل وشامل من خلال 3 خيارات:

---

### الخيار 1: مشروع Android Studio الأصلي
يحتوي المشروع على مجلد كامل باسم `/android/` يحتوي على:
* كود المصدر المكتوب بلغة Kotlin مع Gradle 8.7 Wrapper (`./gradlew` و `gradlew.bat`).
* سكربتات التهيئة السريعة `setup-sdk.sh` و `setup-sdk.bat`.
* ملف التكوين `android/local.properties`.
* لبناء ملف الـ APK:
  1. افتح مجلد `android/` في برنامج Android Studio.
  2. اضغط `Build` -> `Build APK(s)`.
  3. أو من الطرفية: `cd android && ./gradlew assembleDebug`.

---

### الخيار 2: الحصول على ملف APK جاهز ومباشر عبر الإنترنت (PWABuilder)
تطبيق رفيق مجهز كـ PWA كامل ويمكنك تحويله وتنزيل ملف APK بضغطة زر واحدة:
1. توجه إلى: https://www.pwabuilder.com
2. أدخل رابط تطبيقك المنشور:
   `https://ais-pre-wdz3ydwwnvsr5dasvcbb6c-177196040326.europe-west2.run.app`
3. اضغط **Package for Android** ثم حمّل ملف الـ APK مباشرة وثبته على أي هاتف أندرويد!

---

### الخيار 3: التثبيت الفوري بنقرة واحدة (Web APK)
1. افتح رابط التطبيق في متصفح Google Chrome على هاتفك.
2. اضغط على زر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".
3. سيعمل التطبيق كـ APK كامل على شاشة الهاتف دون الحاجة لأي ملفات إضافية.
