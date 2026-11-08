'use client';

import { useEffect, useState } from 'react';
import { Trophy, Flame, Target, Sparkles, Award, User, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlayerStat {
    rank: number;
    name: string;
    nameTh: string;
    team: string;
    teamLogo?: string;
    goals: number;
    assists: number;
    penalties?: number;
    matches: number;
    photoUrl?: string;
}

const TOP_SCORERS_BY_LEAGUE: { [leagueId: string]: { scorers: PlayerStat[]; assists: PlayerStat[] } } = {
    // พรีเมียร์ลีก (4328)
    '4328': {
        scorers: [
            { rank: 1, name: 'Erling Haaland', nameTh: 'เออร์ลิง ฮาลันด์', team: 'แมนเชสเตอร์ ซิตี้', goals: 22, assists: 3, penalties: 4, matches: 24, photoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80' },
            { rank: 2, name: 'Mohamed Salah', nameTh: 'โมฮาเหม็ด ซาลาห์', team: 'ลิเวอร์พูล', goals: 19, assists: 13, penalties: 3, matches: 25, photoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&auto=format&fit=crop&q=80' },
            { rank: 3, name: 'Cole Palmer', nameTh: 'โคล พาลเมอร์', team: 'เชลซี', goals: 16, assists: 9, penalties: 5, matches: 23 },
            { rank: 4, name: 'Alexander Isak', nameTh: 'อเล็กซานเดอร์ อิซัค', team: 'นิวคาสเซิล', goals: 15, assists: 4, penalties: 2, matches: 22 },
            { rank: 5, name: 'Bukayo Saka', nameTh: 'บูกาโย ซากา', team: 'อาร์เซนอล', goals: 12, assists: 12, penalties: 2, matches: 24 },
            { rank: 6, name: 'Ollie Watkins', nameTh: 'ออลลี่ วัตกิ้นส์', team: 'แอสตัน วิลลา', goals: 11, assists: 7, penalties: 0, matches: 25 },
            { rank: 7, name: 'Bryan Mbeumo', nameTh: 'ไบรอัน เอ็มเบอโม่', team: 'เบรนท์ฟอร์ด', goals: 11, assists: 3, penalties: 3, matches: 24 },
            { rank: 8, name: 'Chris Wood', nameTh: 'คริส วู้ด', team: 'น็อตติ้งแฮม ฟอเรสต์', goals: 11, assists: 1, penalties: 2, matches: 23 },
            { rank: 9, name: 'Nicolas Jackson', nameTh: 'นิโคลัส แจ็คสัน', team: 'เชลซี', goals: 10, assists: 4, penalties: 0, matches: 22 },
            { rank: 10, name: 'Luis Díaz', nameTh: 'หลุยส์ ดิอาซ', team: 'ลิเวอร์พูล', goals: 9, assists: 4, penalties: 0, matches: 24 },
        ],
        assists: [
            { rank: 1, name: 'Mohamed Salah', nameTh: 'โมฮาเหม็ด ซาลาห์', team: 'ลิเวอร์พูล', goals: 19, assists: 13, matches: 25 },
            { rank: 2, name: 'Bukayo Saka', nameTh: 'บูกาโย ซากา', team: 'อาร์เซนอล', goals: 12, assists: 12, matches: 24 },
            { rank: 3, name: 'Cole Palmer', nameTh: 'โคล พาลเมอร์', team: 'เชลซี', goals: 16, assists: 9, matches: 23 },
            { rank: 4, name: 'Ollie Watkins', nameTh: 'ออลลี่ วัตกิ้นส์', team: 'แอสตัน วิลลา', goals: 11, assists: 7, matches: 25 },
            { rank: 5, name: 'Antonee Robinson', nameTh: 'แอนโทนี โรบินสัน', team: 'ฟูแล่ม', goals: 0, assists: 7, matches: 24 },
        ]
    },
    // ลาลีกา (4335)
    '4335': {
        scorers: [
            { rank: 1, name: 'Robert Lewandowski', nameTh: 'โรเบิร์ต เลวานดอฟสกี้', team: 'บาร์เซโลนา', goals: 21, assists: 3, penalties: 4, matches: 24 },
            { rank: 2, name: 'Raphinha', nameTh: 'ราฟินญ่า', team: 'บาร์เซโลนา', goals: 15, assists: 10, penalties: 2, matches: 24 },
            { rank: 3, name: 'Kylian Mbappé', nameTh: 'คีเลียน เอ็มบัปเป้', team: 'เรอัล มาดริด', goals: 15, assists: 3, penalties: 5, matches: 22 },
            { rank: 4, name: 'Vinícius Júnior', nameTh: 'วินิซิอุส จูเนียร์', team: 'เรอัล มาดริด', goals: 12, assists: 7, penalties: 3, matches: 21 },
            { rank: 5, name: 'Ayoze Pérez', nameTh: 'อาโยเซ่ เปเรซ', team: 'บียาร์เรอัล', goals: 11, assists: 2, penalties: 1, matches: 20 },
        ],
        assists: [
            { rank: 1, name: 'Lamine Yamal', nameTh: 'ลามีน ยามาล', team: 'บาร์เซโลนา', goals: 7, assists: 11, matches: 22 },
            { rank: 2, name: 'Raphinha', nameTh: 'ราฟินญ่า', team: 'บาร์เซโลนา', goals: 15, assists: 10, matches: 24 },
            { rank: 3, name: 'Vinícius Júnior', nameTh: 'วินิซิอุส จูเนียร์', team: 'เรอัล มาดริด', goals: 12, assists: 7, matches: 21 },
        ]
    },
    // บุนเดสลีกา (4331)
    '4331': {
        scorers: [
            { rank: 1, name: 'Harry Kane', nameTh: 'แฮร์รี่ เคน', team: 'บาเยิร์น มิวนิค', goals: 23, assists: 6, penalties: 5, matches: 22 },
            { rank: 2, name: 'Omar Marmoush', nameTh: 'โอมาร์ มาร์มูช', team: 'ไอน์ทรัค แฟรงก์เฟิร์ต', goals: 17, assists: 10, penalties: 2, matches: 21 },
            { rank: 3, name: 'Tim Kleindienst', nameTh: 'ทิม ไคลน์ดีนส์ท', team: 'โบรุสเซีย มึนเช่นกลัดบัค', goals: 12, assists: 3, penalties: 1, matches: 22 },
            { rank: 4, name: 'Serhou Guirassy', nameTh: 'แซร์อู กีราสซี่', team: 'โบรุสเซีย ดอร์ทมุนด์', goals: 11, assists: 2, penalties: 2, matches: 19 },
            { rank: 5, name: 'Victor Boniface', nameTh: 'วิคเตอร์ โบนิเฟซ', team: 'ไบเออร์ เลเวอร์คูเซ่น', goals: 10, assists: 3, penalties: 1, matches: 18 },
        ],
        assists: [
            { rank: 1, name: 'Omar Marmoush', nameTh: 'โอมาร์ มาร์มูช', team: 'ไอน์ทรัค แฟรงก์เฟิร์ต', goals: 17, assists: 10, matches: 21 },
            { rank: 2, name: 'Harry Kane', nameTh: 'แฮร์รี่ เคน', team: 'บาเยิร์น มิวนิค', goals: 23, assists: 6, matches: 22 },
            { rank: 3, name: 'Florian Wirtz', nameTh: 'ฟลอเรียน เวียร์ตซ์', team: 'ไบเออร์ เลเวอร์คูเซ่น', goals: 8, assists: 7, matches: 21 },
        ]
    },
    // เซเรียอา (4332)
    '4332': {
        scorers: [
            { rank: 1, name: 'Mateo Retegui', nameTh: 'มาเตโอ เรเตกุย', team: 'อตาลันต้า', goals: 18, assists: 4, penalties: 3, matches: 23 },
            { rank: 2, name: 'Marcus Thuram', nameTh: 'มาร์คุส ตูราม', team: 'อินเตอร์ มิลาน', goals: 14, assists: 5, penalties: 0, matches: 22 },
            { rank: 3, name: 'Dusan Vlahovic', nameTh: 'ดูซาน วลาโฮวิช', team: 'ยูเวนตุส', goals: 12, assists: 2, penalties: 3, matches: 21 },
            { rank: 4, name: 'Ademola Lookman', nameTh: 'อเดโมล่า ลุคแมน', team: 'อตาลันต้า', goals: 11, assists: 6, penalties: 1, matches: 20 },
            { rank: 5, name: 'Lautaro Martínez', nameTh: 'เลาตาโร่ มาร์ติเนซ', team: 'อินเตอร์ มิลาน', goals: 10, assists: 3, penalties: 1, matches: 21 },
        ],
        assists: [
            { rank: 1, name: 'Ademola Lookman', nameTh: 'อเดโมล่า ลุคแมน', team: 'อตาลันต้า', goals: 11, assists: 6, matches: 20 },
            { rank: 2, name: 'Marcus Thuram', nameTh: 'มาร์คุส ตูราม', team: 'อินเตอร์ มิลาน', goals: 14, assists: 5, matches: 22 },
            { rank: 3, name: 'Christian Pulisic', nameTh: 'คริสเตียน พูลิซิช', team: 'เอซี มิลาน', goals: 8, assists: 6, matches: 22 },
        ]
    },
    // ลีกเอิง (4334)
    '4334': {
        scorers: [
            { rank: 1, name: 'Bradley Barcola', nameTh: 'แบรดลีย์ บาร์โกล่า', team: 'ปารีส แซงต์-แชร์กแมง', goals: 14, assists: 4, penalties: 0, matches: 22 },
            { rank: 2, name: 'Mason Greenwood', nameTh: 'เมสัน กรีนวู้ด', team: 'โอลิมปิก มาร์กเซย', goals: 13, assists: 3, penalties: 3, matches: 21 },
            { rank: 3, name: 'Jonathan David', nameTh: 'โจนาธาน เดวิด', team: 'ลีลล์', goals: 12, assists: 2, penalties: 2, matches: 22 },
            { rank: 4, name: 'Ousmane Dembélé', nameTh: 'อุสมาน เดมเบเล่', team: 'ปารีส แซงต์-แชร์กแมง', goals: 9, assists: 7, penalties: 1, matches: 20 },
        ],
        assists: [
            { rank: 1, name: 'Ousmane Dembélé', nameTh: 'อุสมาน เดมเบเล่', team: 'ปารีส แซงต์-แชร์กแมง', goals: 9, assists: 7, matches: 20 },
            { rank: 2, name: 'Joao Neves', nameTh: 'เจา เนเวส', team: 'ปารีส แซงต์-แชร์กแมง', goals: 1, assists: 6, matches: 21 },
        ]
    }
};

interface TopScorersTableProps {
    leagueId: string;
    leagueName: string;
}

export default function TopScorersTable({ leagueId, leagueName }: TopScorersTableProps) {
    const [subTab, setSubTab] = useState<'SCORERS' | 'ASSISTS'>('SCORERS');
    const [liveSource, setLiveSource] = useState<'live' | 'sample'>('sample');
    const [liveScorers, setLiveScorers] = useState<PlayerStat[]>([]);
    const [liveAssists, setLiveAssists] = useState<PlayerStat[]>([]);

    // ดึงข้อมูลจริงจาก Firebase ถ้าแอดมินเคยอัปเดตไว้ (ไม่มี -> ใช้ข้อมูลตัวอย่างด้านล่าง)
    useEffect(() => {
        let cancelled = false;
        fetch(`/api/scorers?l=${leagueId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (cancelled || !data?.success) return;
                const map = (arr: unknown[]): PlayerStat[] =>
                    (Array.isArray(arr) ? arr : []).filter(Boolean).map((p, idx) => {
                        const row = p as Record<string, unknown>;
                        return {
                            rank: idx + 1,
                            name: String(row.name || row.strPlayer || ''),
                            nameTh: String(row.nameTh || row.name || row.strPlayer || ''),
                            team: String(row.team || row.strTeam || ''),
                            teamLogo: row.teamLogo ? String(row.teamLogo) : undefined,
                            goals: Number(row.goals || 0) || 0,
                            assists: Number(row.assists || 0) || 0,
                            penalties: Number(row.penalties || 0) || 0,
                            matches: Number(row.matches || 0) || 0,
                            photoUrl: row.photoUrl ? String(row.photoUrl) : undefined,
                        };
                    });
                if (data.source === 'live' && Array.isArray(data.scorers) && data.scorers.length > 0) {
                    setLiveScorers(map(data.scorers));
                    setLiveAssists(map(data.assists));
                    setLiveSource('live');
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [leagueId]);

    const fallbackData = TOP_SCORERS_BY_LEAGUE[leagueId] || TOP_SCORERS_BY_LEAGUE['4328'];
    const leagueData =
        liveSource === 'live' && liveScorers.length > 0
            ? { scorers: liveScorers, assists: liveAssists.length > 0 ? liveAssists : liveScorers }
            : fallbackData;
    const list = subTab === 'SCORERS' ? leagueData.scorers : leagueData.assists;

    return (
        <div className="flex flex-col gap-5 bg-[#0B0F17]/90 border border-white/10 rounded-3xl p-5 md:p-8 backdrop-blur-xl shadow-2xl font-sans">
            {/* Header & Sub-tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
                        {subTab === 'SCORERS' ? <Flame className="w-5 h-5 fill-current" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                            {subTab === 'SCORERS' ? 'อันดับดาวซัลโวสูงสุด (Top Scorers)' : 'อันดับจอมแอสซิสต์ (Top Assists)'}
                            <span className="text-[#E5B842]">{leagueName}</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                            {liveSource === 'live'
                                ? 'อัปเดตอัตโนมัติจากฐานข้อมูลล่าสุด'
                                : 'ข้อมูลตัวอย่าง • แอดมินอัปเดตจริงได้ทางหลังบ้าน'}
                        </p>
                    </div>
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex items-center gap-1 p-1 bg-black/60 rounded-2xl border border-white/10 self-stretch sm:self-auto">
                    <button
                        onClick={() => setSubTab('SCORERS')}
                        className={cn(
                            "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                            subTab === 'SCORERS' 
                                ? "bg-[#E5B842] text-black font-extrabold shadow-md" 
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Flame className="w-3.5 h-3.5" />
                        <span>ดาวซัลโว</span>
                    </button>
                    <button
                        onClick={() => setSubTab('ASSISTS')}
                        className={cn(
                            "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                            subTab === 'ASSISTS' 
                                ? "bg-[#E5B842] text-black font-extrabold shadow-md" 
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Target className="w-3.5 h-3.5" />
                        <span>จอมแอสซิสต์</span>
                    </button>
                </div>
            </div>

            {/* Top 3 Podium Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {list.slice(0, 3).map((player, index) => {
                    const isFirst = index === 0;
                    const isSecond = index === 1;
                    const isThird = index === 2;

                    return (
                        <div
                            key={player.name}
                            className={cn(
                                "relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between border transition-all duration-300 backdrop-blur-md",
                                isFirst && "bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] order-1 sm:order-2 sm:-translate-y-1",
                                isSecond && "bg-slate-900/80 border-slate-700/50 order-2 sm:order-1",
                                isThird && "bg-slate-900/80 border-slate-700/50 order-3"
                            )}
                        >
                            {/* Rank Crown/Badge */}
                            <div className="flex items-center justify-between mb-3">
                                <span className={cn(
                                    "w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs border font-mono",
                                    isFirst && "bg-amber-400 text-black border-amber-300 shadow-md",
                                    isSecond && "bg-slate-300 text-black border-slate-200",
                                    isThird && "bg-amber-700 text-white border-amber-600"
                                )}>
                                    #{player.rank}
                                </span>
                                {isFirst && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                        ผู้นำ
                                    </span>
                                )}
                            </div>

                            {/* Player Info */}
                            <div className="flex flex-col gap-1 mb-3">
                                <h4 className="font-black text-base text-white truncate">{player.nameTh}</h4>
                                <span className="text-[11px] text-slate-400 truncate">{player.name}</span>
                                <span className="text-xs font-semibold text-amber-400/90 truncate mt-0.5">{player.team}</span>
                            </div>

                            {/* Main Stat Number */}
                            <div className="flex items-baseline justify-between pt-3 border-t border-white/10">
                                <span className="text-xs text-slate-400">
                                    {subTab === 'SCORERS' ? 'ยิงประตูรวม' : 'แอสซิสต์รวม'}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-[#E5B842] font-mono">
                                        {subTab === 'SCORERS' ? player.goals : player.assists}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold">
                                        {subTab === 'SCORERS' ? 'ลูก' : 'ครั้ง'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detailed Table List */}
            <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-4 w-12 text-center">อันดับ</th>
                            <th className="py-3 px-4">นักเตะ</th>
                            <th className="py-3 px-4">สโมสร</th>
                            <th className="py-3 px-4 text-center">ลงเล่น</th>
                            <th className="py-3 px-4 text-center">{subTab === 'SCORERS' ? 'ประตู' : 'แอสซิสต์'}</th>
                            {subTab === 'SCORERS' && (
                                <th className="py-3 px-4 text-center">จุดโทษ</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                        {list.map((player) => (
                            <tr key={player.name} className="hover:bg-white/[0.03] transition-colors">
                                <td className="py-3 px-4 text-center font-bold font-mono">
                                    <span className={cn(
                                        "w-6 h-6 rounded-lg inline-flex items-center justify-center text-xs",
                                        player.rank === 1 && "bg-amber-400/20 text-amber-300 font-black",
                                        player.rank === 2 && "bg-slate-400/20 text-slate-300 font-black",
                                        player.rank === 3 && "bg-amber-700/20 text-amber-500 font-black",
                                        player.rank > 3 && "text-slate-400"
                                    )}>
                                        {player.rank}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-100">{player.nameTh}</span>
                                        <span className="text-[10px] text-slate-500">{player.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-slate-300 font-medium">
                                    {player.team}
                                </td>
                                <td className="py-3 px-4 text-center font-mono text-slate-400">
                                    {player.matches} นัด
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-black text-sm text-[#E5B842]">
                                    {subTab === 'SCORERS' ? player.goals : player.assists}
                                </td>
                                {subTab === 'SCORERS' && (
                                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                                        {player.penalties ?? 0}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
