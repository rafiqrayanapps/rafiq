import { cn } from "@/lib/utils";

export default function CategorySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-gray-200 animate-pulse rounded-[2.2rem]", className)} />
  );
}
