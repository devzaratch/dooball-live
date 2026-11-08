'use client';

import { useState, useEffect, useMemo } from 'react';
import { Film, Play, Calendar, X, CheckCircle2, Search, RefreshCw, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import SocialShareBar from '@/components/common/SocialShareBar';

const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
);

export interface HighlightVideo {
    id: string;
    videoId: string;
    title: string;
    league: string;
    channelName: string;
    thumbnail: string;
    date: string;
    views: string;
    duration: string;
}

// Fallback เริ่มต้นกรณีโหลดช้าหรือออฟไลน์
const FALLBACK_HIGHLIGHTS: HighlightVideo[] = [
    {
        id: 'hl-1',
        videoId: 'ud6YGDqqak4',
        title: 'บาเลนเซีย 0-1 เรอัล เบติส | ลาลีกา ไฮไลต์ LaLiga',
        league: 'ลาลีกา',
        channelName: 'beIN SPORTS Thailand',
        thumbnail: 'https://i.ytimg.com/vi/ud6YGDqqak4/hqdefault.jpg',
        date: 'วันนี้',
        views: 'Official HD',
        duration: 'Full HD',
    },
    {
        id: 'hl-2',
        videoId: 'ZmjMPYCBuvA',
        title: 'ซาบาห์ 5-2 ฮาโปเอล เบียร์ เชว่า | ยูฟ่า แชมเปียนส์ ลีก ไฮไลต์',
        league: 'ยูฟ่า แชมเปียนส์ลีก',
        channelName: 'beIN SPORTS Thailand',
        thumbnail: 'https://i.ytimg.com/vi/ZmjMPYCBuvA/hqdefault.jpg',
        date: 'เมื่อวานนี้',
        views: 'Official HD',
        duration: 'Full HD',
    },
    {
        id: 'hl-3',
        videoId: 'iBuTEywEQ6U',
        title: 'ลิเวอร์พูล 7-0 แมนเชสเตอร์ ยูไนเต็ด | ไฮไลท์ พรีเมียร์ลีก',
        league: 'พรีเมียร์ลีก',
        channelName: 'TrueVisions Official',
        thumbnail: 'https://i.ytimg.com/vi/iBuTEywEQ6U/hqdefault.jpg',
        date: 'สัปดาห์นี้',
        views: 'Official HD',
        duration: 'Full HD',
    },
    {
        id: 'hl-4',
        videoId: 'WUbBWKU0bCc',
        title: 'ทีมชาติไทย 2-1 มาเลเซีย | ไฮไลท์ฟุตบอลชิงแชมป์อาเซียน',
        league: 'ทีมชาติไทย / บอลไทย',
        channelName: 'ช้างศึก - ฟุตบอลทีมชาติไทย',
        thumbnail: 'https://i.ytimg.com/vi/WUbBWKU0bCc/hqdefault.jpg',
        date: 'สัปดาห์นี้',
        views: 'Official HD',
        duration: 'Full HD',
    },
];

export default function HighlightsClient() {
    const { t } = useLanguage();
    const [highlights, setHighlights] = useState<HighlightVideo[]>(FALLBACK_HIGHLIGHTS);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedLeague, setSelectedLeague] = useState('ทั้งหมด');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeVideo, setActiveVideo] = useState<HighlightVideo | null>(null);

    // ดึงคลิปไฮไลท์สดใหม่จาก API อัตโนมัติ
    const fetchLatestHighlights = async (showLoader = false) => {
        if (showLoader) setIsRefreshing(true);
        try {
            const res = await fetch('/api/highlights');
            const data = await res.json();
            if (data?.highlights && Array.isArray(data.highlights) && data.highlights.length > 0) {
                setHighlights(data.highlights);
            }
        } catch (err) {
            console.warn('Failed to load dynamic highlights, using fallback:', err);
        } finally {
            setIsLoading(false);
            if (showLoader) setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchLatestHighlights();
        };
        load();
    }, []);

    // คำนวณแท็บลีกที่มีคลิปจริง
    const leagueFilters = useMemo(() => {
        const setOfLeagues = new Set<string>();
        highlights.forEach((h) => {
            if (h.league) setOfLeagues.add(h.league);
        });
        return ['ทั้งหมด', ...Array.from(setOfLeagues)];
    }, [highlights]);

    // กรองคลิปตามลีก และคำค้นหา
    const filteredHighlights = useMemo(() => {
        return highlights.filter((item) => {
            const matchesLeague = selectedLeague === 'ทั้งหมด' || item.league === selectedLeague;
            const matchesSearch = !searchQuery.trim() || 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.channelName.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesLeague && matchesSearch;
        });
    }, [highlights, selectedLeague, searchQuery]);

    return (
        <div className="flex flex-col gap-6 md:gap-8 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 max-w-[1600px] mx-auto min-h-screen font-sans animate-[fadeIn_0.5s_ease-out]">
            
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B0F17] via-slate-950 to-slate-900 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1518605368461-1e1e38ce8058?w=1600&q=80')] bg-cover bg-center opacity-[0.03] mix-blend-overlay" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-rose-500/10 blur-[80px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-[1px] shadow-[0_0_20px_rgba(244,63,94,0.3)] shrink-0">
                            <div className="w-full h-full bg-black/80 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                                <Film className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500" />
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide">
                                    {t('highlights_hub_title')}
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    อัปเดตอัตโนมัติ Real-Time
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                    <YoutubeIcon className="w-3.5 h-3.5" />
                                    YouTube Official
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400">
                                ดึงคลิปไฮไลท์สดใหม่จาก beIN SPORTS Thailand, TrueVisions Official และช่องสโมสรทางการ คมชัดระดับ Full HD
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button
                            onClick={() => fetchLatestHighlights(true)}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                            title="รีเฟรชดึงคลิปล่าสุด"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
                            <span>รีเฟรชคลิปใหม่</span>
                        </button>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* League Filter Buttons */}
                    <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar">
                        {leagueFilters.map((league) => (
                            <button
                                key={league}
                                onClick={() => setSelectedLeague(league)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    selectedLeague === league
                                        ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {league}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full lg:w-72">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาทีม, คู่แข่งขัน..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Grid Video Section */}
            {isLoading ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                    <p className="text-xs">กำลังดึงคลิปไฮไลท์สดใหม่จากช่อง Official...</p>
                </div>
            ) : filteredHighlights.length === 0 ? (
                <div className="py-20 rounded-3xl bg-[#0B0F17]/60 border border-white/10 text-center flex flex-col items-center justify-center gap-3">
                    <Film className="w-10 h-10 text-slate-600" />
                    <h3 className="text-sm font-bold text-slate-300">ไม่พบคลิปไฮไลท์ที่ค้นหา</h3>
                    <p className="text-xs text-slate-500">ลองเปลี่ยนคำค้นหา หรือเลือกแท็บ &ldquo;ทั้งหมด&rdquo;</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredHighlights.map((highlight) => (
                        <div 
                            key={highlight.id} 
                            onClick={() => setActiveVideo(highlight)}
                            className="group flex flex-col bg-[#0B0F17]/80 border border-white/10 rounded-2xl overflow-hidden hover:border-rose-500/60 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] transition-all duration-300 cursor-pointer backdrop-blur-xl"
                        >
                            {/* Thumbnail Container */}
                            <div className="relative aspect-video overflow-hidden bg-slate-950">
                                <img 
                                    src={highlight.thumbnail} 
                                    alt={highlight.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${highlight.videoId}/hqdefault.jpg`;
                                    }}
                                />
                                
                                {/* Play Icon Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center scale-90 group-hover:scale-110 transition-all duration-300 shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                                    </div>
                                </div>
                                
                                {/* Duration Badge */}
                                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono font-bold backdrop-blur-md border border-white/10">
                                    {highlight.duration || 'Full HD'}
                                </div>
                                
                                {/* League Badge */}
                                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-rose-500/90 text-white text-[10px] font-bold shadow-md">
                                    {highlight.league}
                                </div>
                            </div>
                            
                            {/* Video Info */}
                            <div className="p-4 flex flex-col gap-2.5 flex-1">
                                <h3 className="font-bold text-slate-100 text-xs sm:text-sm line-clamp-2 group-hover:text-rose-400 transition-colors leading-snug">
                                    {highlight.title}
                                </h3>

                                {/* Channel Badge */}
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                    <span>{highlight.channelName}</span>
                                </div>
                                
                                {/* Footer Stats */}
                                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-auto pt-2.5 border-t border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{highlight.date}</span>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                                        {highlight.views || 'Official HD'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ================= YOUTUBE EMBED MODAL POPUP ================= */}
            {activeVideo && (
                <div 
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-[fadeIn_0.3s_ease-out]"
                    onClick={() => setActiveVideo(null)}
                >
                    <div 
                        className="relative w-full max-w-4xl bg-[#0B0F17] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 px-6 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-3 min-w-0 pr-4">
                                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                                    <YoutubeIcon className="w-4 h-4 text-rose-500" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="font-bold text-slate-100 text-sm truncate">
                                        {activeVideo.title}
                                    </h3>
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                                        {activeVideo.channelName} • {activeVideo.league}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveVideo(null)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* YouTube Player Responsive Container */}
                        <div className="relative aspect-video w-full bg-black">
                            <iframe
                                src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`}
                                title={activeVideo.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>

                        {/* Modal Footer & 1-Click Share Bar */}
                        <div className="p-4 px-6 bg-[#0B0F17] border-t border-white/10 flex flex-col gap-3">
                            <SocialShareBar 
                                title={activeVideo.title}
                                url={`https://www.youtube.com/watch?v=${activeVideo.videoId}`}
                            />
                            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                                <span>อัปเดตเมื่อ: {activeVideo.date}</span>
                                <span className="text-slate-500 font-mono">ระบบสตรีมมิ่ง HD Official</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
