# مشروع تطبيق أندرويد لتطبيق "رفيق" (Android Studio Project)

هذا المجلد يحتوي على كود تطبيق أندرويد الأصلي (Native Android App) الكامل لتطبيق "رفيق".

## محتويات المشروع
* **لغة البرمجة والمواصفات:**
  - Kotlin مع Android WebView مخصص ومحسن للأداء.
  - `compileSdk`: 34 (Android 14)
  - `targetSdk`: 34
  - `minSdk`: 24 (يدعم أكثر من 95% من أجهزة أندرويد)
  - `buildToolsVersion`: 34.0.0
* **Gradle Wrapper:**
  - تم تضمين `gradlew` و `gradlew.bat` مع `gradle/wrapper/gradle-wrapper.jar` (إصدار Gradle 8.7) للبناء الفوري بدون الحاجة لتثبيت Gradle يدوياً.
* **سكربتات التكوين:**
  - `android/local.properties` محدد ومعد للاستخدام.
  - `setup-sdk.sh` (Linux/macOS) و `setup-sdk.bat` (Windows).
* **المميزات المدمجة في التطبيق:**
  - دعم كامل للتحميل والتنزيل عبر `DownloadManager` في خلفية الهاتف.
  - دعم رفع واختيار الصور والملفات عبر `onShowFileChooser`.
  - معالجة ذكية للزر الفيزيائي للرجوع (Hardware Back Button).
  - دعم فتح روابط تطبيقات الطرف الثالث (واتساب، تليجرام، المكالمات، الإيميل).
  - شريط تقدم تحميل صفحات ناعم وسريع (ProgressBar) وتحديث بالسحب (Pull to Refresh).
  - دعم التخزين المؤقت المحلي الكامل والأوفلاين (DOM Storage & Cache).

## كيفية بناء ملف الـ APK في Android Studio:
1. افتح برنامج **Android Studio** على حاسوبك.
2. اختر **Open** ثم حدد مجلد `android` من هذا المشروع.
3. انتظر حتى ينتهي الـ Gradle Sync.
4. من القائمة العلوية اضغط على:
   `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
5. سيتم إنشاء وتوليد ملف `app-debug.apk` داخل:
   `android/app/build/outputs/apk/debug/app-debug.apk`!

## كيفية البناء عبر موجه الأوامر (Terminal):
```bash
cd android
./gradlew assembleDebug
```
ستجد ملف الـ APK جاهزاً للتثبيت فوراً.
