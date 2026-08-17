'use client';

import { useState, useEffect } from 'react';
import { Trophy, Loader2, ShieldCheck, Activity, Flame } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useRealtimeMatches } from '@/hooks/useRealtimeMatches';
import { useLiveStandings } from '@/hooks/useLiveStandings';

interface StandingItem {
    idStanding: string;
    intRank: string;
    idTeam: string;
    strTeam: string;
    strBadge: string;
    idLeague: string;
    strLeague: string;
    strSeason: string;
    strForm?: string;
    strDescription?: string;
    intPlayed: string;
    intWin: string;
    intLoss: string;
    intDraw: string;
    intGoalsFor: string;
    intGoalsAgainst: string;
    intGoalDifference: string;
    intPoints: string;
    dateUpdated?: string;
}

const LEAGUES = [
    { id: '4328', name: 'พรีเมียร์ลีก', fullName: 'พรีเมียร์ลีก อังกฤษ', season: '2024-2025' },
    { id: '4335', name: 'ลาลีกา', fullName: 'ลาลีกา สเปน', season: '2024-2025' },
    { id: '4332', name: 'เซเรียอา', fullName: 'กัลโช่ เซเรียอา อิตาลี', season: '2024-2025' },
    { id: '4331', name: 'บุนเดสลีกา', fullName: 'บุนเดสลีกา เยอรมัน', season: '2024-2025' },
    { id: '4334', name: 'ลีกเอิง', fullName: 'ลีกเอิง ฝรั่งเศส', season: '2024-2025' },
];

// ดิกชันนารีแปลชื่อทีมเป็นภาษาไทย
const THAI_TEAM_NAMES: { [key: string]: string } = {
    // พรีเมียร์ลีก
    'Liverpool': 'ลิเวอร์พูล',
    'Arsenal': 'อาร์เซนอล',
    'Manchester City': 'แมนเชสเตอร์ ซิตี้',
    'Aston Villa': 'แอสตัน วิลลา',
    'Chelsea': 'เชลซี',
    'Newcastle': 'นิวคาสเซิล ยูไนเต็ด',
    'Nottingham Forest': 'น็อตติ้งแฮม ฟอเรสต์',
    'Brighton': 'ไบรท์ตัน',
    'Bournemouth': 'บอร์นมัธ',
    'Fulham': 'ฟูแล่ม',
    'Tottenham': 'ท็อตแนม ฮ็อตสเปอร์',
    'Everton': 'เอฟเวอร์ตัน',
    'Brentford': 'เบรนท์ฟอร์ด',
    'Manchester United': 'แมนเชสเตอร์ ยูไนเต็ด',
    'West Ham': 'เวสต์แฮม ยูไนเต็ด',
    'Wolverhampton Wanderers': 'วูล์ฟแฮมป์ตัน',
    'Leicester': 'เลสเตอร์ ซิตี้',
    'Ipswich': 'อิปสวิช ทาวน์',
    'Crystal Palace': 'คริสตัล พาเลซ',
    'Southampton': 'เซาแธมป์ตัน',
    // ลาลีกา
    'Real Madrid': 'เรอัล มาดริด',
    'Barcelona': 'บาร์เซโลนา',
    'Atletico Madrid': 'แอตเลติโก มาดริด',
    'Girona': 'คีโรน่า',
    'Athletic Bilbao': 'แอธเลติก บิลเบา',
    'Real Sociedad': 'เรอัล โซเซียดาด',
    'Real Betis': 'เรอัล เบติส',
    'Villarreal': 'บียาร์เรอัล',
    'Sevilla': 'เซบีย่า',
    // บุนเดสลีกา
    'Bayern Munich': 'บาเยิร์น มิวนิค',
    'Bayer Leverkusen': 'ไบเออร์ เลเวอร์คูเซ่น',
    'RB Leipzig': 'แอร์เบ ไลป์ซิก',
    'Borussia Dortmund': 'โบรุสเซีย ดอร์ทมุนด์',
    'Eintracht Frankfurt': 'ไอน์ทรัค แฟรงก์เฟิร์ต',
    // เซเรียอา
    'Inter': 'อินเตอร์ มิลาน',
    'AC Milan': 'เอซี มิลาน',
    'Juventus': 'ยูเวนตุส',
    'Atalanta': 'อตาลันต้า',
    'Bologna': 'โบโลญญ่า',
    'Roma': 'โรม่า',
    'Lazio': 'ลาซิโอ',
    'Napoli': 'นาโปลี',
};

export default function TableClient() {
    const { t } = useLanguage();
    const { matches = [] } = useRealtimeMatches();
    const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0]);
    const [standings, setStandings] = useState<StandingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [displayLimit, setDisplayLimit] = useState<'TOP10' | 'ALL'>('TOP10');

    // Live Standings Auto-Calculation Hook
    const liveStandings = useLiveStandings(standings, matches);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(false);

        fetch(`https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${selectedLeague.id}&s=${selectedLeague.season}`)
            .then((res) => res.json())
            .then((data) => {
                if (isMounted) {
                    if (data && data.table && Array.isArray(data.table)) {
                        setStandings(data.table);
                    } else {
                        setStandings([]);
                    }
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error('Fetch standings error:', err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [selectedLeague]);

    const displayedStandings = displayLimit === 'TOP10' ? liveStandings.slice(0, 10) : liveStandings;

    return (
        <div className="flex flex-col gap-6 md:gap-8 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 max-w-[1200px] mx-auto min-h-screen font-sans animate-[fadeIn_0.5s_ease-out]">
            
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-[#0B0F17] border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#E5B842]/10 blur-[80px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#E5B842]/50 to-transparent" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#E5B842] to-[#b88c22] p-[1px] shadow-[0_0_20px_rgba(229,184,66,0.3)] shrink-0">
                            <div className="w-full h-full bg-black/80 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                                <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-[#E5B842]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide mb-1">
                                {t('standings_hub_title')} <span className="text-[#E5B842]">{selectedLeague.fullName}</span>
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                                    ข้อมูลเรียลไทม์ TheSportsDB API
                                </span>
                                <span>• ฤดูกาล {selectedLeague.season}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* League Selector */}
                    <div className="flex flex-wrap justify-center gap-1.5 p-1.5 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md">
                        {LEAGUES.map((league) => (
                            <button
                                key={league.id}
                                onClick={() => setSelectedLeague(league)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    selectedLeague.id === league.id
                                        ? 'bg-[#E5B842] text-black shadow-[0_0_15px_rgba(229,184,66,0.3)]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {league.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-[#0B0F17]/90 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl min-h-[400px] flex flex-col">
                {/* Display Limit Filter Bar */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
                    <span className="text-xs font-bold text-slate-300">
                        แสดงผล: <span className="text-[#E5B842]">{displayLimit === 'TOP10' ? '10 อันดับแรก' : `ทั้งหมด (${standings.length} ทีม)`}</span>
                    </span>
                    <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 text-xs font-bold">
                        <button
                            onClick={() => setDisplayLimit('TOP10')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                displayLimit === 'TOP10'
                                    ? 'bg-[#E5B842] text-black shadow-sm font-bold'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            10 อันดับแรก
                        </button>
                        <button
                            onClick={() => setDisplayLimit('ALL')}
                            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                displayLimit === 'ALL'
                                    ? 'bg-[#E5B842] text-black shadow-sm font-bold'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            แสดงทั้งหมด ({standings.length} ทีม)
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-24 text-slate-400 gap-3">
                        <Loader2 className="w-10 h-10 text-[#E5B842] animate-spin" />
                        <span className="text-sm font-semibold tracking-wide">กำลังโหลดตารางคะแนนล่าสุด...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-24 text-slate-400 gap-2">
                        <p className="text-sm font-semibold text-rose-400">ไม่สามารถเชื่อมต่อข้อมูลตารางคะแนนได้</p>
                        <p className="text-xs text-slate-500">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
                    </div>
                ) : standings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-24 text-slate-400 gap-2">
                        <p className="text-sm font-semibold text-slate-300">ไม่พบข้อมูลตารางคะแนนฤดูกาลนี้</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-white/[0.03] border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider">
                                        <th className="p-4 font-semibold text-center w-16">{t('rank')}</th>
                                        <th className="p-4 font-semibold">{t('team')}</th>
                                        <th className="p-4 font-semibold text-center w-16">{t('played')}</th>
                                        <th className="p-4 font-semibold text-center w-16">{t('win')}</th>
                                        <th className="p-4 font-semibold text-center w-16">{t('draw')}</th>
                                        <th className="p-4 font-semibold text-center w-16">{t('loss')}</th>
                                        <th className="p-4 font-semibold text-center w-24">{t('goals')}</th>
                                        <th className="p-4 font-semibold text-center w-20">+-</th>
                                        <th className="p-4 font-semibold text-[#E5B842] text-center w-20">{t('points')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {displayedStandings.map((row) => {
                                        const rankNum = parseInt(row.intRank, 10);
                                        const thaiName = THAI_TEAM_NAMES[row.strTeam] || row.strTeam;
                                        const gdNum = parseInt(row.intGoalDifference, 10);

                                        return (
                                            <tr 
                                                key={row.idStanding || row.intRank} 
                                                className="group hover:bg-white/[0.03] transition-colors duration-150"
                                            >
                                                {/* Rank */}
                                                <td className="p-4 text-center">
                                                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                                                        rankNum <= 4 
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                                            : rankNum === 5 
                                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                                                : rankNum >= standings.length - 2
                                                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                                                    : 'text-slate-400 bg-white/5 border border-white/10'
                                                    }`}>
                                                        {rankNum}
                                                    </div>
                                                </td>

                                                {/* Team Badge & Name */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                                                            {row.strBadge ? (
                                                                <img src={row.strBadge} alt={row.strTeam} className="w-full h-full object-contain" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-slate-400">{row.strTeam.substring(0, 2)}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-100 group-hover:text-[#E5B842] transition-colors">
                                                                    {thaiName}
                                                                </span>
                                                                {row.isLiveUpdated && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-extrabold border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse">
                                                                        <Flame className="w-3 h-3 text-rose-400 fill-current" />
                                                                        LIVE {row.liveDiff}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {thaiName !== row.strTeam && (
                                                                <span className="text-[10px] text-slate-500">{row.strTeam}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-center font-mono text-slate-300">{row.intPlayed}</td>
                                                <td className="p-4 text-center font-mono text-slate-300">{row.intWin}</td>
                                                <td className="p-4 text-center font-mono text-slate-300">{row.intDraw}</td>
                                                <td className="p-4 text-center font-mono text-slate-300">{row.intLoss}</td>
                                                
                                                {/* Goals For / Against */}
                                                <td className="p-4 text-center font-mono text-xs">
                                                    <span className="text-emerald-400 font-semibold">{row.intGoalsFor}</span>
                                                    <span className="text-slate-600 mx-1">/</span>
                                                    <span className="text-rose-400 font-semibold">{row.intGoalsAgainst}</span>
                                                </td>

                                                {/* Goal Difference */}
                                                <td className="p-4 text-center font-mono text-xs font-bold">
                                                    <span className={gdNum > 0 ? 'text-emerald-400' : gdNum < 0 ? 'text-rose-400' : 'text-slate-400'}>
                                                        {gdNum > 0 ? `+${gdNum}` : gdNum}
                                                    </span>
                                                </td>

                                                {/* Points */}
                                                <td className="p-4 text-center">
                                                    <span className="inline-block text-base font-black text-white font-mono bg-white/5 px-3 py-1 rounded-xl border border-white/10 group-hover:border-[#E5B842]/50 group-hover:text-[#E5B842] transition-all shadow-sm">
                                                        {row.intPoints}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend Footer */}
                        <div className="p-4 bg-black/40 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    ยูฟ่า แชมเปียนส์ลีก (โควตา 1-4)
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                    ยูฟ่า ยูโรปาลีก (โควตาอันดับ 5)
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                    ตกชั้น
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-400">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>อัปเดตข้อมูลตารางคะแนนสดอัตโนมัติ</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}
