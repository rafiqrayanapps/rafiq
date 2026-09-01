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
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
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
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="رفيق المصمم" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var reloadKey = 'chunk_reload_attempt';
                function handleChunkErr(e) {
                  var msg = (e && (e.message || (e.reason && e.reason.message))) || '';
                  var name = (e && (e.name || (e.reason && e.reason.name))) || '';
                  var isChunk = name === 'ChunkLoadError' || 
                    msg.indexOf('Loading chunk') !== -1 || 
                    msg.indexOf('ChunkLoadError') !== -1 || 
                    msg.indexOf('Failed to fetch dynamically imported module') !== -1 ||
                    (msg.indexOf('timeout:') !== -1 && msg.indexOf('/_next/static/chunks/') !== -1);
                  if (isChunk) {
                    var last = sessionStorage.getItem(reloadKey);
                    var now = Date.now();
                    if (!last || (now - parseInt(last, 10)) > 6000) {
                      sessionStorage.setItem(reloadKey, now.toString());
                      window.location.reload();
                    }
                  }
                }
                window.addEventListener('error', handleChunkErr);
                window.addEventListener('unhandledrejection', handleChunkErr);
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
