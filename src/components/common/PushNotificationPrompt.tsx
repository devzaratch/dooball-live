'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCircle, X, Radio, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PushNotificationPrompt() {
    const [supported, setSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [showBanner, setShowBanner] = useState(false);
    const [testSent, setTestSent] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
            setSupported(true);
            setPermission(Notification.permission);

            // Register Service Worker
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.warn('Service Worker registration notice:', err);
            });

            // Show prompt banner if notification permission is still default
            const hasDismissed = localStorage.getItem('push_prompt_dismissed');
            if (Notification.permission === 'default' && !hasDismissed) {
                const timer = setTimeout(() => setShowBanner(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const requestPermission = async () => {
        if (!supported) return;
        try {
            const res = await Notification.requestPermission();
            setPermission(res);
            if (res === 'granted') {
                setShowBanner(false);
                sendTestNotification('เปิดการแจ้งเตือนสำเร็จ!', 'ระบบจะแจ้งเตือนคุณทันทีเมื่อมีบอลเตะคู่เดือดสด!');
            }
        } catch (err) {
            console.error('Permission request failed:', err);
        }
    };

    const sendTestNotification = (title?: string, body?: string) => {
        if (permission === 'granted' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                const options: any = {
                    body: body || 'ทดสอบการส่งแจ้งเตือน: ลิเวอร์พูล vs โคโม่ กำลังถ่ายทอดสด กดเพื่อรับชมทันที!',
                    icon: '/icon',
                    badge: '/icon',
                    vibrate: [200, 100, 200],
                    data: { url: '/watch/liverpool-vs-como' },
                };
                registration.showNotification(title || '⚽ แจ้งเตือนบอลสด (DoBallLaos)', options);
                setTestSent(true);
                setTimeout(() => setTestSent(false), 3000);
            });
        } else {
            requestPermission();
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('push_prompt_dismissed', 'true');
    };

    if (!supported) return null;

    return (
        <>
            {/* Floating Quick Alert Toggle Button (Bottom Left, Positioned above Mobile Bottom Nav) */}
            <div className="fixed bottom-20 left-4 md:bottom-5 md:left-5 z-40 flex items-center gap-2">
                <button
                    onClick={permission === 'granted' ? () => sendTestNotification() : requestPermission}
                    className={cn(
                        "group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full font-bold text-xs shadow-2xl backdrop-blur-xl border transition-all duration-300 active:scale-95 cursor-pointer",
                        permission === 'granted'
                            ? "bg-slate-900/90 text-emerald-400 border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            : "bg-[#E5B842] text-black border-amber-300 hover:bg-[#d4a737] shadow-[0_0_20px_rgba(229,184,66,0.3)] animate-pulse"
                    )}
                    title={permission === 'granted' ? "ทดสอบส่งการแจ้งเตือนบอลสด" : "เปิดการแจ้งเตือนบอลสดบนมือถือ"}
                >
                    {permission === 'granted' ? (
                        <>
                            <BellRing className="w-4 h-4 text-emerald-400 animate-bounce" />
                            <span className="hidden md:inline font-sans">
                                {testSent ? "ส่งแจ้งเตือนทดสอบแล้ว!" : "รับแจ้งเตือนบอลสด (เปิดแล้ว)"}
                            </span>
                        </>
                    ) : (
                        <>
                            <Bell className="w-4 h-4 text-black shrink-0" />
                            <span className="font-sans font-extrabold">แจ้งเตือนบอลสด</span>
                        </>
                    )}
                </button>
            </div>

            {/* Prompt Banner Popup when visiting first time */}
            {showBanner && permission === 'default' && (
                <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-50 p-4 rounded-3xl bg-[#0B0F17]/95 border border-[#E5B842]/40 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] font-sans animate-[fadeIn_0.4s_ease-out]">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E5B842]/20 border border-[#E5B842]/40 flex items-center justify-center text-[#E5B842] shrink-0">
                            <Radio className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="flex flex-col gap-1 pr-4">
                            <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                                เปิดแจ้งเตือนบอลสดบนมือถือ!
                                <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" />
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                ไม่พลาดแมตช์สำคัญ! รับการแจ้งเตือนทันทีเมื่อทีมโปรดลงสนามสดและมีสกอร์ยิงประตู
                            </p>

                            <div className="flex items-center gap-2 mt-3">
                                <button
                                    onClick={requestPermission}
                                    className="px-4 py-2 rounded-xl bg-[#E5B842] hover:bg-[#d4a737] text-black font-extrabold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                                >
                                    เปิดรับการแจ้งเตือน
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-semibold transition-all cursor-pointer"
                                >
                                    ไว้ทีหลัง
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
