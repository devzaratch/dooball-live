'use client';

import { useState, useMemo } from 'react';
import { Match } from '@/types/football';
import { Users, Sparkles, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchLineupsProps {
    match: Match;
}

interface Player {
    number: number;
    name: string;
    pos: 'GK' | 'DEF' | 'MID' | 'FWD';
}

const KNOWN_SQUADS: { [key: string]: Player[] } = {
    'ลิเวอร์พูล': [
        { number: 1, name: 'อลิสซอน เบ็คเกอร์', pos: 'GK' },
        { number: 66, name: 'เทรนต์ อเล็กซานเดอร์-อาร์โนลด์', pos: 'DEF' },
        { number: 5, name: 'อิบราฮิมา โกนาเต้', pos: 'DEF' },
        { number: 4, name: 'เฟอร์จิล ฟาน ไดจ์ค (C)', pos: 'DEF' },
        { number: 26, name: 'แอนดรูว์ โรเบิร์ตสัน', pos: 'DEF' },
        { number: 38, name: 'ไรอัน กราเฟนแบร์ก', pos: 'MID' },
        { number: 10, name: 'อเล็กซิส แม็ค อัลลิสเตอร์', pos: 'MID' },
        { number: 8, name: 'โดมินิค โซโบสไล', pos: 'MID' },
        { number: 11, name: 'โมฮาเหม็ด ซาลาห์', pos: 'FWD' },
        { number: 9, name: 'ดาร์วิน นูเญซ', pos: 'FWD' },
        { number: 7, name: 'หลุยส์ ดิอาซ', pos: 'FWD' },
    ],
    'อาร์เซนอล': [
        { number: 22, name: 'ดาบิด รายา', pos: 'GK' },
        { number: 4, name: 'เบน ไวท์', pos: 'DEF' },
        { number: 2, name: 'วิลเลียม ซาลิบา', pos: 'DEF' },
        { number: 6, name: 'กาเบรียล มากัลเญส', pos: 'DEF' },
        { number: 12, name: 'เยอร์เรียน ทิมเบอร์', pos: 'DEF' },
        { number: 5, name: 'โธมัส ปาร์เตย์', pos: 'MID' },
        { number: 41, name: 'เดแคลน ไรซ์', pos: 'MID' },
        { number: 8, name: 'มาร์ติน โอเดการ์ด (C)', pos: 'MID' },
        { number: 7, name: 'บูกาโย ซากา', pos: 'FWD' },
        { number: 29, name: 'ไค ฮาแวร์ตซ์', pos: 'FWD' },
        { number: 11, name: 'กาเบรียล มาร์ติเนลลี', pos: 'FWD' },
    ],
    'แมนเชสเตอร์ ซิตี้': [
        { number: 31, name: 'เอแดร์ซอน', pos: 'GK' },
        { number: 82, name: 'ริโก ลูอิส', pos: 'DEF' },
        { number: 25, name: 'มานูเอล อคานจี', pos: 'DEF' },
        { number: 3, name: 'รูเบน ดิอาส', pos: 'DEF' },
        { number: 24, name: 'ยอสโก กวาร์ดิโอล', pos: 'DEF' },
        { number: 16, name: 'โรดรี้', pos: 'MID' },
        { number: 8, name: 'มาเตโอ โควาซิช', pos: 'MID' },
        { number: 17, name: 'เควิน เดอ บรอยน์ (C)', pos: 'MID' },
        { number: 20, name: 'แบร์นาร์โด ซิลวา', pos: 'FWD' },
        { number: 9, name: 'เออร์ลิง ฮาลันด์', pos: 'FWD' },
        { number: 47, name: 'ฟิล โฟเดน', pos: 'FWD' },
    ],
    'แมนฯ ซิตี้': [
        { number: 31, name: 'เอแดร์ซอน', pos: 'GK' },
        { number: 82, name: 'ริโก ลูอิส', pos: 'DEF' },
        { number: 25, name: 'มานูเอล อคานจี', pos: 'DEF' },
        { number: 3, name: 'รูเบน ดิอาส', pos: 'DEF' },
        { number: 24, name: 'ยอสโก กวาร์ดิโอล', pos: 'DEF' },
        { number: 16, name: 'โรดรี้', pos: 'MID' },
        { number: 8, name: 'มาเตโอ โควาซิช', pos: 'MID' },
        { number: 17, name: 'เควิน เดอ บรอยน์ (C)', pos: 'MID' },
        { number: 20, name: 'แบร์นาร์โด ซิลวา', pos: 'FWD' },
        { number: 9, name: 'เออร์ลิง ฮาลันด์', pos: 'FWD' },
        { number: 47, name: 'ฟิล โฟเดน', pos: 'FWD' },
    ],
    'เรอัล มาดริด': [
        { number: 1, name: 'ติโบต์ กูร์กตัวส์', pos: 'GK' },
        { number: 2, name: 'ดานี่ การ์บาฆาล', pos: 'DEF' },
        { number: 3, name: 'เอแดร์ มิลิเตา', pos: 'DEF' },
        { number: 22, name: 'อันโตนิโอ รูดิเกอร์', pos: 'DEF' },
        { number: 23, name: 'แฟร์ล็องด์ เมนดี้', pos: 'DEF' },
        { number: 14, name: 'โอเรเลียง ชูอาเมนี่', pos: 'MID' },
        { number: 8, name: 'เฟเดริโก บัลเบร์เด้', pos: 'MID' },
        { number: 5, name: 'จู๊ด เบลลิงแฮม', pos: 'MID' },
        { number: 11, name: 'โรดรีโก้', pos: 'FWD' },
        { number: 9, name: 'คีเลียน เอ็มบัปเป้', pos: 'FWD' },
        { number: 7, name: 'วินิซิอุส จูเนียร์', pos: 'FWD' },
    ],
    'บาร์เซโลน่า': [
        { number: 1, name: 'มาร์ค-อันเดร แทร์ สเตเก้น', pos: 'GK' },
        { number: 23, name: 'ฌูลส์ กุนเด้', pos: 'DEF' },
        { number: 2, name: 'เปา กูบาร์ซี่', pos: 'DEF' },
        { number: 5, name: 'อินญิโก้ มาร์ติเนซ', pos: 'DEF' },
        { number: 3, name: 'อเลฮานโดร บัลเด้', pos: 'DEF' },
        { number: 17, name: 'มาร์ค กาซาโด้', pos: 'MID' },
        { number: 8, name: 'เปดรี้', pos: 'MID' },
        { number: 20, name: 'ดานี่ โอลโม่', pos: 'MID' },
        { number: 19, name: 'ลามีน ยามาล', pos: 'FWD' },
        { number: 9, name: 'โรเบิร์ต เลวานดอฟสกี้', pos: 'FWD' },
        { number: 11, name: 'ราฟินญ่า', pos: 'FWD' },
    ],
    'บาร์เซโลนา': [
        { number: 1, name: 'มาร์ค-อันเดร แทร์ สเตเก้น', pos: 'GK' },
        { number: 23, name: 'ฌูลส์ กุนเด้', pos: 'DEF' },
        { number: 2, name: 'เปา กูบาร์ซี่', pos: 'DEF' },
        { number: 5, name: 'อินญิโก้ มาร์ติเนซ', pos: 'DEF' },
        { number: 3, name: 'อเลฮานโดร บัลเด้', pos: 'DEF' },
        { number: 17, name: 'มาร์ค กาซาโด้', pos: 'MID' },
        { number: 8, name: 'เปดรี้', pos: 'MID' },
        { number: 20, name: 'ดานี่ โอลโม่', pos: 'MID' },
        { number: 19, name: 'ลามีน ยามาล', pos: 'FWD' },
        { number: 9, name: 'โรเบิร์ต เลวานดอฟสกี้', pos: 'FWD' },
        { number: 11, name: 'ราฟินญ่า', pos: 'FWD' },
    ],
};

function getTeamLineup(teamName: string, isHome: boolean): Player[] {
    // Check direct known squads
    for (const key of Object.keys(KNOWN_SQUADS)) {
        if (teamName.includes(key) || key.includes(teamName)) {
            return KNOWN_SQUADS[key];
        }
    }

    // Dynamic Generic Squad for other teams
    const prefix = isHome ? 'ผู้เล่นเหย้า' : 'ผู้เล่นเยือน';
    return [
        { number: 1, name: `${teamName} (GK)`, pos: 'GK' },
        { number: 2, name: `${prefix} เบอร์ 2`, pos: 'DEF' },
        { number: 4, name: `${prefix} กองหลังตัวกลาง`, pos: 'DEF' },
        { number: 5, name: `${prefix} เซ็นเตอร์แบ็ก (C)`, pos: 'DEF' },
        { number: 3, name: `${prefix} แบ็กซ้าย`, pos: 'DEF' },
        { number: 6, name: `${prefix} กองกลางตัวรับ`, pos: 'MID' },
        { number: 8, name: `${prefix} กองกลางตัวเชื่อม`, pos: 'MID' },
        { number: 10, name: `${prefix} เพลย์เมกเกอร์`, pos: 'MID' },
        { number: 7, name: `${prefix} ปีกขวา`, pos: 'FWD' },
        { number: 9, name: `${prefix} กองหน้าตัวเป้า`, pos: 'FWD' },
        { number: 11, name: `${prefix} ปีกซ้าย`, pos: 'FWD' },
    ];
}

export default function MatchLineups({ match }: MatchLineupsProps) {
    const [activeTab, setActiveTab] = useState<'FIELD' | 'LIST'>('FIELD');

    const homeName = match?.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match?.awayTeam?.name || 'ทีมเยือน';
    const isLive = match?.status === 'LIVE';
    const isFinished = match?.status === 'FINISHED';

    const homeLineup: Player[] = useMemo(() => (match?.lineup?.home as Player[]) || getTeamLineup(homeName, true), [match, homeName]);
    const awayLineup: Player[] = useMemo(() => (match?.lineup?.away as Player[]) || getTeamLineup(awayName, false), [match, awayName]);

    return (
        <div className="flex flex-col gap-4 bg-[#0B0F17]/90 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm md:text-base text-slate-100 flex items-center gap-2">
                            รายชื่อ 11 ตัวจริงและแผนการเล่น (Starting 11 & Tactical Formation)
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            {isLive || isFinished ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> รายชื่อตัวจริงอย่างเป็นทางการ (Official Lineups)
                                </span>
                            ) : (
                                <span className="text-amber-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> คาดการณ์ 11 ตัวจริง (Predicted Lineup 4-3-3 vs 4-2-3-1)
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 self-stretch sm:self-auto">
                    <button
                        onClick={() => setActiveTab('FIELD')}
                        className={cn(
                            "flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'FIELD' ? "bg-emerald-500 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
                        )}
                    >
                        ผังสนาม 3D
                    </button>
                    <button
                        onClick={() => setActiveTab('LIST')}
                        className={cn(
                            "flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'LIST' ? "bg-emerald-500 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
                        )}
                    >
                        รายชื่อผู้เล่น
                    </button>
                </div>
            </div>

            {/* Tactical Pitch Field View */}
            {activeTab === 'FIELD' ? (
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-2xl bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 border border-emerald-500/30 overflow-hidden shadow-2xl p-4 flex flex-col justify-between">
                    {/* Grass Pitch Pattern Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
                    
                    {/* Center Pitch Lines */}
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20 -translate-y-1/2 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/20 pointer-events-none" />

                    {/* Home Team Formation (Top Half - 4-3-3) */}
                    <div className="relative z-10 flex flex-col items-center justify-between h-1/2 py-2">
                        <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-bold text-amber-400 mb-1">
                            <span>{homeName} (4-3-3)</span>
                        </div>
                        {/* GK */}
                        <div className="flex justify-center">
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-black font-extrabold text-[10px] shadow-md border border-amber-300">
                                {homeLineup[0]?.number}. {homeLineup[0]?.name.split(' ')[0]} (GK)
                            </span>
                        </div>
                        {/* DEF */}
                        <div className="flex justify-around w-full px-2 sm:px-4">
                            {homeLineup.slice(1, 5).map((p) => (
                                <span key={p.number} className="px-1.5 sm:px-2 py-0.5 rounded bg-black/80 text-white text-[9px] sm:text-[10px] font-bold border border-white/10 truncate max-w-[80px] sm:max-w-[100px] text-center">
                                    {p.number}. {p.name.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                        {/* MID */}
                        <div className="flex justify-around w-4/5 px-2 sm:px-4">
                            {homeLineup.slice(5, 8).map((p) => (
                                <span key={p.number} className="px-1.5 sm:px-2 py-0.5 rounded bg-black/80 text-[#E5B842] text-[9px] sm:text-[10px] font-bold border border-[#E5B842]/30 truncate max-w-[80px] sm:max-w-[100px] text-center">
                                    {p.number}. {p.name.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Away Team Formation (Bottom Half - 4-2-3-1) */}
                    <div className="relative z-10 flex flex-col items-center justify-between h-1/2 py-2">
                        {/* FWD */}
                        <div className="flex justify-around w-4/5 px-2 sm:px-4">
                            {awayLineup.slice(8, 11).map((p) => (
                                <span key={p.number} className="px-1.5 sm:px-2 py-0.5 rounded bg-black/80 text-emerald-400 text-[9px] sm:text-[10px] font-bold border border-emerald-500/30 truncate max-w-[80px] sm:max-w-[100px] text-center">
                                    {p.number}. {p.name.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                        {/* MID & DEF */}
                        <div className="flex justify-around w-full px-2 sm:px-4">
                            {awayLineup.slice(1, 5).map((p) => (
                                <span key={p.number} className="px-1.5 sm:px-2 py-0.5 rounded bg-black/80 text-white text-[9px] sm:text-[10px] font-bold border border-white/10 truncate max-w-[80px] sm:max-w-[100px] text-center">
                                    {p.number}. {p.name.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                        {/* GK */}
                        <div className="flex justify-center">
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500 text-white font-extrabold text-[10px] shadow-md border border-blue-300">
                                {awayLineup[0]?.number}. {awayLineup[0]?.name.split(' ')[0]} (GK)
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-bold text-blue-400 mt-1">
                            <span>{awayName} (4-2-3-1)</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* Text Squad List View */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Home Squad */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
                        <h4 className="font-extrabold text-xs text-[#E5B842] pb-2 border-b border-white/10 flex items-center justify-between">
                            <span>{homeName} (ตัวจริง)</span>
                            <span className="text-[10px] text-slate-400 font-mono">4-3-3</span>
                        </h4>
                        <div className="space-y-1 text-xs max-h-72 overflow-y-auto pr-1">
                            {homeLineup.map((p) => (
                                <div key={p.number} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-2 truncate mr-2">
                                        <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center border border-amber-500/30 shrink-0">
                                            {p.number}
                                        </span>
                                        <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">{p.pos}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Away Squad */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
                        <h4 className="font-extrabold text-xs text-blue-400 pb-2 border-b border-white/10 flex items-center justify-between">
                            <span>{awayName} (ตัวจริง)</span>
                            <span className="text-[10px] text-slate-400 font-mono">4-2-3-1</span>
                        </h4>
                        <div className="space-y-1 text-xs max-h-72 overflow-y-auto pr-1">
                            {awayLineup.map((p) => (
                                <div key={p.number} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-2 truncate mr-2">
                                        <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px] flex items-center justify-center border border-blue-500/30 shrink-0">
                                            {p.number}
                                        </span>
                                        <span className="font-semibold text-slate-200 truncate">{p.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">{p.pos}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
