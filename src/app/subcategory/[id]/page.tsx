'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc } from '@/hooks/useFirebase';
import { useCategories } from '@/components/providers/CategoryProvider';
import { ArrowRight, Download, Lock, Menu, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import ScrollReveal from '@/components/ScrollReveal';
import QuickShareButton from '@/components/QuickShareButton';
import { triggerFileDownload } from '@/lib/utils';

export default function SubCategoryPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { categoryMap } = useCategories();
  const { data: subCategoryDoc, loading: subLoading } = useDoc(id ? `categories/${id}` : '');
  const { data: itemsData, loading: itemsLoading } = useCollection(id ? `categories/${id}/items` : '');

  const subCategory = (id && categoryMap?.get(id)) || subCategoryDoc;
  const items = itemsData || [];

  const parseDateMs = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const t = new Date(val).getTime();
      return isNaN(t) ? 0 : t;
    }
    if (typeof val === 'object') {
      if (typeof val.toDate === 'function') {
        try { return val.toDate().getTime(); } catch { return 0; }
      }
      if (typeof val.seconds === 'number') {
        return val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1000000) : 0);
      }
    }
    return 0;
  };

  // Filter items by subCategoryId and sort by order / date / natural title
  const subItems = items
    .filter(item => !item.subCategoryId || item.subCategoryId === id)
    .sort((a, b) => {
      if (typeof a.order === 'number' && typeof b.order === 'number' && a.order !== b.order) {
        return a.order - b.order;
      }
      const timeA = parseDateMs(a.createdAt);
      const timeB = parseDateMs(b.createdAt);
      if (timeA && timeB && timeA !== timeB) {
        return timeB - timeA;
      }
      const titleA = a.title || '';
      const titleB = b.title || '';
      return titleA.localeCompare(titleB, 'ar', { numeric: true, sensitivity: 'base' });
    });

  return (
    <div className="min-h-screen bg-background pb-32">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div 
        className="text-primary-foreground px-6 pt-12 pb-20 rounded-b-[40px] relative"
        style={{ background: 'var(--primary-gradient)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white"
            title="رجوع"
          >
            <ArrowRight size={24} />
          </button>
        </div>
        
        <h1 className="text-3xl font-bold">
          {subLoading ? 'جاري التحميل...' : subCategory?.name || 'القسم الفرعي'}
        </h1>
        <p className="opacity-80 mt-2">
          {subItems.length} عنصر متوفر في هذا القسم
        </p>
      </div>

      <main className="px-6 -mt-10">
        <div className="space-y-4">
          {itemsLoading ? (
            <div className="text-center py-20 text-muted-foreground">جاري تحميل المحتوى...</div>
          ) : subItems.length > 0 ? (
            subItems.map((item, index) => (
              <ScrollReveal
                key={`${item.id}-${index}`}
                staggerIndex={index}
                className="bg-card p-4 rounded-3xl shadow-sm border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Download size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {item.showDownloadButton !== false && (
                    <button 
                      className="text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                      style={{ background: 'var(--primary-gradient)' }}
                      onClick={() => item.downloadUrl && triggerFileDownload(item.downloadUrl, item.title)}
                    >
                      تحميل
                    </button>
                  )}
                  <QuickShareButton item={item} category={subCategory} variant="outline" className="h-9 w-9 rounded-xl shrink-0" />
                </div>
              </ScrollReveal>
            ))
          ) : (
            <div className="bg-card p-12 rounded-[40px] text-center shadow-sm border border-border">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Sparkles size={40} />
              </div>
              <h3 className="text-foreground font-bold text-lg">لا يوجد محتوى بعد</h3>
              <p className="text-muted-foreground text-sm mt-2">
                سيتم إضافة المحتوى قريباً في هذا القسم الفرعي.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
