"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv, Trophy, Film, Newspaper } from 'lucide-react';
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

    const navLinks = [
        { href: '/', label: t('live_football'), icon: Tv },
        { href: '/table', label: t('table'), icon: Trophy },
        { href: '/highlights', label: t('highlights'), icon: Film },
        { href: '/news', label: t('news'), icon: Newspaper },
    ];

    return (
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

                {/* Language Switcher Actions */}
                <div className="flex items-center gap-3">
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
                            title="ປ່ຽນເປັນພາສາລາວ (LA)"
                        >
                            <LaoFlagIcon />
                            <span>LA</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation Bar (App Navigation Feel) */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0B0F17]/95 border-t border-white/10 backdrop-blur-xl px-3 py-1.5 flex items-center justify-around shadow-2xl">
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
        </header>
    );
}