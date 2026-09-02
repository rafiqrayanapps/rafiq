import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 px-4 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 text-2xl font-black">
        404
      </div>
      <h1 className="text-2xl font-black mb-2">الصفحة غير موجودة</h1>
      <p className="text-gray-500 mb-6 text-sm max-w-md">
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. قد تكون الصفحة قد تم نقلها أو حذفها.
      </p>
      <Link
        href="/"
        className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm shadow-md"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
