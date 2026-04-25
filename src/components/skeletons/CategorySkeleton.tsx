import { cn } from "@/lib/utils";

export default function CategorySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-primary/10 rounded-[2.5rem] relative flex flex-col items-center justify-center overflow-hidden h-full w-full shadow-sm animate-pulse border border-primary/5", className)}>
      {/* Top right indicator pill - more subtle and professional */}
      <div className="absolute top-[18%] right-[12%] w-[35%] h-[12%] bg-primary/20 rounded-full" />
      
      {/* Centered main pill */}
      <div className="w-[60%] h-[14%] bg-primary/20 rounded-full" />
      
      {/* Shimmer effect overlay - smoother gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite] pointer-events-none" />
    </div>
  );
}
