'use client';
import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, doc, orderBy } from 'firebase/firestore';
import type { Category as CategoryType, ContentItem } from '@/lib/definitions';
import { ArrowLeft, Download, Search, Heart, Hammer, ExternalLink, PlayCircle, X, Music, Play, Pause, RefreshCw, Settings, Wrench, Package, Rocket, Copy, Check, ChevronLeft, ChevronRight, Star, ArrowDownToLine, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { cn, getDirectLink } from '@/lib/utils';
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

    const directAudioUrl = useMemo(() => getDirectLink(item.audioUrl || item.downloadUrl), [item.audioUrl, item.downloadUrl]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
            setLoadError(false);
            setCurrentTime(0);
        }
    }, [directAudioUrl]);

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
            } catch (err) { 
                console.error("Audio Playback Error:", err);
                setLoadError(true); 
            }
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
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5" dir="ltr">
                        {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {duration && isFinite(duration) ? `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}
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
                    dir="ltr"
                    value={[isNaN(currentTime) ? 0 : currentTime]} 
                    max={isNaN(duration) || !isFinite(duration) || duration === 0 ? 100 : duration} 
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
  const [selectedAiTool, setSelectedAiTool] = useState<any>(null);
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

  const itemsQuery = useMemoFirebase(() => id ? collection(firestore!, 'categories', id, 'items') : null, [firestore, id]);
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
                    <div 
                        className="relative aspect-square rounded-[2rem] overflow-hidden bg-card shadow-lg group cursor-pointer"
                        onClick={() => setSelectedImage(getDirectLink(item.imageUrl))}
                    >
                        {item.imageUrl && (
                            <Image 
                                src={getDirectLink(item.imageUrl)} 
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
                    <div 
                        className="relative rounded-[2.5rem] overflow-hidden bg-card shadow-xl group aspect-video cursor-pointer"
                        onClick={() => setSelectedImage(getDirectLink(item.imageUrl))}
                    >
                        {item.imageUrl && (
                            <Image 
                                src={getDirectLink(item.imageUrl)} 
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
        case 'style3': // Apps Style - App Store Look
            return (
                <div key={`${item.id}-${idx}`} className="bg-card rounded-[2.5rem] p-6 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    {/* Top Section: Title and Icon */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                            <h3 className="font-black text-2xl leading-tight text-foreground">{item.title}</h3>
                            <p className="text-sm font-bold text-red-600">{item.description || 'تطبيق مميز'}</p>
                            <div className="flex items-center gap-2 pt-3">
                                <button 
                                    onClick={() => toggleFavorite(item)} 
                                    className="h-11 px-6 rounded-full bg-secondary/80 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm font-black text-foreground shadow-sm group"
                                >
                                    <span className="group-active:scale-125 transition-transform">
                                        <Heart className={cn("h-5 w-5", isFav ? "fill-red-500 text-red-500" : "text-gray-400")} />
                                    </span>
                                    {isFav ? 'في المفضلة' : 'أضف للمفضلة'}
                                </button>
                            </div>
                        </div>
                        <div 
                            className="relative h-24 w-24 rounded-[1.8rem] overflow-hidden shadow-2xl cursor-pointer shrink-0 border-4 border-white/5"
                            onClick={() => setSelectedImage(getDirectLink(item.imageUrl))}
                        >
                            {item.imageUrl && <Image src={getDirectLink(item.imageUrl)} alt="" fill className="object-cover" referrerPolicy="no-referrer" />}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between py-2 border-y border-primary/5">
                        <div className="flex flex-col items-center flex-1">
                            <div className="flex items-center gap-1 font-black text-sm text-foreground">
                                <span>{item.rating || '4.8'}</span>
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold">{item.reviewCount || '12 ألف مراجعة'}</span>
                        </div>
                        <div className="w-px h-8 bg-primary/10" />
                        <div className="flex flex-col items-center flex-1">
                            <div className="h-6 w-6 bg-primary/10 rounded flex items-center justify-center text-[10px] font-black text-foreground">
                                {item.ageRating || '+3'}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold">مناسب للكل</span>
                        </div>
                        <div className="w-px h-8 bg-primary/10" />
                        <div className="flex flex-col items-center flex-1">
                            <div className="flex items-center gap-1 font-black text-sm text-foreground">
                                <ArrowDownToLine className="h-3 w-3" />
                                <span>{item.size || '15MB'}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold">حجم الملف</span>
                        </div>
                    </div>
                    
                    {/* Primary Action Button */}
                    <Button 
                        className={cn(
                            "w-full rounded-full h-14 font-black text-lg gap-3 shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 text-white active:scale-95 transition-all",
                            item.showDownloadButton === false && "hidden"
                        )}
                        onClick={() => handleAction(item, () => item.downloadUrl && window.open(item.downloadUrl, '_blank'))}
                    >
                        تثبيت
                    </Button>

                    {/* Screenshots */}
                    {item.screenshots && item.screenshots.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-black">نظرة عامة</span>
                            </div>
                            <ScrollArea className="w-full whitespace-nowrap pb-2" dir="rtl">
                                <div className="flex gap-3 px-1">
                                    {item.screenshots.map((src: string, sIdx: number) => (
                                        <div 
                                            key={`${src}-${sIdx}`} 
                                            className="relative h-64 w-36 rounded-[1.5rem] overflow-hidden shadow-sm cursor-pointer"
                                            onClick={() => setSelectedImage(getDirectLink(src))}
                                        >
                                            <Image src={getDirectLink(src)} alt="" fill className="object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                    )}
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
                    <div 
                        className="relative aspect-video w-full group cursor-pointer"
                        onClick={() => setSelectedImage(getDirectLink(item.imageUrl))}
                    >
                        {item.imageUrl && (
                            <Image 
                                src={getDirectLink(item.imageUrl)} 
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
                                tabIndex={-1}
                                className="h-32 bg-muted/50 rounded-2xl text-xs font-mono p-4 shadow-inner border-none resize-none focus-visible:ring-0 select-none pointer-events-none" 
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
        case 'style8': // Video Style
            const videoId = item.videoUrl?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
            const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : (item.imageUrl || 'https://picsum.photos/seed/video/800/450');
            return (
                <div key={`${item.id}-${idx}`} className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                    <div className="px-2">
                        <h3 className="font-black text-lg text-foreground leading-tight">{item.title}</h3>
                        {item.description && <p className="text-[10px] font-bold text-muted-foreground mt-1">{item.description}</p>}
                    </div>
                    <div 
                        className="relative rounded-[2.5rem] overflow-hidden bg-card shadow-xl group aspect-video cursor-pointer border-4 border-white/5"
                        onClick={() => handleAction(item, () => item.videoUrl && window.open(item.videoUrl, '_blank'))}
                    >
                        <Image 
                            src={getDirectLink(thumbUrl)} 
                            alt="" 
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Play className="h-10 w-10 text-white fill-white ml-1 shadow-2xl" />
                            </div>
                        </div>
                        <FavoriteButton isFavorite={isFav} onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }} />
                    </div>
                </div>
            );
        case 'style9': // AI Tools Style
            return (
                <div 
                    key={`${item.id}-${idx}`} 
                    className="flex flex-col gap-3 items-center group cursor-pointer animate-in fade-in zoom-in-95 duration-500"
                    onClick={() => setSelectedAiTool(item)}
                >
                    <div className="relative w-full aspect-square bg-card rounded-[2.5rem] overflow-hidden shadow-lg border-4 border-white/5 transition-all duration-500 group-hover:shadow-primary/30">
                        {item.imageUrl && (
                            <div className="absolute inset-0 p-4 flex items-center justify-center">
                                <div className="relative w-full h-full transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                                     <Image 
                                        src={getDirectLink(item.imageUrl)} 
                                        alt="" 
                                        fill 
                                        className="object-contain" 
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                            </div>
                        )}
                        <FavoriteButton isFavorite={isFav} onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }} className="top-3 left-3 h-8 w-8" />
                    </div>
                    <h3 className="text-sm font-black text-center leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                </div>
            );
        default:
            return (
                <div key={`${item.id}-${idx}`} className="relative bg-card rounded-[2.2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-card/90 transition-all shadow-lg hover:shadow-primary/20 aspect-square text-center active:scale-95 group overflow-hidden border-4 border-white/5 animate-in fade-in zoom-in-95 duration-500">
                    {item.imageUrl && (
                        <Image 
                            src={getDirectLink(item.imageUrl)} 
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
      {category?.useCustomAccent && category?.accentColor && (
          <style dangerouslySetInnerHTML={{ __html: `
              :root {
                  --primary: ${category.accentColor} !important;
                  --primary-gradient: linear-gradient(135deg, ${category.accentColor}, ${category.accentColor}dd) !important;
              }
          `}} />
      )}
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
                                             <div 
                                               className="w-full h-full relative text-primary-foreground p-4 rounded-[2.2rem] flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg hover:shadow-primary/20 text-center active:scale-95 group overflow-hidden border-4 border-white/5"
                                               style={{ background: subCat.useCustomAccent && subCat.accentColor ? `linear-gradient(135deg, ${subCat.accentColor}, ${subCat.accentColor}dd)` : 'var(--primary-gradient)' }}
                                             >
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
                            category?.displayStyle === 'style8' ? "grid-cols-1 md:grid-cols-2" :
                            category?.displayStyle === 'style9' ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" :
                            "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        )}>
                            {filteredItems.map(renderItem)}
                        </div>
                    </div>
                ) : (
                    !areItemsLoading && !currentSubCategories.length && (
                        <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in zoom-in-95 duration-700">
                             <motion.div
                                animate={{ 
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ 
                                    duration: 4, 
                                    repeat: Infinity,
                                    ease: "easeInOut" 
                                }}
                                className="relative mb-8"
                             >
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <Package className="h-24 w-24 relative text-primary/40 stroke-[1.5px]" />
                                <motion.div 
                                    animate={{ opacity: [0, 1, 0], y: [0, -20, -40] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-4 -right-4"
                                >
                                    <Sparkles className="h-8 w-8 text-yellow-400" />
                                </motion.div>
                             </motion.div>
                             
                             <h2 className="text-2xl font-black text-foreground mb-3">
                                {searchTerm ? "عذراً، لا توجد نتائج" : "نعمل على إضافة المحتوى"}
                             </h2>
                             <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-xs mx-auto">
                                {searchTerm 
                                    ? `لم نجد أي نتائج تطابق "${searchTerm}" في هذا القسم حالياً.` 
                                    : "هذا القسم فارغ حالياً، فريقنا يعمل بكل جهد لجمع وإضافة أفضل المصادر والأدوات لك قريباً!"
                                }
                             </p>
                             
                             {!searchTerm && (
                                 <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] animate-pulse">
                                     <Hammer className="h-3 w-3" />
                                     <span>في طور التحديث المستمر</span>
                                 </div>
                             )}
                        </div>
                    )
                )}

               <AffiliateAdSlot placement="inline" categoryId={id} />
            </Fragment>
        )}
      </main>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[98vw] sm:max-w-5xl p-0 overflow-hidden bg-black/60 backdrop-blur-xl border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {selectedImage && (
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              <Image 
                  src={selectedImage} 
                  alt="Preview" 
                  fill
                  className="object-contain" 
                  referrerPolicy="no-referrer"
              />
            </div>
          )}
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full h-12 w-12 z-[100] backdrop-blur-md" onClick={() => setSelectedImage(null)}>
            <X className="h-7 w-7" />
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAiTool} onOpenChange={() => setSelectedAiTool(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg p-0 overflow-hidden bg-card rounded-[3rem] border-none shadow-2xl">
          <DialogTitle className="sr-only">{selectedAiTool?.title}</DialogTitle>
          {selectedAiTool && (
            <div className="flex flex-col">
                <div className="relative aspect-video w-full">
                    {selectedAiTool.imageUrl && (
                        <Image 
                            src={getDirectLink(selectedAiTool.imageUrl)} 
                            alt="" 
                            fill 
                            className="object-cover" 
                            referrerPolicy="no-referrer"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <button 
                        onClick={() => setSelectedAiTool(null)}
                        className="absolute top-4 right-4 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-foreground">{selectedAiTool.title}</h2>
                        <p className="text-muted-foreground font-bold text-sm leading-relaxed">{selectedAiTool.description || 'أداة ذكاء اصطناعي احترافية للمصممين.'}</p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {selectedAiTool.sourceUrl && (
                            <Button 
                                className="w-full h-14 rounded-2xl font-black text-lg gap-3 shadow-lg shadow-primary/20"
                                onClick={() => window.open(selectedAiTool.sourceUrl, '_blank')}
                            >
                                <ExternalLink className="h-5 w-5" />
                                زيارة الموقع
                            </Button>
                        )}
                        <Button 
                            variant="secondary"
                            className="w-full h-14 rounded-2xl font-black text-lg gap-3"
                            onClick={() => setSelectedAiTool(null)}
                        >
                            إغلاق
                        </Button>
                    </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
