'use client';
import Header from '@/components/Header';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-secondary">
      <Header title="حسابي" showBackButton={true} />
      <main className="px-6 pt-6 text-center text-muted-foreground">
        صفحة الملف الشخصي قيد التطوير...
      </main>
    </div>
  );
}
