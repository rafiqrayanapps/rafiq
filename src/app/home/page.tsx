'use client';
import { useState, useMemo, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { WithId } from '@/firebase';
import type { Category as CategoryType } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Hammer, Heart, Bell, AlertCircle } from 'lucide-react';
import CategorySkeleton from '@/components/skeletons/CategorySkeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCategories } from '@/components/providers/CategoryProvider';
import { cn } from '@/lib/utils';
import MaintenanceModal from '@/components/MaintenanceModal';
import Sidebar from '@/components/Sidebar';
import FavoritesTab from '@/components/tabs/FavoritesTab';
import NotificationsTab from '@/components/tabs/NotificationsTab';

function HomeContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { mainCategories: allMainCategories, isLoadingCategories, allCategories } = useCategories();
  const [maintenanceCategory, setMaintenanceCategory] = useState<WithId<CategoryType> | null>(null);

  const displayCategories = useMemo(() => {
    // Robust selection: use main categories if they exist, otherwise use all categories as a backup
    let base = allMainCategories || [];
    if (base.length === 0 && allCategories && allCategories.length > 0) {
      base = allCategories;
    }
    
    if (!searchTerm) return base;
    return base.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allMainCategories, allCategories, searchTerm]);

  const handleCategoryClick = (category: WithId<CategoryType>) => {
    if (category.isUnderMaintenance && !isAdmin) {
      setMaintenanceCategory(category);
      return;
    }
    router.push(`/categories/${category.id}`);
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'favorites': return 'المفضلة';
      case 'notifications': return 'الإشعارات';
      default: return 'رفيق المصمم';
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header 
        title={getHeaderTitle()} 
        onMenuClick={activeTab === 'home' ? () => setIsSidebarOpen(true) : undefined} 
        showBackButton={activeTab !== 'home'}
        onBackClick={() => router.push('/home')}
        extraContent={activeTab === 'home' ? (
          <div className="relative z-[55] -mt-2">
            <div className="pb-0 px-6 max-w-2xl mx-auto">
              <div className="relative group shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] rounded-2xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                      ref={searchInputRef}
                      placeholder="ابحث عن القسم..." 
                      className="h-12 w-full rounded-2xl border-none bg-card pl-12 pr-4 text-sm focus:ring-0 transition-all shadow-none" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                  />
              </div>
            </div>
          </div>
        ) : null}
      />
      
      <main className="flex-1 px-6 pb-32 pt-2 container max-w-6xl mx-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home-categories"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {isLoadingCategories ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => <CategorySkeleton key={`home-skeleton-${i}`} className="aspect-square" />)}
                </div>
              ) : displayCategories.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1 pt-2">
                      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{displayCategories.length} قسم متوفر</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayCategories.map((cat, idx) => (
                      <motion.div 
                          key={`${cat.id}-${idx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => handleCategoryClick(cat)}
                          className="w-full aspect-square"
                      >
                        <div className={cn(
                            "w-full h-full relative text-primary-foreground p-4 rounded-[2.2rem] flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg hover:shadow-primary/20 text-center group overflow-hidden border-4 border-white/5",
                        )} style={{ background: cat.useCustomAccent && cat.accentColor ? `linear-gradient(135deg, ${cat.accentColor}, ${cat.accentColor}dd)` : 'var(--primary-gradient)' }}>
                          <div className="absolute -bottom-4 -right-4 bg-white/10 w-16 h-16 rounded-full group-hover:scale-150 transition-transform duration-700" />
                          
                          {cat.isUnderMaintenance && (
                              <div className="absolute top-4 right-4 bg-yellow-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 z-20 shadow-md">
                                  <Hammer className="h-2.5 w-2.5" /> صيانة
                              </div>
                          )}

                          {cat.fileTypes && !cat.isUnderMaintenance && (
                              <div className="absolute top-4 right-4 bg-black/20 text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase backdrop-blur-sm z-20">
                                  {cat.fileTypes}
                              </div>
                          )}

                          <p className="font-bold text-sm md:text-base relative z-10 leading-snug px-2 group-hover:scale-105 transition-transform duration-300">{cat.name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-black">لا توجد أقسام متاحة حالياً</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">يرجى التأكد من إضافة أقسام رئيسية في لوحة التحكم</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              key="favorites-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FavoritesTab />
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <NotificationsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MaintenanceModal 
        isOpen={!!maintenanceCategory} 
        onClose={() => setMaintenanceCategory(null)} 
        categoryName={maintenanceCategory?.name || ''} 
      />
    </div>
  );
}

export default function HomePage() {
   return (
       <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
           <HomeContent />
       </Suspense>
   )
}
