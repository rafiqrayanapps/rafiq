'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCollection, useDoc } from '@/hooks/useFirebase';
import { ArrowRight, Download, Lock, Menu, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';

export default function SubCategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: subCategory, loading: subLoading } = useDoc(`subCategories/${id}`);
  const { data: itemsData, loading: itemsLoading } = useCollection('items');

  const items = itemsData || [];

  // Filter items by subCategoryId
  const subItems = items.filter(item => item.subCategoryId === id);

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
            className="p-2 bg-white/20 rounded-xl"
          >
            <ArrowRight size={24} />
          </button>
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-white/20 rounded-xl"
          >
            <Menu size={24} />
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
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
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
                
                {item.showDownloadButton !== false && (
                  <button 
                    className="text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                    style={{ background: 'var(--primary-gradient)' }}
                    onClick={() => item.downloadUrl && window.open(item.downloadUrl, '_blank')}
                  >
                    تحميل
                  </button>
                )}
              </motion.div>
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
