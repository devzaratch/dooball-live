'use client';

import Link from 'next/link';
import { Match } from '@/types/football';
import { Radio, Play, Clock, Tv } from 'lucide-react';
import MatchReminderButton from '@/components/common/MatchReminderButton';
import { useLanguage } from '@/context/LanguageContext';

interface MatchCardProps {
    match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
    const { t } = useLanguage();
    const isLive = match.status === 'LIVE';
    const matchTargetUrl = `/watch/${match.slug || match.id}`;

    return (
        <div className={`group relative flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-300 backdrop-blur-xl ${
            isLive 
                ? 'bg-gradient-to-r from-rose-500/[0.06] via-slate-900/90 to-slate-900/80 border-rose-500/40 hover:border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.12)]' 
                : 'bg-[#0B0F17]/80 border-white/10 hover:border-white/20 hover:bg-[#0B0F17]/95 shadow-lg'
        }`}>
            {/* Left/Top: Status & League */}
            <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:items-start gap-1 mb-2 sm:mb-0 shrink-0">
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate max-w-[130px] sm:max-w-[140px]">
                    {match.league?.name || 'ทั่วไป'}
                </span>
                
                {isLive ? (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] sm:text-[11px] font-bold border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse">
                        <Radio className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        LIVE {match.currentMinute ? `${match.currentMinute}'` : ''}
                    </span>
                ) : match.status === 'FINISHED' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-white/10">
                        จบการแข่งขัน
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-slate-400 bg-white/5 px-2 sm:px-2.5 py-0.5 rounded-full border border-white/10">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                        {match.kickoffTime || '00:00'}
                    </span>
                )}
            </div>

            {/* Center: Teams & Score */}
            <div className="flex items-center justify-center gap-2 sm:gap-6 flex-1 w-full my-1 sm:my-0 px-1 sm:px-2">
                {/* Home Team */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 w-5/12 text-right">
                    <span className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-[#E5B842] transition-colors">
                        {match.homeTeam?.name || 'ทีมเหย้า'}
                    </span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 p-1 sm:p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        {match.homeTeam?.logo ? (
                            <img src={match.homeTeam.logo} alt="" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-xs font-bold text-slate-400">H</span>
                        )}
                    </div>
                </div>

                {/* Score / VS */}
                <div className="flex flex-col items-center justify-center shrink-0 min-w-[45px] sm:min-w-[50px]">
                    {isLive || match.status === 'FINISHED' || (match.homeTeam?.score !== '-' && match.homeTeam?.score !== undefined && match.homeTeam?.score !== '?') ? (
                        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-black/70 border border-white/15 font-mono font-black text-sm sm:text-lg text-[#E5B842] shadow-inner">
                            <span>{match.homeTeam?.score ?? 0}</span>
                            <span className="text-slate-500 text-xs">:</span>
                            <span>{match.awayTeam?.score ?? 0}</span>
                        </div>
                    ) : (
                        <span className="text-[10px] sm:text-xs font-black text-slate-500 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl bg-black/40 border border-white/10">
                            VS
                        </span>
                    )}
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-start gap-2 sm:gap-3 w-5/12 text-left">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 p-1 sm:p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        {match.awayTeam?.logo ? (
                            <img src={match.awayTeam.logo} alt="" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-xs font-bold text-slate-400">A</span>
                        )}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-[#E5B842] transition-colors">
                        {match.awayTeam?.name || 'ทีมเยือน'}
                    </span>
                </div>
            </div>

            {/* Right/Bottom: Watch CTA & Reminder */}
            <div className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center justify-end gap-2 shrink-0">
                <MatchReminderButton match={match} variant="icon" />
                
                <Link
                    href={matchTargetUrl}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                        isLive
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                            : 'bg-[#E5B842] hover:bg-[#d4a737] text-black shadow-[0_0_10px_rgba(229,184,66,0.2)]'
                    }`}
                >
                    <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                    <span>{t('watch_live')}</span>
                </Link>
            </div>
        </div>
    );
}
