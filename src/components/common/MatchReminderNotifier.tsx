'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRealtimeMatches } from '@/hooks/useRealtimeMatches';
import { Match } from '@/types/football';
import { BellRing, X, Radio, ChevronRight } from 'lucide-react';

export default function MatchReminderNotifier() {
    const { matches = [] } = useRealtimeMatches([]) || {};
    const [liveReminders, setLiveReminders] = useState<Match[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    useEffect(() => {
        const checkReminders = () => {
            try {
                const savedIds: string[] = JSON.parse(localStorage.getItem('user_match_reminders') || '[]');
                if (savedIds.length === 0 || !matches || matches.length === 0) {
                    setLiveReminders([]);
                    return;
                }

                // ค้นหาคู่บอลที่ผู้ใช้กดตั้งการแจ้งเตือนไว้ และกำลังแข่ง (LIVE) อยู่ตอนนี้
                const activeLiveMatches = matches.filter(
                    (m) => savedIds.includes(m.id) && m.status === 'LIVE'
                );

                setLiveReminders(activeLiveMatches);
            } catch (err) {
                console.error('Error checking match reminders:', err);
            }
        };

        checkReminders();

        window.addEventListener('reminders_updated', checkReminders);
        return () => {
            window.removeEventListener('reminders_updated', checkReminders);
        };
    }, [matches]);

    const handleDismiss = (id: string) => {
        setDismissedIds((prev) => [...prev, id]);
    };

    const visibleAlerts = liveReminders.filter((m) => !dismissedIds.includes(m.id));

    if (visibleAlerts.length === 0) return null;

    return (
        <div className="fixed bottom-64 right-4 md:bottom-6 md:right-6 z-50 flex flex-col gap-3 max-w-sm w-full p-4 pointer-events-none">
            {visibleAlerts.map((match) => (
                <div
                    key={match.id}
                    className="pointer-events-auto relative flex flex-col gap-2.5 bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.3)] backdrop-blur-xl animate-[slideIn_0.4s_ease-out]"
                >
                    {/* Top Bar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold animate-pulse">
                                <Radio className="w-3 h-3" /> LIVE NOW
                            </span>
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                                <BellRing className="w-3.5 h-3.5" /> แจ้งเตือนบอลเตะ!
                            </span>
                        </div>
                        <button
                            onClick={() => handleDismiss(match.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Match Info */}
                    <div className="flex items-center justify-between my-1">
                        <span className="font-extrabold text-sm text-slate-100 truncate">
                            {match.homeTeam.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400 px-2">VS</span>
                        <span className="font-extrabold text-sm text-slate-100 truncate text-right">
                            {match.awayTeam.name}
                        </span>
                    </div>

                    {/* Action Link */}
                    <Link
                        href={`/watch/${match.slug || match.id}`}
                        onClick={() => handleDismiss(match.id)}
                        className="mt-1 w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center justify-center gap-1 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                        <span>เข้าดูบอลสดคู่นี้เลย</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            ))}
        </div>
    );
}
