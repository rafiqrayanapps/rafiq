'use client';
import { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { WithId } from '@/firebase';
import type { Category as CategoryType } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Sparkles, Hammer } from 'lucide-react';
import CategorySkeleton from '@/components/skeletons/CategorySkeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCategories } from '@/components/providers/CategoryProvider';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import MaintenanceModal from '@/components/MaintenanceModal';
import FavoritesTab from '@/components/tabs/FavoritesTab';
import NotificationsTab from '@/components/tabs/NotificationsTab';

function HomeContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin, userProfile, isLoading: isUserLoading } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { mainCategories: allMainCategories, isLoadingCategories } = useCategories();

  const [maintenanceCategory, setMaintenanceCategory] = useState<WithId<CategoryType> | null>(null);

  useEffect(() => {
      const refFromUrl = searchParams.get('ref');
      if (refFromUrl && !userProfile?.referredBy) {
          toast({
              title: "أهلاً بك في رفيق المصمم!",
              description: "لقد وصلت عبر رابط دعوة. استمتع بتصفح أقسامنا المميزة.",
          });
      }
  }, [searchParams, userProfile, toast]);

  const mainCategories = useMemo(() => {
    if (!allMainCategories) return [];
    if (!searchTerm) return allMainCategories;
    return allMainCategories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allMainCategories, searchTerm]);

  const handleCategoryClick = (category: WithId<CategoryType>) => {
    if (category.isUnderMaintenance && !isAdmin) {
      setMaintenanceCategory(category);
      return;
    }
    router.push(`/categories/${category.id}`);
  };

  const isLoading = isLoadingCategories || isUserLoading;

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'favorites': return 'المفضلة';
      case 'notifications': return 'الإشعارات';
      default: return 'رفيق المصمم';
    }
  };

  const handleBack = () => {
    router.push('/home');
  };

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header 
        title={getHeaderTitle()} 
        onMenuClick={activeTab === 'home' ? () => setIsSidebarOpen(true) : undefined} 
        showBackButton={activeTab !== 'home'}
        onBackClick={handleBack}
        extraContent={activeTab === 'home' ? (
          <div className="relative z-[55] -mt-6">
            <div className="pb-4 px-6 max-w-2xl mx-auto">
              <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                      ref={searchInputRef}
                      placeholder="ابحث عن القسم..." 
                      className="h-14 w-full rounded-2xl border-none bg-card pl-12 pr-4 text-base focus:ring-0 transition-all" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                  />
              </div>
            </div>
          </div>
        ) : null}
      />
      
      <main className="flex-1 px-6 pb-32 pt-6 container max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => <CategorySkeleton key={`home-skeleton-${i}`} className="aspect-square" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <p className="text-muted-foreground text-xs font-medium">{mainCategories.length} قسم متوفر</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {mainCategories.map((cat, idx) => {
                      const isUnderMaintenance = cat.isUnderMaintenance;

                      return (
                      <div 
                          key={`${cat.id}-${idx}`} 
                          onClick={() => handleCategoryClick(cat)}
                          className="w-full aspect-square"
                      >
                        <div className={cn(
                            "w-full h-full relative text-primary-foreground p-4 rounded-[2.2rem] flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg hover:shadow-primary/20 text-center group overflow-hidden border-4 border-white/5",
                        )} style={{ background: 'var(--primary-gradient)' }}>
                          <div className="absolute -bottom-4 -right-4 bg-white/10 w-16 h-16 rounded-full group-hover:scale-150 transition-transform duration-700" />
                          
                          {isUnderMaintenance && (
                              <div className="absolute top-4 right-4 bg-yellow-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 z-20 shadow-md">
                                  <Hammer className="h-2.5 w-2.5" /> صيانة
                              </div>
                          )}

                          {cat.fileTypes && !isUnderMaintenance && (
                              <div className="absolute top-4 right-4 bg-black/20 text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase backdrop-blur-sm z-20">
                                  {cat.fileTypes}
                              </div>
                          )}

                          <p className="font-bold text-sm md:text-base relative z-10 leading-snug px-2 group-hover:scale-105 transition-transform duration-300">{cat.name}</p>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <FavoritesTab />
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
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
