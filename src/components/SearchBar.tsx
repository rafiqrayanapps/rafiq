'use client';

import { Search } from 'lucide-react';

export default function SearchBar() {
  return (
    <div className="px-6 -mt-10 relative z-20">
      <div className="relative">
        <input
          type="text"
          placeholder="ابحث عن القسم..."
          className="w-full bg-white py-6 pr-16 pl-6 rounded-[30px] shadow-2xl shadow-gray-300/40 border-none focus:ring-0 transition-all text-right placeholder:text-gray-400 text-lg font-medium"
        />
        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400" size={28} strokeWidth={2.5} />
      </div>
    </div>
  );
}
