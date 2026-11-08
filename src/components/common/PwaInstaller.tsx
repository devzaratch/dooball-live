'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
                .catch((err) => console.warn('PWA Service Worker registration error:', err));
        }

        // Listen for PWA Install Prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user previously dismissed banner in this session
            const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
            if (!dismissed) {
                setShowBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already running in standalone PWA mode
        if (window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone)) {
            queueMicrotask(() => setIsInstalled(true));
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstalled(true);
            setShowBanner(false);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        sessionStorage.setItem('pwa_banner_dismissed', 'true');
    };

    if (!showBanner || isInstalled) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-[#0B0F17]/95 border-2 border-[#E5B842]/80 rounded-2xl p-4 shadow-[0_0_30px_rgba(229,184,66,0.3)] backdrop-blur-xl animate-[slideIn_0.4s_ease-out] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E5B842] to-amber-600 p-0.5 shrink-0 shadow-md">
                    <div className="w-full h-full bg-black/80 rounded-[10px] flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-[#E5B842]" />
                    </div>
                </div>
                <div className="flex flex-col min-w-0">
                    <h4 className="font-extrabold text-xs text-white truncate">
                        ติดตั้งแอป Dooball Live ลงมือถือ
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                        เปิดดูบอลสดเต็มจอ ไม่ผ่านแถบเบราว์เซอร์
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={handleInstallClick}
                    className="px-3.5 py-1.5 rounded-xl bg-[#E5B842] hover:bg-[#d4a737] text-black text-xs font-black transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1"
                >
                    <Download className="w-3.5 h-3.5" />
                    <span>ติดตั้ง</span>
                </button>
                <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
