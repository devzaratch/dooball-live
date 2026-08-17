'use client';

import { Activity, ShieldAlert, Award, UserCheck } from 'lucide-react';

export interface MatchEvent {
    id?: string;
    minute: number;
    team: 'home' | 'away';
    type: 'goal' | 'yellow_card' | 'red_card' | 'sub';
    player: string;
    assistOrSub?: string;
}

interface MatchEventsTimelineProps {
    events?: MatchEvent[];
    homeTeamName?: string;
    awayTeamName?: string;
}

export default function MatchEventsTimeline({ events = [], homeTeamName = 'ทีมเหย้า', awayTeamName = 'ทีมเยือน' }: MatchEventsTimelineProps) {
    const getEventIcon = (type: MatchEvent['type']) => {
        switch (type) {
            case 'goal':
                return <span className="text-sm">⚽</span>;
            case 'yellow_card':
                return <div className="w-3 h-4 bg-amber-400 rounded-sm shadow-sm border border-amber-500/50" />;
            case 'red_card':
                return <div className="w-3 h-4 bg-rose-600 rounded-sm shadow-sm border border-rose-700/50" />;
            case 'sub':
                return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
            default:
                return <Activity className="w-3.5 h-3.5 text-slate-400" />;
        }
    };

    const sortedEvents = [...events].sort((a, b) => b.minute - a.minute);

    return (
        <div className="rounded-2xl bg-[#0B0F17]/90 border border-white/10 p-4 backdrop-blur-xl shadow-xl space-y-3 font-sans">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842]">
                        <Activity className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs md:text-sm font-bold text-slate-100">เหตุการณ์สำคัญในแมตช์ (Match Timeline)</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">LIVE EVENTS</span>
            </div>

            {sortedEvents.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                    <p className="font-medium text-slate-400">ยังไม่มีเหตุการณ์สำคัญเกิดขึ้นในขณะนี้</p>
                    <p className="text-[11px] text-slate-500">เหตุการณ์ (ประตู, ใบเหลือง, ใบแดง) จะแสดงทันทีเมื่อเกิดขึ้น</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {sortedEvents.map((evt, idx) => (
                        <div
                            key={evt.id || idx}
                            className={`flex items-center gap-3 p-2 rounded-xl border text-xs transition-all ${
                                evt.team === 'home'
                                    ? 'bg-amber-500/5 border-amber-500/10 justify-start'
                                    : 'bg-blue-500/5 border-blue-500/10 justify-end'
                            }`}
                        >
                            {evt.team === 'home' && (
                                <>
                                    <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-[11px] font-bold text-[#E5B842]">
                                        {evt.minute}&apos;
                                    </span>
                                    <div className="p-1 rounded-lg bg-white/5 border border-white/10">
                                        {getEventIcon(evt.type)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-200">{evt.player}</span>
                                        {evt.assistOrSub && (
                                            <span className="text-[10px] text-slate-400">({evt.assistOrSub})</span>
                                        )}
                                    </div>
                                </>
                            )}

                            {evt.team === 'away' && (
                                <>
                                    <div className="flex flex-col text-right">
                                        <span className="font-bold text-slate-200">{evt.player}</span>
                                        {evt.assistOrSub && (
                                            <span className="text-[10px] text-slate-400">({evt.assistOrSub})</span>
                                        )}
                                    </div>
                                    <div className="p-1 rounded-lg bg-white/5 border border-white/10">
                                        {getEventIcon(evt.type)}
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-[11px] font-bold text-blue-400">
                                        {evt.minute}&apos;
                                    </span>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
