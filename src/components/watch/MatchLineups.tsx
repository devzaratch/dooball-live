'use client';

import { useState } from 'react';
import { Match } from '@/types/football';
import { Shirt, Users, ShieldCheck, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchLineupsProps {
    match: Match;
}

interface Player {
    number: number;
    name: string;
    pos: 'GK' | 'DEF' | 'MID' | 'FWD';
}

const DEFAULT_HOME_LINEUP: Player[] = [
    { number: 1, name: 'อลิสซอน (GK)', pos: 'GK' },
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
];

const DEFAULT_AWAY_LINEUP: Player[] = [
    { number: 1, name: 'เปเป้ เรน่า (GK)', pos: 'GK' },
    { number: 2, name: 'โกลดานิก้า', pos: 'DEF' },
    { number: 4, name: 'ดอสเซน่า', pos: 'DEF' },
    { number: 13, name: 'บาร์บา', pos: 'DEF' },
    { number: 18, name: 'โมเรโน่', pos: 'DEF' },
    { number: 20, name: 'แซร์จี้ โรเบร์โต้', pos: 'MID' },
    { number: 33, name: 'ดาวิเด แปร์โรเน่', pos: 'MID' },
    { number: 7, name: 'กาเบรียล อัลเบส', pos: 'MID' },
    { number: 10, name: 'นิโก้ พาซ', pos: 'MID' },
    { number: 11, name: 'ฟาเดรา', pos: 'MID' },
    { number: 9, name: 'เบล็อตติ', pos: 'FWD' },
];

export default function MatchLineups({ match }: MatchLineupsProps) {
    const [activeTab, setActiveTab] = useState<'FIELD' | 'LIST'>('FIELD');

    const homeName = match?.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match?.awayTeam?.name || 'ทีมเยือน';

    return (
        <div className="flex flex-col gap-4 bg-[#0B0F17]/90 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl font-sans">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm md:text-base text-slate-100 flex items-center gap-2">
                            รายชื่อ 11 ตัวจริงและแผนการเล่น (Starting Lineups & Tactical Formation)
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </h3>
                        <p className="text-[11px] text-slate-400">แผนผังสนามยุทธวิธี 4-3-3 vs 4-2-3-1</p>
                    </div>
                </div>

                {/* Tabs Selector */}
                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('FIELD')}
                        className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            activeTab === 'FIELD' ? "bg-emerald-500 text-black shadow-md font-extrabold" : "text-slate-400 hover:text-white"
                        )}
                    >
                        ผังสนาม 3D
                    </button>
                    <button
                        onClick={() => setActiveTab('LIST')}
                        className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
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
                            <span className="px-2 py-1 rounded-lg bg-amber-500 text-black font-extrabold text-[10px] shadow-md border border-amber-300">
                                1. อลิสซอน (GK)
                            </span>
                        </div>
                        {/* DEF */}
                        <div className="flex justify-around w-full px-4">
                            <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/10">66. เทรนต์</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/10">5. โกนาเต้</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/10">4. ฟาน ไดจ์ค</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/10">26. ร็อบโบ้</span>
                        </div>
                        {/* MID */}
                        <div className="flex justify-around w-4/5 px-4">
                            <span className="px-2 py-0.5 rounded bg-black/80 text-[#E5B842] text-[10px] font-bold border border-[#E5B842]/30">38. กราเฟนแบร์ก</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-[#E5B842] text-[10px] font-bold border border-[#E5B842]/30">10. แม็ค อัลลิสเตอร์</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-[#E5B842] text-[10px] font-bold border border-[#E5B842]/30">8. โซโบสไล</span>
                        </div>
                    </div>

                    {/* Away Team Formation (Bottom Half - 4-2-3-1) */}
                    <div className="relative z-10 flex flex-col items-center justify-between h-1/2 py-2">
                        {/* FWD */}
                        <div className="flex justify-around w-4/5 px-4">
                            <span className="px-2 py-0.5 rounded bg-black/80 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">11. ซาลาห์</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">9. นูเญซ</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">7. ดิอาซ</span>
                        </div>
                        {/* DEF */}
                        <div className="flex justify-around w-full px-4">
                            <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/10">20. โรเบร์โต้</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/10">10. พาซ</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/10">9. เบล็อตติ</span>
                            <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/10">18. โมเรโน่</span>
                        </div>
                        {/* GK */}
                        <div className="flex justify-center">
                            <span className="px-2 py-1 rounded-lg bg-blue-500 text-white font-extrabold text-[10px] shadow-md border border-blue-300">
                                1. เรน่า (GK)
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
                        <div className="space-y-1 text-xs">
                            {DEFAULT_HOME_LINEUP.map((p) => (
                                <div key={p.number} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center border border-amber-500/30">
                                            {p.number}
                                        </span>
                                        <span className="font-semibold text-slate-200">{p.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-500">{p.pos}</span>
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
                        <div className="space-y-1 text-xs">
                            {DEFAULT_AWAY_LINEUP.map((p) => (
                                <div key={p.number} className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px] flex items-center justify-center border border-blue-500/30">
                                            {p.number}
                                        </span>
                                        <span className="font-semibold text-slate-200">{p.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-slate-500">{p.pos}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
