'use client';
import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, doc, orderBy } from 'firebase/firestore';
import type { Category as CategoryType, ContentItem } from '@/lib/definitions';
import { ArrowLeft, Download, Search, Heart, Hammer, ExternalLink, PlayCircle, X, Music, Play, Pause, RefreshCw, Settings, Wrench, Package, Rocket, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MaintenanceView from '@/components/MaintenanceView';
import useLocalStorage from '@/hooks/use-local-storage';
import { cn, getDirectDriveLink } from '@/lib/utils';
import CategorySkeleton from '@/components/skeletons/CategorySkeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useCategories } from '@/components/providers/CategoryProvider';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AffiliateAdSlot, useAffiliateAds } from '@/components/ads/AffiliateAdsManager';

const FavoriteButton = ({ isFavorite, onClick, className }: { isFavorite: boolean, onClick: (e: any) => void, className?: string }) => (
    <button 
        className={cn(
            "absolute top-4 left-4 h-10 w-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-colors z-20 border border-black/5",
            className
        )} 
        onClick={onClick}
    >
        <Heart className={cn("h-5 w-5 transition-colors", isFavorite ? "fill-primary text-primary" : "text-gray-500")} />
    </button>
);

const AudioPlayerRow = ({ 
    item, 
    isFavorite, 
    onToggleFavorite, 
    onAction,
    activeId,
    onPlay
}: { 
    item: WithId<ContentItem>, 
    isFavorite: boolean, 
    onToggleFavorite: () => void,
    onAction: (action: () => void) => void,
    activeId: string | null,
    onPlay: (id: string | null) => void
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loadError, setLoadError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const directAudioUrl = useMemo(() => getDirectDriveLink(item.audioUrl || item.downloadUrl), [item.audioUrl, item.downloadUrl]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
            setLoadError(false);
            setCurrentTime(0);
            if (isPlaying) {
                setIsPlaying(false);
                if (activeId === item.id) onPlay(null);
            }
        }
    }, [directAudioUrl, activeId, isPlaying, item.id, onPlay]);

    useEffect(() => {
        if (activeId !== item.id && isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        }
    }, [activeId, item.id, isPlaying]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => { setDuration(audio.duration); setLoadError(false); };
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const onEnded = () => { setIsPlaying(false); if (activeId === item.id) onPlay(null); };
        const onError = () => { setLoadError(true); setIsPlaying(false); if (activeId === item.id) onPlay(null); };

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
        };
    }, [activeId, item.id, onPlay]);

    const togglePlay = async () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            onPlay(null);
        } else {
            try {
                setLoadError(false);
                await audioRef.current.play();
                setIsPlaying(true);
                onPlay(item.id);
            } catch (err) { setLoadError(true); }
        }
    };

    return (
        <div className={cn(
            "flex flex-col gap-3 p-4 bg-card/40 backdrop-blur-xl rounded-[2rem] border border-primary/10 shadow-lg group animate-in fade-in slide-in-from-bottom-2 duration-500",
            loadError && "border-destructive/30 bg-destructive/5"
        )}>
            <audio ref={audioRef} src={directAudioUrl || undefined} preload="metadata" />
            <div className="flex items-center gap-4">
                <button onClick={togglePlay} disabled={loadError} className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20 transition-colors">
                    {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 ml-1 fill-current" />}
                </button>
                <div className="flex-1 min-w-0 text-center">
                    <p className="font-black text-sm truncate leading-tight">{item.title}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {duration ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}
                    </p>
                </div>
                <div className="h-12 w-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {loadError ? <button onClick={() => audioRef.current?.load()}><RefreshCw className="h-5 w-5" /></button> : <Music className={cn("h-6 w-6", isPlaying && "animate-bounce")} />}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                    <button onClick={onToggleFavorite} className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center border transition-colors">
                        <Heart className={cn("h-4 w-4 transition-colors", isFavorite ? "text-primary fill-primary" : "text-gray-400")} />
                    </button>
                    {item.downloadUrl && item.showDownloadButton !== false && (
                        <button 
                            onClick={() => onAction(() => window.open(item.downloadUrl, '_blank'))} 
                            className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                        >
                            <Download className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <Slider 
                    value={[isNaN(currentTime) ? 0 : currentTime]} 
                    max={isNaN(duration) || duration === 0 ? 100 : duration} 
                    step={0.1} 
                    onValueChange={(v) => { if(audioRef.current) audioRef.current.currentTime = v[0]; }} 
                    className="flex-1" 
                />
            </div>
        </div>
    );
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const firestore = useFirestore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useLocalStorage<any[]>('favorites', []);
  const { toast } = useToast();
  const { isAdmin, isEditor, isLoading: isUserLoading } = useUserProfile();
  const { adFrequency } = useAffiliateAds();
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categoryRef = useMemoFirebase(() => id ? doc(firestore!, 'categories', id) : null, [firestore, id]);
  const { data: category, isLoading: isCategoryLoading } = useDoc<CategoryType>(categoryRef);
  const { subCategories } = useCategories();
  
  const currentSubCategories = useMemo(() => {
      if (!id || !category) return [];
      if (category.displayStyle === 'style7' && category.parentId) return subCategories.get(category.parentId) || [];
      return subCategories.get(id) || [];
  }, [subCategories, id, category]);

  const itemsQuery = useMemoFirebase(() => id ? query(collection(firestore!, 'categories', id, 'items'), orderBy('order', 'asc')) : null, [firestore, id]);
  const { data: rawItems, isLoading: areItemsLoading } = useCollection<any>(itemsQuery);

  const toggleFavorite = (item: WithId<any>) => {
    const isFavorite = favorites.some(f => f.id === item.id);
    if (isFavorite) setFavorites(prev => prev.filter(f => f.id !== item.id));
    else setFavorites(prev => [...prev, { ...item, displayStyle: category?.displayStyle || 'style1' }]);
    toast({ title: isFavorite ? "تمت الإزالة" : "تمت الإضافة للمفضلة" });
  };

  const handleAction = (item: WithId<any>, action: () => void) => {
      action();
  };

  const filteredItems = useMemo(() => {
    if (!rawItems) return [];
    const viewable = (isAdmin || isEditor) ? rawItems : rawItems.filter(i => i.status === 'approved' || !i.status);
    return viewable.filter(i => (i.title || "").toLowerCase().includes(searchTerm.toLowerCase()));
  }, [rawItems, searchTerm, isAdmin, isEditor]);

  const isMaintenanceOn = category?.isUnderMaintenance && !isAdmin && !isEditor;

  const renderItem = (item: any, idx: number) => {
    const style = category?.displayStyle || 'style1';
    const isFav = favorites.some(f => f.id === item.id);

    switch(style) {
        case 'style1': // Logos - 2 Column Grid
            return (
                <div key={`${item.id}-${idx}`} className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-500">
                    <div className="px-1">
                        <h3 className="text-xs font-black truncate">{item.title}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-card shadow-lg group">
                        {item.imageUrl && (
                            <Image 
                                src={item.imageUrl} 
                                alt="" 
                                fill 
                                className="object-cover group-hover:scale-110 transition-transform duration-700" 
                                referrerPolicy="no-referrer"
                            />
                        )}
                        <FavoriteButton isFavorite={isFav} onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }} className="top-3 left-3 h-8 w-8" />
                    </div>
                    <Button 
                        variant="default" 
                        className={cn(
                            "w-full rounded-2xl h-10 font-bold text-xs gap-2 shadow-sm active:scale-95 transition-transform",
                            item.showDownloadButton === false && "hidden"
                        )}
                        onClick={() => handleAction(item, () => item.downloadUrl && window.open(item.downloadUrl, '_blank'))}
                    >
                        <Download className="h-3.5 w-3.5" />
                        تحميل
                    </Button>
                </div>
            );
        case 'style2': // Banners - Full Width
            return (
                <div key={`${item.id}-${idx}`} className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                    <div className="px-2">
                        <h3 className="font-black text-lg text-foreground leading-tight">{item.title}</h3>
                        {item.description && <p className="text-[10px] font-bold text-muted-foreground mt-1">{item.description}</p>}
                    </div>
                    <div className="relative rounded-[2.5rem] overflow-hidden bg-card shadow-xl group aspect-video">
                        {item.imageUrl && (
                            <Image 
                                src={item.imageUrl} 
                                alt="" 
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-1000" 
                                referrerPolicy="no-referrer"
                            />
                        )}
                        <FavoriteButton isFavorite={isFav} onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }} />
                    </div>
                    <Button 
                        variant="default" 
                        className={cn(
                            "w-full rounded-[1.5rem] h-12 font-bold gap-2 shadow-lg active:scale-95 transition-transform",
                            item.showDownloadButton === false && "hidden"
                        )}
                        onClick={() => handleAction(item, () => item.downloadUrl && window.open(item.downloadUrl, '_blank'))}
                    >
                        <Download className="h-4 w-4" />
                        تحميل
                    </Button>
                </div>
            );
        case 'style3': // Apps Style
            return (
                <div key={`${item.id}-${idx}`} className="bg-card rounded-[2.5rem] p-6 shadow-xl border-4 border-white/5 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-md border-2 border-white/10">
                            {item.imageUrl && <Image src={item.imageUrl} alt="" fill className="object-cover" referrerPolicy="no-referrer" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-lg leading-tight">{item.title}</h3>
                            <p className="text-xs text-muted-foreground font-bold">إصدار {item.version || '1.0.0'}</p>
                        </div>
                        <button onClick={() => toggleFavorite(item)} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center active:scale-90 transition-transform">
                            <Heart className={cn("h-5 w-5", isFav ? "fill-primary text-primary" : "text-gray-400")} />
                        </button>
                    </div>
                    
                    {item.screenshots && item.screenshots.length > 0 && (
                        <ScrollArea className="w-full whitespace-nowrap pb-2">
                            <div className="flex gap-3">
                                {item.screenshots.map((src: string, sIdx: number) => (
                                    <div key={`${src}-${sIdx}`} className="relative h-48 w-32 rounded-xl overflow-hidden shadow-sm border border-white/5">
                                        <Image src={src} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    )}

                    <Button 
                        className={cn(
                            "w-full rounded-2xl h-14 font-black text-lg gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-transform",
                            item.showDownloadButton === false && "hidden"
                        )}
                        onClick={() => handleAction(item, () => item.downloadUrl && window.open(item.downloadUrl, '_blank'))}
                    >
                        <Download className="h-6 w-6" />
                        تحميل الآن
                    </Button>
                </div>
            );
        case 'style4': // Audio Style
            return (
                <AudioPlayerRow 
                    key={`${item.id}-${idx}`} 
                    item={item} 
                    isFavorite={isFav} 
                    onToggleFavorite={() => toggleFavorite(item)} 
                    onAction={(action) => handleAction(item, action)}
                    activeId={activeAudioId}
                    onPlay={setActiveAudioId}
                />
            );
        case 'style5': // Prompt Style
            return (
                <div key={`${item.id}-${idx}`} className="bg-card rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white/5 animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative aspect-video w-full group">
                        {item.imageUrl && (
                            <Image 
                                src={item.imageUrl} 
                                alt="" 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                                referrerPolicy="no-referrer"
                            />
                        )}
                        <FavoriteButton isFavorite={isFav} onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }} />
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-lg">{item.title}</h3>
                            {item.showCopyButton !== false && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(item.prompt || '');
                                        toast({ title: "تم النسخ بنجاح" });
                                    }}
                                    className="h-10 w-10 rounded-full hover:bg-primary/10 text-primary"
                                >
                                    <Copy className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                        <div className="relative group flex flex-col gap-3">
                            <Textarea 
                                readOnly 
                                value={item.prompt || ''} 
                                onCopy={(e) => e.preventDefault()}
                                className="h-32 bg-muted/50 rounded-2xl text-xs font-mono p-4 shadow-inner border-none resize-none focus-visible:ring-0 select-none" 
                                dir="ltr" 
                            />
                            {item.showCopyButton !== false && (
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(item.prompt || '');
                                            toast({ title: "تم النسخ بنجاح" });
                                        }}
                                        className="h-10 px-4 bg-primary text-primary-foreground rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        نسخ البرومبت
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        case 'style6':
            return (
                <AudioPlayerRow 
                    key={`${item.id}-${idx}`} 
                    item={item} 
                    isFavorite={isFav} 
                    onToggleFavorite={() => toggleFavorite(item)} 
                    onAction={(action) => handleAction(item, action)}
                    activeId={activeAudioId}
                    onPlay={setActiveAudioId}
                />
            );
        default:
            return (
                <div key={`${item.id}-${idx}`} className="relative bg-card rounded-[2.2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-card/90 transition-all shadow-lg hover:shadow-primary/20 aspect-square text-center active:scale-95 group overflow-hidden border-4 border-white/5 animate-in fade-in zoom-in-95 duration-500">
                    {item.imageUrl && (
                        <Image 
                            src={item.imageUrl} 
                            alt="" 
                            fill 
                            className="object-cover opacity-30 group-hover:scale-105 transition-transform duration-700" 
                            referrerPolicy="no-referrer"
                        />
                    )}
                    <p className="font-bold text-sm md:text-base relative z-10 leading-snug px-2 text-primary-foreground group-hover:scale-105 transition-transform duration-300">{item.title}</p>
                    <FavoriteButton isFavorite={isFav} onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }} />
                </div>
            );
    }
  };

  if (isCategoryLoading || isUserLoading) {
    return (
      <div className="flex flex-col bg-background overflow-x-hidden">
        <Header title="التحميل..." showBackButton={true} />
        <main className="flex-1 px-6 pb-8 pt-6 space-y-6 container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => <CategorySkeleton key={`cat-skeleton-${i}`} className="aspect-square" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col bg-background overflow-x-hidden">
        <Header title="الفئة غير موجودة" showBackButton={true} />
        <main className="flex-1 px-6 pb-8 pt-6 space-y-6 container max-w-6xl mx-auto">
          <p className="text-center text-muted-foreground">عذراً، الفئة المطلوبة غير موجودة أو تم حذفها.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header 
        title={category.name} 
        showBackButton={true} 
        onMenuClick={() => setIsSidebarOpen(true)} 
        extraContent={
          <div className="relative z-[55] -mt-6">
            <div className="pb-4 px-6 max-w-2xl mx-auto">
              <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                      ref={searchInputRef}
                      placeholder="ابحث عن عنصر..." 
                      className="h-14 w-full rounded-2xl border-none bg-card pl-12 pr-4 text-base focus:ring-0 transition-all" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                  />
              </div>
            </div>
          </div>
        }
      />

      <main className="flex-1 px-6 pb-32 pt-6 space-y-6 container max-w-6xl mx-auto">
        {isMaintenanceOn ? (
            <MaintenanceView />
        ) : (
            <Fragment>
                {currentSubCategories.length > 0 && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                         <div className="flex items-center justify-between px-1">
                             <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">أقسام فرعية ({currentSubCategories.length})</p>
                         </div>
                         
                         {category?.subCategoryLayout === 'horizontal' ? (
                             <ScrollArea className="w-full whitespace-nowrap rounded-xl" dir="rtl">
                                 <div className="flex w-max gap-3 p-1">
                                     {currentSubCategories.map((subCat, idx) => (
                                         <button 
                                             key={`${subCat.id}-${idx}`} 
                                             onClick={() => router.push(`/categories/${subCat.id}`)}
                                             className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both group relative"
                                             style={{ animationDelay: `${idx * 50}ms` }}
                                         >
                                             <div className={cn(
                                                 "flex items-center gap-2 px-5 py-2.5 rounded-full transition-all border-2 shadow-sm active:scale-95 bg-card border-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary",
                                             )}>
                                                 <Package className="h-3.5 w-3.5" />
                                                 <span className="font-bold text-xs">{subCat.name}</span>
                                                 {subCat.fileTypes && (
                                                     <span className="text-[8px] bg-black/10 px-1.5 py-0.5 rounded-md opacity-60">
                                                         {subCat.fileTypes}
                                                     </span>
                                                 )}
                                             </div>
                                         </button>
                                     ))}
                                 </div>
                                 <ScrollBar orientation="horizontal" className="hidden" />
                             </ScrollArea>
                         ) : (
                             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                 {currentSubCategories.map((subCat, idx) => (
                                     <div 
                                         key={`${subCat.id}-${idx}`} 
                                         onClick={() => router.push(`/categories/${subCat.id}`)}
                                         className="animate-in fade-in zoom-in-95 duration-500 fill-mode-both w-full aspect-square"
                                         style={{ animationDelay: `${idx * 50}ms` }}
                                     >
                                         <div className="w-full h-full relative bg-primary text-primary-foreground p-4 rounded-[2.2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 text-center active:scale-95 group overflow-hidden border-4 border-white/5">
                                             <div className="absolute -bottom-4 -right-4 bg-white/10 w-16 h-16 rounded-full group-hover:scale-150 transition-transform duration-700" />
                                             {subCat.fileTypes && (
                                                 <div className="absolute top-4 right-4 bg-black/20 text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase backdrop-blur-sm z-20">
                                                     {subCat.fileTypes}
                                                 </div>
                                             )}
                                             <p className="font-bold text-sm md:text-base relative z-10 leading-snug px-2 group-hover:scale-105 transition-transform duration-300">{subCat.name}</p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 )}

                {areItemsLoading && filteredItems.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(6)].map((_, i) => <CategorySkeleton key={`item-skeleton-${i}`} className="aspect-square" />)}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="text-muted-foreground text-xs font-medium px-1">المحتوى ({filteredItems.length})</p>
                        <div className={cn(
                            "grid gap-6",
                            category?.displayStyle === 'style1' ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : 
                            category?.displayStyle === 'style2' ? "grid-cols-1" :
                            category?.displayStyle === 'style3' ? "grid-cols-1 md:grid-cols-2" :
                            category?.displayStyle === 'style4' ? "grid-cols-1" :
                            category?.displayStyle === 'style5' ? "grid-cols-1" :
                            "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        )}>
                            {filteredItems.map(renderItem)}
                        </div>
                    </div>
                ) : (
                    !currentSubCategories.length && (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Package className="h-16 w-16 mb-4 text-primary/60" />
                            <h2 className="text-xl font-bold mb-2">لا يوجد محتوى</h2>
                            <p>عذراً، لا يوجد محتوى مطابق لمعايير البحث في هذا القسم.</p>
                        </div>
                    )
                )}

               <AffiliateAdSlot placement="inline" categoryId={id} />
            </Fragment>
        )}
      </main>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {selectedImage && (
            <Image 
                src={selectedImage} 
                alt="Preview" 
                width={1200} 
                height={800} 
                className="w-full h-auto rounded-lg" 
                referrerPolicy="no-referrer"
            />
          )}
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white hover:bg-white/20" onClick={() => setSelectedImage(null)}>
            <X className="h-6 w-6" />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
