'use client';

import { useState, useEffect, Suspense } from 'react';
import { Match } from '@/types/football';
import { Radio, Search, Flame } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

interface MatchSidebarProps {
    matches?: Match[];
    activeSlug?: string;
    selectedMatchId?: string;
    onSelectMatch?: (match: Match) => void;
}

function SidebarContent({
    matches = [],
    activeSlug,
    selectedMatchId,
    onSelectMatch
}: MatchSidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlSearch = searchParams?.get('search') || '';
    
    const [filter, setFilter] = useState<'ALL' | 'LIVE'>('ALL');
    const [searchTerm, setSearchTerm] = useState(urlSearch);

    useEffect(() => {
        if (urlSearch !== searchTerm) {
            queueMicrotask(() => setSearchTerm(urlSearch));
        }
    }, [urlSearch, searchTerm]);

    // กรองข้อมูลตามสถานะและคำค้นหา
    const filteredMatches = (matches || []).filter((m) => {
        const matchesFilter = filter === 'ALL' || m.status === 'LIVE';
        const homeName = m.homeTeam?.name?.toLowerCase() || '';
        const awayName = m.awayTeam?.name?.toLowerCase() || '';
        const leagueName = m.league?.name?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();

        const matchesSearch = homeName.includes(search) || awayName.includes(search) || leagueName.includes(search);
        return matchesFilter && matchesSearch;
    });

    return (
        <aside className="w-full flex flex-col h-full bg-[#0B0F17]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl font-sans">
            {/* Header & Filter Section */}
            <div className="p-4 border-b border-white/10 space-y-3 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-[#E5B842]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            ตารางถ่ายทอดสด
                        </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                        {filteredMatches.length} คู่
                    </span>
                </div>

                {/* Search Box สไตล์ Glassmorphism */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาทีม, ลีก..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842]/30 transition-all"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/30 rounded-xl border border-white/5">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`py-1.5 text-xs font-medium rounded-lg transition-all ${filter === 'ALL'
                                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        ทั้งหมด
                    </button>
                    <button
                        onClick={() => setFilter('LIVE')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${filter === 'LIVE'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                                : 'text-slate-400 hover:text-rose-400'
                            }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        LIVE
                    </button>
                </div>
            </div>

            {/* Match List Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[calc(100vh-280px)] custom-scrollbar">
                {filteredMatches.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs">
                        ไม่พบรายการแข่งขัน
                    </div>
                ) : (
                    filteredMatches.map((match, index) => {
                        const isLive = match.status === 'LIVE';
                        const isSelected = (activeSlug && match.slug === activeSlug) || (selectedMatchId && match.id === selectedMatchId);
                        const matchKey = match.id || `match-${index}`;

                        return (
                            <div
                                key={matchKey}
                                onClick={() => {
                                    if (onSelectMatch) {
                                        onSelectMatch(match);
                                    } else {
                                        router.push(`/watch/${match.slug || match.id}`);
                                    }
                                }}
                                className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${isSelected
                                        ? 'bg-gradient-to-r from-[#E5B842]/10 to-transparent border-[#E5B842]/50 shadow-[0_0_15px_rgba(229,184,66,0.15)]'
                                        : isLive
                                            ? 'bg-rose-500/[0.03] border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/[0.06] shadow-[0_0_12px_rgba(244,63,94,0.08)]'
                                            : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                                    }`}
                            >
                                {/* Active Indicator Line ข้างการ์ด */}
                                {isSelected && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E5B842]" />
                                )}

                                {/* League & Status Header */}
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                                    <span className="truncate max-w-[150px] font-medium text-slate-300">
                                        {match.league?.name ?? 'ไม่ระบุลีก'}
                                    </span>
                                    {isLive ? (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 animate-pulse">
                                            <Radio className="w-2.5 h-2.5" />
                                            LIVE {match.currentMinute ? `${match.currentMinute}'` : ''}
                                        </span>
                                    ) : match.status === 'FINISHED' ? (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-400 font-bold text-[9px] border border-white/10">
                                            จบการแข่งขัน
                                        </span>
                                    ) : (
                                        <span className="font-mono text-slate-400">
                                            {match.kickoffTime ?? '00:00'}
                                        </span>
                                    )}
                                </div>

                                {/* Teams Info */}
                                <div className="space-y-1.5">
                                    {/* Home Team */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-slate-300 shrink-0 overflow-hidden">
                                                {match.homeTeam?.logo ? (
                                                    <img src={match.homeTeam.logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    'H'
                                                )}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                                                {match.homeTeam?.name ?? 'ทีมเหย้า'}
                                            </span>
                                        </div>
                                        <span className="font-mono font-bold text-xs text-slate-100">
                                            {match.homeTeam?.score ?? '-'}
                                        </span>
                                    </div>

                                    {/* Away Team */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-slate-300 shrink-0 overflow-hidden">
                                                {match.awayTeam?.logo ? (
                                                    <img src={match.awayTeam.logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    'A'
                                                )}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                                                {match.awayTeam?.name ?? 'ทีมเยือน'}
                                            </span>
                                        </div>
                                        <span className="font-mono font-bold text-xs text-slate-100">
                                            {match.awayTeam?.score ?? '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
}

export default function MatchSidebar(props: MatchSidebarProps) {
    return (
        <Suspense fallback={<div className="w-full h-full bg-[#0B0F17]/90 rounded-2xl animate-pulse" />}>
            <SidebarContent {...props} />
        </Suspense>
    );
}