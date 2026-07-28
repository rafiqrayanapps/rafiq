import type { Metadata, Viewport } from "next";
import { Inter, Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

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

export const metadata: Metadata = {
  title: "رفيق المصمم",
  description: "تطبيق رفيق - كل ما يحتاجه المصمم في مكان واحد",
  manifest: "/manifest.json",
  applicationName: "رفيق المصمم",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "رفيق المصمم",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "https://i.suar.me/g4APl/m", sizes: "192x192", type: "image/png" },
      { url: "https://i.suar.me/g4APl/m", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "https://i.suar.me/g4APl/m", sizes: "192x192", type: "image/png" },
      { url: "https://i.suar.me/g4APl/m", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${cairo.variable} ${tajawal.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="192x192" href="https://i.suar.me/g4APl/m" />
        <link rel="apple-touch-icon" sizes="512x512" href="https://i.suar.me/g4APl/m" />
        <link rel="icon" type="image/png" sizes="192x192" href="https://i.suar.me/g4APl/m" />
        <link rel="icon" type="image/png" sizes="512x512" href="https://i.suar.me/g4APl/m" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="رفيق المصمم" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
