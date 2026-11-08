'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRealtimeMatches } from '@/hooks/useRealtimeMatches';
import { Flame, Volume2, VolumeX, X, Play, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalAlert {
    id: string;
    matchId: string;
    matchSlug: string;
    homeName: string;
    homeLogo?: string;
    awayName: string;
    awayLogo?: string;
    homeScore: number | string;
    awayScore: number | string;
    league: string;
    minute: string;
    scoringTeam: string;
    timestamp: number;
}

const STORAGE_MUTE_KEY = 'dooball_goal_alert_muted';

// Web Audio API Synthesizer สำหรับเสียงประกาศประตูสนามบอล
const playGoalSound = (isMuted: boolean) => {
    if (isMuted || typeof window === 'undefined') return;
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        // 1. Goal Fanfare Trumpet Horn (Arpeggio notes)
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = ctx.currentTime + idx * 0.12;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });

        // 2. Crowd Cheer Noise Effect
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(2, ctx.currentTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
        noiseGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.35);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start(ctx.currentTime + 0.2);
        noise.stop(ctx.currentTime + 0.8);
    } catch {
        // Ignore audio context autoplay restrictions
    }
};

export default function GoalNotifier() {
    const { matches = [] } = useRealtimeMatches([]) || {};
    const [currentAlert, setCurrentAlert] = useState<GoalAlert | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const prevScoresRef = useRef<{ [matchId: string]: { home: number; away: number } }>({});
    const isFirstRunRef = useRef(true);
    const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. โหลดการตั้งค่าเปิด/ปิดเสียงจาก LocalStorage และ Event Listener
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const saved = localStorage.getItem(STORAGE_MUTE_KEY);
            if (saved !== null) {
                queueMicrotask(() => setIsMuted(saved === 'true'));
            }
        } catch {}

        const handleSoundToggle = (e: Event) => {
            const detail = (e as CustomEvent<{ isMuted: boolean }>).detail;
            if (detail && typeof detail.isMuted === 'boolean') {
                setIsMuted(detail.isMuted);
            }
        };

        window.addEventListener('dooball_sound_toggle', handleSoundToggle);
        return () => window.removeEventListener('dooball_sound_toggle', handleSoundToggle);
    }, []);

    const toggleMute = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMuted((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_MUTE_KEY, String(next));
            } catch {}
            return next;
        });
    };

    // 2. ตรวจจับการยิงประตูเรียลไทม์
    useEffect(() => {
        if (!matches || matches.length === 0) return;

        const currentMap: { [matchId: string]: { home: number; away: number } } = {};

        matches.forEach((m) => {
            const matchId = String(m.id || m.slug);
            const homeScore = parseInt(String(m.homeTeam?.score || '0'), 10) || 0;
            const awayScore = parseInt(String(m.awayTeam?.score || '0'), 10) || 0;

            currentMap[matchId] = { home: homeScore, away: awayScore };

            // ถ้าไม่ใช่การรันครั้งแรก และบอลกำลังแข่งอยู่ (LIVE)
            if (!isFirstRunRef.current && prevScoresRef.current[matchId]) {
                const prev = prevScoresRef.current[matchId];
                const homeIncreased = homeScore > prev.home;
                const awayIncreased = awayScore > prev.away;

                if ((homeIncreased || awayIncreased) && m.status === 'LIVE') {
                    const scoringTeam = homeIncreased ? (m.homeTeam?.name || 'ทีมเหย้า') : (m.awayTeam?.name || 'ทีมเยือน');
                    
                    const newAlert: GoalAlert = {
                        id: `goal-${matchId}-${Date.now()}`,
                        matchId: m.id,
                        matchSlug: m.slug || m.id,
                        homeName: m.homeTeam?.name || 'ทีมเหย้า',
                        homeLogo: m.homeTeam?.logo,
                        awayName: m.awayTeam?.name || 'ทีมเยือน',
                        awayLogo: m.awayTeam?.logo,
                        homeScore,
                        awayScore,
                        league: m.league?.name || 'ฟุตบอลสด',
                        minute: m.currentMinute ? `${m.currentMinute}'` : 'สด',
                        scoringTeam,
                        timestamp: Date.now(),
                    };

                    setCurrentAlert(newAlert);
                    playGoalSound(isMuted);

                    // เคลียร์ Timer เก่า และตั้งเวลายุบแจ้งเตือนอัตโนมัติใน 8 วินาที
                    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
                    dismissTimerRef.current = setTimeout(() => {
                        setCurrentAlert(null);
                    }, 8000);
                }
            }
        });

        prevScoresRef.current = currentMap;
        if (isFirstRunRef.current) {
            isFirstRunRef.current = false;
        }
    }, [matches, isMuted]);

    if (!currentAlert) return null;

    return (
        <div className="fixed top-20 right-4 z-[9999] max-w-sm w-[calc(100vw-32px)] animate-[bounceIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] font-sans">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B0F17] to-slate-950 border-2 border-[#E5B842] shadow-[0_0_35px_rgba(229,184,66,0.4)] backdrop-blur-2xl p-4">
                
                {/* Glow & Sparkle Effects */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 animate-pulse" />
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#E5B842]/20 rounded-full blur-2xl pointer-events-none" />

                {/* Header: Goal Announcement & Actions */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                    <div className="flex items-center gap-1.5">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                        </span>
                        <span className="text-xs font-black tracking-widest text-[#E5B842] flex items-center gap-1 uppercase">
                            ⚽ GOALLLLLLL!
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                            {currentAlert.minute}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleMute}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            title={isMuted ? 'เปิดเสียงเตือน' : 'ปิดเสียงเตือน'}
                        >
                            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                        <button
                            onClick={() => setCurrentAlert(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Match Scoreboard Body */}
                <div className="flex items-center justify-between gap-3 py-1">
                    {/* Home Team */}
                    <div className="flex items-center gap-2 flex-1 justify-end text-right min-w-0">
                        <span className={cn(
                            "text-xs font-bold truncate",
                            currentAlert.scoringTeam === currentAlert.homeName ? "text-[#E5B842]" : "text-slate-200"
                        )}>
                            {currentAlert.homeName}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                            {currentAlert.homeLogo ? (
                                <img src={currentAlert.homeLogo} alt="" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-[10px] font-bold text-slate-400">H</span>
                            )}
                        </div>
                    </div>

                    {/* Score */}
                    <div className="px-2.5 py-1 rounded-xl bg-black/80 border border-white/15 font-mono font-black text-base text-[#E5B842] shadow-inner shrink-0">
                        {currentAlert.homeScore} : {currentAlert.awayScore}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center gap-2 flex-1 justify-start text-left min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                            {currentAlert.awayLogo ? (
                                <img src={currentAlert.awayLogo} alt="" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-[10px] font-bold text-slate-400">A</span>
                            )}
                        </div>
                        <span className={cn(
                            "text-xs font-bold truncate",
                            currentAlert.scoringTeam === currentAlert.awayName ? "text-[#E5B842]" : "text-slate-200"
                        )}>
                            {currentAlert.awayName}
                        </span>
                    </div>
                </div>

                {/* Subtitle Info */}
                <p className="text-[11px] text-center text-slate-400 mt-1 truncate">
                    <strong className="text-amber-400">{currentAlert.scoringTeam}</strong> ยิงประตูขึ้นนำ ({currentAlert.league})
                </p>

                {/* Quick Action CTA Button */}
                <Link
                    href={`/watch/${currentAlert.matchSlug}`}
                    onClick={() => setCurrentAlert(null)}
                    className="mt-3 w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#E5B842] to-amber-500 hover:from-[#f3c853] hover:to-amber-400 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(229,184,66,0.3)] transition-all cursor-pointer"
                >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>🔴 สลับไปดูคู่นี้ทันที (Watch Live)</span>
                </Link>

            </div>
        </div>
    );
}
