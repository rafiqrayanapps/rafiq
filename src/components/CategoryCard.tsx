'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface CategoryCardProps {
  id: string;
  title: string;
  type: string;
  index: number;
}

export default function CategoryCard({ id, title, type, index }: CategoryCardProps) {
  return (
    <Link href={`/category/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px' }}
        transition={{ delay: Math.min(index * 0.025, 0.1), duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[45px] p-6 aspect-square flex flex-col items-center justify-center text-center group cursor-pointer category-card-glow"
        style={{ background: 'var(--primary-gradient)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/5 rounded-full" />
        
        <div className="absolute top-5 right-6 bg-black/15 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
          {type}
        </div>
        
        <h3 className="text-white text-2xl font-black leading-tight mt-2 drop-shadow-md">
          {title}
        </h3>
      </motion.div>
    </Link>
  );
}
