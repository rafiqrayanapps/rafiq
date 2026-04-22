'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, 
  QrCode, 
  Contrast, 
  Copy, 
  Check, 
  Download, 
  Calculator,
  X,
  Palette,
  Wand2,
  Scissors
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from 'next/dynamic';

const ColorExtractor = dynamic(() => import('./tools/ColorExtractor'), { ssr: false });
const LocalAiTool = dynamic(() => import('./tools/LocalAiTool'), { ssr: false });
const BgRemovalTool = dynamic(() => import('./tools/BgRemovalTool'), { ssr: false });

// --- Utility Functions ---

const getContrastRatio = (hex1: string, hex2: string) => {
  const getRGB = (hex: string) => {
    let r, g, b;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16) / 255;
      g = parseInt(hex[2] + hex[2], 16) / 255;
      b = parseInt(hex[3] + hex[3], 16) / 255;
    } else {
      r = parseInt(hex.slice(1, 3), 16) / 255;
      g = parseInt(hex.slice(3, 5), 16) / 255;
      b = parseInt(hex.slice(5, 7), 16) / 255;
    }
    const getL = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return [getL(r), getL(g), getL(b)];
  };

  const rgb1 = getRGB(hex1);
  const rgb2 = getRGB(hex2);
  
  if (isNaN(rgb1[0]) || isNaN(rgb2[0])) return 1;

  const l1 = 0.2126 * rgb1[0] + 0.7152 * rgb1[1] + 0.0722 * rgb1[2];
  const l2 = 0.2126 * rgb2[0] + 0.7152 * rgb2[1] + 0.0722 * rgb2[2];
  
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
};

// --- Sub-components ---

const ContrastChecker = () => {
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const ratio = getContrastRatio(fg, bg);
  
  const getStatus = (r: number) => {
    if (r >= 7) return { label: 'ممتاز (AAA)', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (r >= 4.5) return { label: 'جيد (AA)', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    return { label: 'ضعيف', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const status = getStatus(ratio);

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">لون الخط</label>
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-6 h-6 rounded-md overflow-hidden border-none cursor-pointer" />
            <input type="text" value={fg} onChange={(e) => setFg(e.target.value)} className="bg-transparent text-[10px] font-mono font-bold outline-none uppercase w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">لون الخلفية</label>
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-6 h-6 rounded-md overflow-hidden border-none cursor-pointer" />
            <input type="text" value={bg} onChange={(e) => setBg(e.target.value)} className="bg-transparent text-[10px] font-mono font-bold outline-none uppercase w-full" />
          </div>
        </div>
      </div>

      <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center gap-4 transition-all" style={{ backgroundColor: bg, color: fg }}>
        <p className="text-xl font-black">معاينة النص</p>
        <p className="text-xs font-medium opacity-80 max-w-[200px]">هذا النص يساعدك على قياس مدى وضوح التصميم.</p>
        <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm", status.bg, status.color)}>
           {status.label}
        </div>
      </div>
    </div>
  );
};

const QrGenerator = () => {
  const [text, setText] = useState('https://artbag.rayanapp.com');
  const size = 200;
  const { toast } = useToast();

  const downloadQR = () => {
    const svg : any = document.getElementById('qr-code-svg-modal');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "qrcode.png";
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
      toast({ title: "تم التحميل", description: "تم حفظ الرمز بنجاح." });
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="space-y-6 flex flex-col items-center pt-4">
      <div className="w-full space-y-2 text-right">
         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">الرابط أو النص</label>
         <input 
           type="text" 
           value={text} 
           onChange={(e) => setText(e.target.value)} 
           className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none text-sm font-bold text-right"
         />
      </div>
      
      <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-blue-50">
        <QRCodeSVG id="qr-code-svg-modal" value={text} size={size} level="H" includeMargin={true} />
      </div>

      <button 
        onClick={downloadQR}
        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-black text-[10px] hover:scale-105 active:scale-95 transition-all"
      >
        <Download size={14} /> تحميل الرمز
      </button>
    </div>
  );
};

const AspectRatioCalc = () => {
  const [w, setW] = useState(1920);
  const [h, setH] = useState(1080);

  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const r = gcd(w, h);
  const rw = w / r;
  const rh = h / r;

  return (
    <div className="space-y-6 pt-4 text-right">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">العرض</label>
          <input type="number" value={w} onChange={(e) => setW(Number(e.target.value))} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none text-center font-black" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">الطول</label>
          <input type="number" value={h} onChange={(e) => setH(Number(e.target.value))} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none text-center font-black" />
        </div>
      </div>

      <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex flex-col items-center">
        <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">النسبة</span>
        <div className="text-3xl font-black text-primary">{rw}:{rh}</div>
      </div>
    </div>
  );
};

const LoremIpsum = () => {
  const [text, setText] = useState('');
  const { toast } = useToast();
  const latin = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

  useEffect(() => {
    setText(latin);
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: "تم نسخ النص الوهمي." });
  };

  return (
    <div className="space-y-6 pt-4">
      <textarea 
        readOnly 
        value={text}
        className="w-full h-40 bg-gray-50 rounded-2xl p-4 text-xs font-medium border-none resize-none leading-relaxed"
      />
      <button 
        onClick={copy}
        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl text-[10px] font-black"
      >
        <Copy size={14} /> نسخ النص
      </button>
    </div>
  );
};

// --- Main Modal Component ---

interface QuickToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolType: 'contrast' | 'qr' | 'ratio' | 'lorem' | 'palette' | 'local-ai' | 'remove-bg' | null;
}

export default function QuickToolsModal({ isOpen, onClose, toolType }: QuickToolsModalProps) {
  if (!toolType) return null;

  const toolConfig = {
    contrast: { title: 'تناسق الألوان', icon: Contrast },
    qr: { title: 'مولد رمز QR', icon: QrCode },
    ratio: { title: 'حاسبة الأبعاد', icon: Calculator },
    lorem: { title: 'نص وهمي', icon: Type },
    palette: { title: 'مستخرج الألوان', icon: Palette },
    'local-ai': { title: 'ذكاء اصطناعي محلي', icon: Wand2 },
    'remove-bg': { title: 'إزالة الخلفية', icon: Scissors },
  };

  const toolInfo = toolConfig[toolType as keyof typeof toolConfig];
  if (!toolInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-[3rem] p-0 overflow-hidden border-none bg-white shadow-2xl z-[100]">
        <DialogHeader className="p-8 pb-0 flex flex-row items-center justify-between text-right">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <toolInfo.icon size={20} />
             </div>
             <DialogTitle className="text-xl font-black text-gray-900">{toolInfo.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-8 pt-2">
          {toolType === 'contrast' && <ContrastChecker />}
          {toolType === 'qr' && <QrGenerator />}
          {toolType === 'ratio' && <AspectRatioCalc />}
          {toolType === 'lorem' && <LoremIpsum />}
          {toolType === 'palette' && <ColorExtractor />}
          {toolType === 'local-ai' && <LocalAiTool />}
          {toolType === 'remove-bg' && <BgRemovalTool />}
        </div>

        <div className="p-4 bg-gray-50 flex justify-center mt-2">
           <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">أدوات رفيق المصمم السريعة</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
