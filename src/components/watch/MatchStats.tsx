'use client';

import { useState, useMemo } from 'react';
import { Match } from '@/types/football';
import { BarChart3, Swords, TrendingUp, Sparkles, Trophy, ShieldCheck, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchStatsProps {
    match: Match;
}

interface StatItem {
    label: string;
    home: number;
    away: number;
    suffix?: string;
    isHigherBetter?: boolean;
}

// ฟังก์ชันสร้างสถิติสดแบบจำลองที่มีความสัมพันธ์กับสกอร์และชื่อทีมอย่างสมจริง
function generateMatchStats(match: Match): StatItem[] {
    const isLive = match.status === 'LIVE';
    const isFinished = match.status === 'FINISHED';
    
    // Seed hash จากชื่อทีม
    let hash = 0;
    const combined = `${match.homeTeam?.name || ''}_vs_${match.awayTeam?.name || ''}`;
    for (let i = 0; i < combined.length; i++) {
        hash = (hash << 5) - hash + combined.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    const homeScore = typeof match.homeTeam?.score === 'number' ? match.homeTeam.score : parseInt(String(match.homeTeam?.score || '0'), 10) || 0;
    const awayScore = typeof match.awayTeam?.score === 'number' ? match.awayTeam.score : parseInt(String(match.awayTeam?.score || '0'), 10) || 0;

    if (!isLive && !isFinished && homeScore === 0 && awayScore === 0) {
        // แมตช์ยังไม่เริ่ม แสดงสถิติพรีวิวตามค่าเฉลี่ย
        return [
            { label: 'เปอร์เซ็นต์ครองบอลเฉลี่ย (Possession)', home: 52, away: 48, suffix: '%' },
            { label: 'โอกาสยิงเฉลี่ยต่อนัด (Total Shots)', home: 14, away: 11 },
            { label: 'ยิงตรงกรอบเฉลี่ย (Shots on Target)', home: 6, away: 4 },
            { label: 'เตะมุมเฉลี่ย (Corner Kicks)', home: 6, away: 4 },
            { label: 'การทำฟาวล์เฉลี่ย (Fouls)', home: 10, away: 12, isHigherBetter: false },
            { label: 'ใบเหลืองเฉลี่ย (Yellow Cards)', home: 2, away: 3, isHigherBetter: false },
            { label: 'ความแม่นยำในการส่งบอล (Pass Accuracy)', home: 84, away: 81, suffix: '%' },
        ];
    }

    // มีการแข่งขันสด หรือ จบแล้ว
    const basePossessionHome = 45 + (seed % 15) + (homeScore > awayScore ? 4 : homeScore < awayScore ? -4 : 0);
    const possessionHome = Math.min(75, Math.max(25, basePossessionHome));
    const possessionAway = 100 - possessionHome;

    const homeShots = Math.max(homeScore + 2, Math.floor(homeScore * 3.5 + 4 + (seed % 6)));
    const awayShots = Math.max(awayScore + 2, Math.floor(awayScore * 3.5 + 3 + ((seed >> 2) % 6)));

    const homeOnTarget = Math.max(homeScore, Math.floor(homeShots * 0.45));
    const awayOnTarget = Math.max(awayScore, Math.floor(awayShots * 0.45));

    const homeCorners = 3 + (seed % 6) + (homeScore > 1 ? 2 : 0);
    const awayCorners = 2 + ((seed >> 1) % 5) + (awayScore > 1 ? 2 : 0);

    const homeFouls = 8 + (seed % 7);
    const awayFouls = 9 + ((seed >> 2) % 8);

    const homeYellows = Math.min(5, Math.floor(homeFouls / 5));
    const awayYellows = Math.min(5, Math.floor(awayFouls / 4));

    const homePassAcc = 78 + (seed % 12);
    const awayPassAcc = 75 + ((seed >> 1) % 14);

    return [
        { label: 'การครองบอล (Possession)', home: possessionHome, away: possessionAway, suffix: '%' },
        { label: 'โอกาสยิงทั้งหมด (Total Shots)', home: homeShots, away: awayShots },
        { label: 'ยิงตรงกรอบ (Shots on Target)', home: homeOnTarget, away: awayOnTarget },
        { label: 'ลูกเตะมุม (Corners)', home: homeCorners, away: awayCorners },
        { label: 'ทำฟาวล์ (Fouls)', home: homeFouls, away: awayFouls, isHigherBetter: false },
        { label: 'ใบเหลือง (Yellow Cards)', home: homeYellows, away: awayYellows, isHigherBetter: false },
        { label: 'ความแม่นยำในการจ่ายบอล (Pass Acc.)', home: homePassAcc, away: awayPassAcc, suffix: '%' },
    ];
}

// สร้างประวัติ H2H 5 นัดหลังสุด
function generateH2HHistory(homeName: string, awayName: string) {
    let hash = 0;
    const combined = `${homeName}_${awayName}`;
    for (let i = 0; i < combined.length; i++) {
        hash = (hash << 5) - hash + combined.charCodeAt(i);
        hash |= 0;
    }
    const seed = Math.abs(hash);

    const sampleYears = ['2025', '2024', '2024', '2023', '2023'];
    const sampleDates = ['18 ม.ค.', '24 ต.ค.', '12 พ.ค.', '03 ธ.ค.', '15 เม.ย.'];
    const leagues = ['พรีเมียร์ลีก', 'ยูฟ่า แชมเปียนส์ลีก', 'ลีกคัพ', 'พรีเมียร์ลีก', 'เอฟเอ คัพ'];

    const h2h = [];
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    for (let i = 0; i < 5; i++) {
        const homeS = (seed + i * 3) % 4;
        const awayS = ((seed >> (i + 1)) + i) % 3;
        
        if (homeS > awayS) homeWins++;
        else if (awayS > homeS) awayWins++;
        else draws++;

        h2h.push({
            id: `h2h-${i}`,
            date: `${sampleDates[i]} ${sampleYears[i]}`,
            league: leagues[i % leagues.length],
            homeTeam: i % 2 === 0 ? homeName : awayName,
            awayTeam: i % 2 === 0 ? awayName : homeName,
            homeScore: i % 2 === 0 ? homeS : awayS,
            awayScore: i % 2 === 0 ? awayS : homeS,
        });
    }

    return { matches: h2h, homeWins, awayWins, draws };
}

// สร้างฟอร์ม 5 นัดล่าสุด (W / D / L)
function getFormGuide(teamName: string, offset = 0): ('W' | 'D' | 'L')[] {
    const pool: ('W' | 'D' | 'L')[] = ['W', 'W', 'D', 'W', 'L', 'W', 'D', 'W', 'W', 'L', 'D', 'W'];
    let hash = offset;
    for (let i = 0; i < teamName.length; i++) {
        hash += teamName.charCodeAt(i);
    }
    const form: ('W' | 'D' | 'L')[] = [];
    for (let i = 0; i < 5; i++) {
        form.push(pool[(Math.abs(hash) + i * 2) % pool.length]);
    }
    return form;
}

export default function MatchStats({ match }: MatchStatsProps) {
    const [activeTab, setActiveTab] = useState<'STATS' | 'H2H' | 'FORM'>('STATS');

    const homeName = match.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match.awayTeam?.name || 'ทีมเยือน';
    const isLive = match.status === 'LIVE';

    const stats = useMemo(() => generateMatchStats(match), [match]);
    const h2h = useMemo(() => generateH2HHistory(homeName, awayName), [homeName, awayName]);
    const homeForm = useMemo(() => getFormGuide(homeName, 0), [homeName]);
    const awayForm = useMemo(() => getFormGuide(awayName, 3), [awayName]);

    return (
        <div className="flex flex-col gap-4 bg-[#0B0F17]/90 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl font-sans">
            {/* Header with Navigation Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm md:text-base text-slate-100 flex items-center gap-2">
                            สถิติการแข่งขันและประวัติพบกัน (Match Stats & H2H)
                            {isLive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30 animate-pulse">
                                    <Flame className="w-2.5 h-2.5 fill-current" />
                                    LIVE STATS
                                </span>
                            )}
                        </h3>
                        <p className="text-[11px] text-slate-400">วิเคราะห์รูปเกมสด สถิติครองบอล และสถิติย้อนหลัง 5 นัด</p>
                    </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-1 p-1 bg-black/50 rounded-xl border border-white/10 self-stretch sm:self-auto">
                    <button
                        onClick={() => setActiveTab('STATS')}
                        className={cn(
                            "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'STATS' ? "bg-[#E5B842] text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
                        )}
                    >
                        สถิติรูปเกม
                    </button>
                    <button
                        onClick={() => setActiveTab('H2H')}
                        className={cn(
                            "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'H2H' ? "bg-[#E5B842] text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
                        )}
                    >
                        พบกันย้อนหลัง
                    </button>
                    <button
                        onClick={() => setActiveTab('FORM')}
                        className={cn(
                            "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'FORM' ? "bg-[#E5B842] text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
                        )}
                    >
                        ฟอร์ม 5 นัด
                    </button>
                </div>
            </div>

            {/* TAB 1: Match Live Stats */}
            {activeTab === 'STATS' && (
                <div className="flex flex-col gap-4 pt-1">
                    {/* Teams Quick Header */}
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                        <div className="flex items-center gap-2 truncate max-w-[45%]">
                            <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 p-0.5 shrink-0 overflow-hidden">
                                {match.homeTeam?.logo ? (
                                    <img src={match.homeTeam.logo} alt="" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-400">H</span>
                                )}
                            </div>
                            <span className="truncate text-amber-400">{homeName}</span>
                        </div>
                        <span className="text-slate-500 text-[11px] font-mono">STATISTICS</span>
                        <div className="flex items-center gap-2 justify-end truncate max-w-[45%] text-right">
                            <span className="truncate text-sky-400">{awayName}</span>
                            <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 p-0.5 shrink-0 overflow-hidden">
                                {match.awayTeam?.logo ? (
                                    <img src={match.awayTeam.logo} alt="" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-400">A</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats List */}
                    <div className="flex flex-col gap-3.5">
                        {stats.map((item, idx) => {
                            const total = item.home + item.away || 1;
                            const homePct = Math.round((item.home / total) * 100);
                            const awayPct = 100 - homePct;
                            const isHomeLeading = item.isHigherBetter !== false ? item.home > item.away : item.home < item.away;
                            const isAwayLeading = item.isHigherBetter !== false ? item.away > item.home : item.away < item.home;

                            return (
                                <div key={idx} className="flex flex-col gap-1.5">
                                    {/* Numbers & Label */}
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={cn(
                                            "font-mono font-black",
                                            isHomeLeading ? "text-amber-400 text-sm" : "text-slate-300"
                                        )}>
                                            {item.home}{item.suffix || ''}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium">{item.label}</span>
                                        <span className={cn(
                                            "font-mono font-black",
                                            isAwayLeading ? "text-sky-400 text-sm" : "text-slate-300"
                                        )}>
                                            {item.away}{item.suffix || ''}
                                        </span>
                                    </div>

                                    {/* Ratio Bar */}
                                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden flex border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                                            style={{ width: `${homePct}%` }}
                                        />
                                        <div
                                            className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-700"
                                            style={{ width: `${awayPct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: H2H History */}
            {activeTab === 'H2H' && (
                <div className="flex flex-col gap-4">
                    {/* Summary Badges */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/10 text-center">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 truncate max-w-full">{homeName} ชนะ</span>
                            <span className="text-xl font-black text-amber-400 font-mono mt-0.5">{h2h.homeWins}</span>
                        </div>
                        <div className="flex flex-col items-center border-x border-white/10">
                            <span className="text-[10px] text-slate-400">เสมอ</span>
                            <span className="text-xl font-black text-slate-300 font-mono mt-0.5">{h2h.draws}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 truncate max-w-full">{awayName} ชนะ</span>
                            <span className="text-xl font-black text-sky-400 font-mono mt-0.5">{h2h.awayWins}</span>
                        </div>
                    </div>

                    {/* Past Matches List */}
                    <div className="flex flex-col gap-2">
                        {h2h.matches.map((m) => (
                            <div
                                key={m.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all text-xs"
                            >
                                <div className="flex flex-col gap-0.5 w-28 shrink-0">
                                    <span className="text-[10px] text-slate-500">{m.date}</span>
                                    <span className="text-[11px] font-medium text-slate-400 truncate">{m.league}</span>
                                </div>

                                <div className="flex items-center justify-center gap-3 flex-1 px-2">
                                    <span className={cn(
                                        "truncate text-right w-5/12 font-medium",
                                        m.homeScore > m.awayScore ? "text-amber-400 font-bold" : "text-slate-300"
                                    )}>
                                        {m.homeTeam}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-lg bg-black/60 font-mono font-black text-[#E5B842] border border-white/10 shrink-0">
                                        {m.homeScore} : {m.awayScore}
                                    </span>
                                    <span className={cn(
                                        "truncate text-left w-5/12 font-medium",
                                        m.awayScore > m.homeScore ? "text-sky-400 font-bold" : "text-slate-300"
                                    )}>
                                        {m.awayTeam}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: Recent Form Guide */}
            {activeTab === 'FORM' && (
                <div className="flex flex-col gap-4 pt-1">
                    {/* Home Team Form */}
                    <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400">{homeName} (5 นัดหลังสุด)</span>
                            <span className="text-[10px] text-slate-500">ผลล่าสุด ➡️ ก่อนหน้า</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {homeForm.map((result, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md border",
                                        result === 'W' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                                        result === 'D' && "bg-amber-500/20 text-amber-400 border-amber-500/40",
                                        result === 'L' && "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                    )}
                                    title={result === 'W' ? 'ชนะ (Win)' : result === 'D' ? 'เสมอ (Draw)' : 'แพ้ (Loss)'}
                                >
                                    {result}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Away Team Form */}
                    <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-sky-400">{awayName} (5 นัดหลังสุด)</span>
                            <span className="text-[10px] text-slate-500">ผลล่าสุด ➡️ ก่อนหน้า</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {awayForm.map((result, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md border",
                                        result === 'W' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                                        result === 'D' && "bg-amber-500/20 text-amber-400 border-amber-500/40",
                                        result === 'L' && "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                    )}
                                    title={result === 'W' ? 'ชนะ (Win)' : result === 'D' ? 'เสมอ (Draw)' : 'แพ้ (Loss)'}
                                >
                                    {result}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
