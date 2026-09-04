"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv, Trophy, Film, Newspaper, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

const ThaiFlagIcon = () => (
    <svg className="w-4 h-4 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20" viewBox="0 0 640 480">
        <path fill="#f4f5f8" d="M0 0h640v480H0z"/>
        <path fill="#2d2a4a" d="M0 160h640v160H0z"/>
        <path fill="#a51931" d="M0 0h640v80H0zm0 400h640v80H0z"/>
    </svg>
);

const LaoFlagIcon = () => (
    <svg className="w-4 h-4 rounded-full overflow-hidden shrink-0 shadow-sm border border-white/20" viewBox="0 0 640 480">
        <path fill="#ce1126" d="M0 0h640v480H0z"/>
        <path fill="#002b7f" d="M0 120h640v240H0z"/>
        <circle cx="320" cy="240" r="80" fill="#fff"/>
    </svg>
);

export default function Navbar() {
    const pathname = usePathname();
    const { lang, setLang, t } = useLanguage();
    const [isGoalSoundMuted, setIsGoalSoundMuted] = useState(false);

    // ตรวจสอบสถานะการเปิด/ปิดเสียงจาก LocalStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const saved = localStorage.getItem('dooball_goal_alert_muted');
            if (saved !== null) {
                setIsGoalSoundMuted(saved === 'true');
            }
        } catch {}

        const handleSoundSync = (e: any) => {
            if (e.detail && typeof e.detail.isMuted === 'boolean') {
                setIsGoalSoundMuted(e.detail.isMuted);
            }
        };

        window.addEventListener('dooball_sound_toggle', handleSoundSync);
        return () => window.removeEventListener('dooball_sound_toggle', handleSoundSync);
    }, []);

    // สลับเปิด/ปิดเสียงเตือนประตู พร้อมปลดล็อก Web Audio Context
    const handleToggleGoalSound = () => {
        const next = !isGoalSoundMuted;
        setIsGoalSoundMuted(next);
        try {
            localStorage.setItem('dooball_goal_alert_muted', String(next));
            window.dispatchEvent(new CustomEvent('dooball_sound_toggle', { detail: { isMuted: next } }));
            
            // เล่นเสียงทดสอบสั้นๆ เมื่อเปิดเสียง เพื่อปลดล็อก AudioContext บนเบราว์เซอร์
            if (!next && typeof window !== 'undefined') {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.15);
                }
            }
        } catch {}
    };

    const navLinks = [
        { href: '/', label: t('live_football'), icon: Tv },
        { href: '/table', label: t('table'), icon: Trophy },
        { href: '/highlights', label: t('highlights'), icon: Film },
        { href: '/news', label: t('news'), icon: Newspaper },
    ];

    return (
        <>
            <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0B0E14]/80 border-b border-white/10">
                <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 font-bold tracking-wider group">
                        <img 
                            src="/logo.jpg" 
                            alt="DoBallLaos Dooball Live" 
                            className="h-10 w-10 object-cover rounded-full shadow-[0_0_15px_rgba(229,184,66,0.4)] group-hover:scale-105 transition-transform border border-amber-500/40" 
                        />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-0.5 font-black leading-none text-base">
                                <span className="text-[#E5B842]">DoBall</span>
                                <span className="text-white">Laos</span>
                            </div>
                            <span className="text-[9px] font-extrabold text-slate-400 tracking-widest mt-0.5">DOOBALL LIVE</span>
                        </div>
                    </Link>

                    {/* Navigation Menu */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                            
                            return (
                                <Link 
                                    key={link.href} 
                                    href={link.href} 
                                    className={cn(
                                        "flex items-center gap-2 transition-colors",
                                        isActive ? "text-[#E5B842]" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Icon className="w-4 h-4" /> {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Actions: Sound Toggle + Language Switcher */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Goal Sound Notifier Quick Toggle */}
                        <button
                            onClick={handleToggleGoalSound}
                            className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold transition-all cursor-pointer",
                                !isGoalSoundMuted 
                                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]" 
                                    : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
                            )}
                            title={!isGoalSoundMuted ? 'ระบบเตือนเสียงเมื่อมีประตูเปิดอยู่ (แตะเพื่อปิด)' : 'ระบบเตือนเสียงเมื่อมีประตูปิดอยู่ (แตะเพื่อเปิด)'}
                        >
                            {!isGoalSoundMuted ? (
                                <>
                                    <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                    <span className="hidden sm:inline">เสียงเตือนสด</span>
                                </>
                            ) : (
                                <>
                                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="hidden sm:inline">ปิดเสียง</span>
                                </>
                            )}
                        </button>

                        {/* TH / LA Language Switcher */}
                        <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-full text-[11px] font-bold">
                            <button
                                onClick={() => setLang('th')}
                                className={cn(
                                    "px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5",
                                    lang === 'th' ? "bg-[#E5B842] text-black shadow-sm font-black" : "text-slate-400 hover:text-white"
                                )}
                                title="สลับเป็นภาษาไทย (TH)"
                            >
                                <ThaiFlagIcon />
                                <span>TH</span>
                            </button>
                            <button
                                onClick={() => setLang('la')}
                                className={cn(
                                    "px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5",
                                    lang === 'la' ? "bg-[#E5B842] text-black shadow-sm font-black" : "text-slate-400 hover:text-white"
                                )}
                                title="ປ່ຽນเป็นພາສາລາວ (LA)"
                            >
                                <LaoFlagIcon />
                                <span>LA</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation Bar (Fixed to Viewport Bottom 100%) */}
            <nav className="fixed bottom-0 left-0 right-0 z-[999] md:hidden bg-[#0B0F17]/95 border-t border-white/10 backdrop-blur-xl px-3 py-2 flex items-center justify-around shadow-[0_-5px_25px_rgba(0,0,0,0.8)]">
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all py-1 px-3 rounded-xl",
                                isActive ? "text-[#E5B842] font-bold" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "scale-110 drop-shadow-[0_0_8px_rgba(229,184,66,0.5)]")} />
                            <span className="text-[10px] tracking-tight">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}