'use client';

import { Inter, Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { useState, useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeApplier from "@/components/ThemeApplier";
import GlobalDialog from "@/components/GlobalDialog";
import FloatingButton from "@/components/FloatingButton";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { CategoryProvider } from "@/components/providers/CategoryProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

// Metadata removed because this is now a client component
// export const metadata: Metadata = {
//   title: "رفيق المصمم",
//   description: "تطبيق رفيق المصمم - كل ما يحتاجه المصمم في مكان واحد",
// };

import BottomNav from "@/components/layout/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${cairo.variable} ${tajawal.variable}`}>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          <CategoryProvider>
            <ServiceWorkerRegister />
            <ThemeApplier />
            <GlobalDialog />
            <FloatingButton />
            <div className="relative min-h-screen flex flex-col">
                <main className="flex-1">
                    {children}
                </main>
                <Suspense fallback={null}>
                  <BottomNav />
                </Suspense>
            </div>
            <Toaster />
          </CategoryProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
