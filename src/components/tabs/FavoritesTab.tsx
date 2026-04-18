'use client';
import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import Image from 'next/image';
import { Heart, Download, Music, Play, Pause, RefreshCw, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import useLocalStorage from '@/hooks/use-local-storage';
import { cn, getDirectDriveLink } from '@/lib/utils';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const FavoriteButton = ({ isFavorite, onClick, className }: { isFavorite: boolean, onClick: (e: any) => void, className?: string }) => (
    <button 
        className={cn(
            "absolute top-4 left-4 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-xl transition-all z-20 border-none active:scale-90",
            className
        )} 
        onClick={onClick}
    >
        <Heart className={cn("h-5 w-5 transition-colors", isFavorite ? "fill-primary text-primary" : "text-gray-300")} />
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
    item: any, 
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
            "flex flex-col gap-3 p-4 bg-white rounded-[2rem] border border-gray-100 shadow-lg group animate-in fade-in slide-in-from-bottom-2 duration-500",
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
                    {item.downloadUrl && <button onClick={() => onAction(() => window.open(item.downloadUrl, '_blank'))} className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground"><Download className="h-3.5 w-3.5" /></button>}
                </div>
                <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={(v) => { if(audioRef.current) audioRef.current.currentTime = v[0]; }} className="flex-1" />
            </div>
        </div>
    );
};

export default function FavoritesTab() {
  const [favorites, setFavorites] = useLocalStorage<any[]>('favorites', []);
  const { toast } = useToast();
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const toggleFavorite = (item: any) => {
    setFavorites(prev => prev.filter(f => f.id !== item.id));
    toast({ title: "تمت الإزالة من المفضلة" });
  };

  const handleAction = (item: any, action: () => void) => {
      action();
  };

  const renderItem = (item: any, idx: number) => {
    const style = item.displayStyle || 'style1';
    const isFav = true;

    switch(style) {
        case 'style1':
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
        case 'style2':
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
        case 'style3':
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
        case 'style4':
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
        case 'style5':
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
                        <div className="relative group">
                            <Textarea 
                                readOnly 
                                value={item.prompt || ''} 
                                onCopy={(e) => e.preventDefault()}
                                className="h-32 bg-gray-50 rounded-2xl text-xs font-mono p-4 pb-14 shadow-inner border-none resize-none focus-visible:ring-0 select-none" 
                                dir="ltr" 
                            />
                            {item.showCopyButton !== false && (
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(item.prompt || '');
                                        toast({ title: "تم النسخ بنجاح" });
                                    }}
                                    className="absolute bottom-3 right-3 h-10 px-4 bg-primary text-primary-foreground rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    نسخ البرومبت
                                </button>
                            )}
                        </div>
                    </div>
                </div>
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

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pt-6">
        {favorites.length > 0 ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest">العناصر المحفوظة ({favorites.length})</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setFavorites([]); toast({ title: "تم مسح المفضلة" }); }}
                    className="text-[10px] font-black uppercase tracking-widest text-destructive hover:text-destructive hover:bg-destructive/5"
                  >
                    مسح الكل
                  </Button>
                </div>
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {favorites.map(renderItem)}
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 px-8 bg-white rounded-[3.5rem] border border-gray-100 shadow-sm text-center gap-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                  <div className="relative w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 shadow-inner border border-gray-100">
                      <Heart size={48} />
                  </div>
                </div>
                <div className="space-y-3">
                    <h2 className="text-2xl font-black text-gray-900">قائمة المفضلة فارغة</h2>
                    <p className="text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">لم تقم بإضافة أي عناصر إلى المفضلة بعد. ابدأ باستكشاف الأقسام وإضافة ما يعجبك!</p>
                </div>
            </div>
        )}

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
