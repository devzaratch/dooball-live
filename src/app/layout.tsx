import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import Navbar from '@/components/layout/Navbar';
import AdBanner from '@/components/ads/AdBanner';
import MatchReminderNotifier from '@/components/common/MatchReminderNotifier';
import GoalNotifier from '@/components/common/GoalNotifier';
import PwaInstaller from '@/components/common/PwaInstaller';
import PushNotificationPrompt from '@/components/common/PushNotificationPrompt';
import JsonLd from '@/components/common/JsonLd';
import { LanguageProvider } from '@/context/LanguageContext';
import './globals.css';

const notoSans = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'ดูบอลสด - ดูบอลออนไลน์ฟรี คมชัดระดับ HD ไม่กระตุก (ເບິ່ງບານສົດ)',
    template: '%s | Dooball Live',
  },
  description: 'รวมลิงก์ดูบอลสด ถ่ายทอดสดฟุตบอลครบทุกลีก พรีเมียร์ลีก ยูฟ่า แชมเปียนส์ลีก คมชัด HD อัปเดตเร็วที่สุด รองรับไทยและลาว (ເບິ່ງບານສົດ ຟຣີ)',
  keywords: [
    'ดูบอลสด', 'ดูบอลออนไลน์', 'ถ่ายทอดสดฟุตบอล', 'ดูบอลฟรี', 'ลิงก์ดูบอล', 'พรีเมียร์ลีก', 'ดูบอลสดวันนี้', 'ดูบอลสด HD',
    'ເບິ່ງບານສົດ', 'ເບິ່ງບານອອນໄລນ໌', 'ຖ່າຍທອດສົດບານເຕະ', 'Dooball Live'
  ],
  authors: [{ name: 'Dooball Live Team' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dooball-live-p6mk.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'th-TH': '/',
      'lo-LA': '/',
    },
  },
  openGraph: {
    title: 'ดูบอลสด - ดูบอลออนไลน์ฟรี คมชัดระดับ HD (ເບິ່ງບານສົດ)',
    description: 'รวมลิงก์ดูบอลสด ถ่ายทอดสดฟุตบอลครบทุกลีก อัปเดตลิงก์เร็วที่สุด รองรับไทยและลาว',
    siteName: 'Dooball Live',
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ดูบอลสด - ดูบอลออนไลน์ฟรี คมชัดระดับ HD',
    description: 'รวมลิงก์ดูบอลสด ถ่ายทอดสดฟุตบอลครบทุกลีก อัปเดตลิงก์เร็วที่สุด',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dooball Live',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION || '',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="dark">
      <head>
        {/* Speed & CDN Preconnect Headers (เพิ่มคะแนน Core Web Vitals) */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.thesportsdb.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body className={`${notoSans.className} bg-slate-950 text-slate-100 antialiased selection:bg-[#E5B842] selection:text-black flex flex-col min-h-screen`}>
        <LanguageProvider>
          {/* Google Structured Data Schema (JSON-LD) */}
          <JsonLd type="website" />

          {/* Navigation Bar */}
          <Navbar />

          {/* Top Ad Banner Slot (พื้นที่โฆษณาด้านบน) */}
          <div className="max-w-[1600px] mx-auto px-4 w-full pt-4">
            <AdBanner position="top_leaderboard" />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 max-w-[1600px] mx-auto px-4 w-full py-4">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800 bg-slate-900/50 py-6 mt-8 text-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Dooball Live. All rights reserved. Live Football Streaming Platform (TH 🇹🇭 & LA 🇱🇦).</p>
          </footer>

          {/* Global Match Reminder Notifier (ปุ่มเด้งการแจ้งเตือนบอลเตะมุมขวาล่าง) */}
          <MatchReminderNotifier />

          {/* Global Goal Audio Alert & Toast Notifier (ระบบเตือนเสียงเมื่อมีประตูสด) */}
          <GoalNotifier />

          {/* Global Web Push Notification Service (ระบบแจ้งเตือนบอลสดบนมือถือ) */}
          <PushNotificationPrompt />

          {/* Global PWA Mobile Installer Prompt (ปุ่มติดตั้งแอปพลิเคชันลงมือถือ) */}
          <PwaInstaller />
        </LanguageProvider>
      </body>
    </html>
  );
}