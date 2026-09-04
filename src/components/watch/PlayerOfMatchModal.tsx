'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Match } from '@/types/football';
import { db } from '@/lib/firebase';
import { ref, onValue, runTransaction } from 'firebase/database';
import { Award, Star, Sparkles, CheckCircle2, X, Trophy, Flame, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlayerCandidate {
    id: string;
    name: string;
    team: string;
    pos: string;
    number?: number;
    isGoalScorer?: boolean;
    votes: number;
}

interface PlayerOfMatchModalProps {
    match: Match;
    isOpen: boolean;
    onClose: () => void;
}

// ฐานข้อมูลดาราเด่นประจำสโมสรชั้นนำ
const STAR_PLAYERS_MAP: { [teamKeyword: string]: { name: string; pos: string; number: number }[] } = {
    'ลิเวอร์พูล': [
        { name: 'โมฮาเหม็ด ซาลาห์', pos: 'FWD', number: 11 },
        { name: 'หลุยส์ ดิอาซ', pos: 'FWD', number: 7 },
        { name: 'อเล็กซิส แม็ค อัลลิสเตอร์', pos: 'MID', number: 10 },
        { name: 'อลิสซอน เบ็คเกอร์', pos: 'GK', number: 1 },
    ],
    'แมนฯ ซิตี้': [
        { name: 'เออร์ลิง ฮาลันด์', pos: 'FWD', number: 9 },
        { name: 'เควิน เดอ บรอยน์', pos: 'MID', number: 17 },
        { name: 'ฟิล โฟเดน', pos: 'FWD', number: 47 },
        { name: 'เอแดร์ซอน', pos: 'GK', number: 31 },
    ],
    'แมนเชสเตอร์ ซิตี้': [
        { name: 'เออร์ลิง ฮาลันด์', pos: 'FWD', number: 9 },
        { name: 'เควิน เดอ บรอยน์', pos: 'MID', number: 17 },
        { name: 'ฟิล โฟเดน', pos: 'FWD', number: 47 },
        { name: 'เอแดร์ซอน', pos: 'GK', number: 31 },
    ],
    'อาร์เซนอล': [
        { name: 'บูกาโย ซากา', pos: 'FWD', number: 7 },
        { name: 'มาร์ติน โอเดการ์ด', pos: 'MID', number: 8 },
        { name: 'ไค ฮาแวร์ตซ์', pos: 'FWD', number: 29 },
        { name: 'ดาบิด รายา', pos: 'GK', number: 22 },
    ],
    'เชลซี': [
        { name: 'โคล พาลเมอร์', pos: 'MID', number: 20 },
        { name: 'นิโคลัส แจ็คสัน', pos: 'FWD', number: 15 },
        { name: 'เอ็นโซ่ เฟร์นานเดซ', pos: 'MID', number: 8 },
    ],
    'แมนเชสเตอร์ ยูไนเต็ด': [
        { name: 'บรูโน่ แฟร์นันเดส', pos: 'MID', number: 8 },
        { name: 'อเลฮานโดร การ์นาโช่', pos: 'FWD', number: 17 },
        { name: 'มาร์คัส แรชฟอร์ด', pos: 'FWD', number: 10 },
        { name: 'อ็องเดร โอนาน่า', pos: 'GK', number: 24 },
    ],
    'แมนฯ ยูไนเต็ด': [
        { name: 'บรูโน่ แฟร์นันเดส', pos: 'MID', number: 8 },
        { name: 'อเลฮานโดร การ์นาโช่', pos: 'FWD', number: 17 },
        { name: 'มาร์คัส แรชฟอร์ด', pos: 'FWD', number: 10 },
        { name: 'อ็องเดร โอนาน่า', pos: 'GK', number: 24 },
    ],
    'เรอัล มาดริด': [
        { name: 'วินิซิอุส จูเนียร์', pos: 'FWD', number: 7 },
        { name: 'คีเลียน เอ็มบัปเป้', pos: 'FWD', number: 9 },
        { name: 'จู๊ด เบลลิงแฮม', pos: 'MID', number: 5 },
        { name: 'ติโบต์ กูร์กตัวส์', pos: 'GK', number: 1 },
    ],
    'บาร์เซโลนา': [
        { name: 'ลามีน ยามาล', pos: 'FWD', number: 19 },
        { name: 'โรเบิร์ต เลวานดอฟสกี้', pos: 'FWD', number: 9 },
        { name: 'ราฟินญ่า', pos: 'FWD', number: 11 },
        { name: 'เปดรี้', pos: 'MID', number: 8 },
    ],
    'บาร์เซโลน่า': [
        { name: 'ลามีน ยามาล', pos: 'FWD', number: 19 },
        { name: 'โรเบิร์ต เลวานดอฟสกี้', pos: 'FWD', number: 9 },
        { name: 'ราฟินญ่า', pos: 'FWD', number: 11 },
        { name: 'เปดรี้', pos: 'MID', number: 8 },
    ],
};

function generateInitialCandidates(match: Match): PlayerCandidate[] {
    const homeName = match?.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match?.awayTeam?.name || 'ทีมเยือน';

    const candidates: PlayerCandidate[] = [];
    const usedNames = new Set<string>();

    // 1. เพิ่มผู้ทำประตูจาก match.events ก่อน (ถ้ามี)
    if (match?.events && Array.isArray(match.events)) {
        match.events.forEach((evt, idx) => {
            if (evt.type === 'goal' && evt.player && !usedNames.has(evt.player)) {
                usedNames.add(evt.player);
                const isHome = evt.team === 'home';
                candidates.push({
                    id: `cand_goal_${idx}_${evt.player.replace(/\s+/g, '_')}`,
                    name: evt.player,
                    team: isHome ? homeName : awayName,
                    pos: 'FWD',
                    isGoalScorer: true,
                    votes: 45 + (idx * 15),
                });
            }
        });
    }

    // 2. ดึงนักเตะเด่นจาก Lineup หรือ Known Squads
    const findStars = (teamName: string, isHome: boolean) => {
        let stars: { name: string; pos: string; number: number }[] = [];
        for (const key of Object.keys(STAR_PLAYERS_MAP)) {
            if (teamName.includes(key) || key.includes(teamName)) {
                stars = STAR_PLAYERS_MAP[key];
                break;
            }
        }

        if (stars.length === 0) {
            stars = [
                { name: `${teamName} - มิดฟิลด์กัปตันทีม`, pos: 'MID', number: 10 },
                { name: `${teamName} - กองหน้าตัวเป้า`, pos: 'FWD', number: 9 },
                { name: `${teamName} - ผู้รักษาประตูจอมหนึบ`, pos: 'GK', number: 1 },
            ];
        }

        stars.slice(0, 3).forEach((st, idx) => {
            if (!usedNames.has(st.name)) {
                usedNames.add(st.name);
                candidates.push({
                    id: `cand_${isHome ? 'h' : 'a'}_${idx}_${st.name.replace(/\s+/g, '_')}`,
                    name: st.name,
                    team: teamName,
                    pos: st.pos,
                    number: st.number,
                    votes: 20 + Math.floor(Math.random() * 30),
                });
            }
        });
    };

    findStars(homeName, true);
    findStars(awayName, false);

    return candidates.slice(0, 6); // ลิมิตไม่เกิน 6 คนเพื่อความกระชับ
}

export default function PlayerOfMatchModal({ match, isOpen, onClose }: PlayerOfMatchModalProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [liveVotes, setLiveVotes] = useState<{ [candId: string]: number }>({});

    const homeName = match?.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match?.awayTeam?.name || 'ทีมเยือน';
    
    // Key สำหรับ clean ID
    const cleanMatchId = useMemo(() => {
        return String(match?.id || match?.slug || 'match-default').replace(/[^a-zA-Z0-9_-]/g, '_');
    }, [match]);

    const storageKey = `potm_voted_${cleanMatchId}`;

    // สร้างรายชื่อผู้เข้าชิงตามข้อมูลทีมจริง
    const baseCandidates = useMemo(() => {
        return generateInitialCandidates(match);
    }, [match]);

    // 1. ตรวจสอบสถานะการโหวตเดิมจาก LocalStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const voted = localStorage.getItem(storageKey);
        if (voted) {
            setHasVoted(true);
            setSelectedCandidate(voted);
        }
    }, [storageKey]);

    // 2. Realtime Listener ผลโหวตรวมผ่าน Firebase Realtime Database
    useEffect(() => {
        if (!cleanMatchId || !db) return;

        const potmRef = ref(db, `potm_votes/${cleanMatchId}`);
        const unsubscribe = onValue(potmRef, (snapshot) => {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                setLiveVotes(data);
            }
        }, (err) => {
            console.warn('Firebase POTM read note:', err?.message || err);
        });

        return () => unsubscribe();
    }, [cleanMatchId]);

    // รวมคะแนนฐาน + คะแนน Realtime จาก Firebase
    const candidatesWithLiveVotes = useMemo(() => {
        return baseCandidates.map((c) => {
            const extra = liveVotes[c.id] || 0;
            return {
                ...c,
                votes: c.votes + extra,
            };
        });
    }, [baseCandidates, liveVotes]);

    const totalVotes = useMemo(() => {
        return candidatesWithLiveVotes.reduce((sum, c) => sum + c.votes, 0);
    }, [candidatesWithLiveVotes]);

    // 3. ฟังก์ชันบันทึกการโหวต (Optimistic + Firebase RTDB Transaction)
    const handleVote = useCallback((candidateId: string) => {
        if (hasVoted) return;

        // Optimistic update
        setSelectedCandidate(candidateId);
        setHasVoted(true);
        try {
            localStorage.setItem(storageKey, candidateId);
        } catch {}

        // ซิงก์คะแนนจริงเข้า Firebase Realtime Database
        if (db && cleanMatchId) {
            const candidateRef = ref(db, `potm_votes/${cleanMatchId}/${candidateId}`);
            runTransaction(candidateRef, (current) => {
                return (current || 0) + 1;
            }).catch((err) => {
                console.warn('Firebase POTM vote note:', err?.message || err);
            });
        }
    }, [hasVoted, cleanMatchId, storageKey]);

    if (!isOpen || !match) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.3s_ease-out] font-sans">
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-[#0B0F17] to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col gap-4">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 pr-8">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                            โหวต Man of the Match สด
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">{homeName} พบ {awayName}</p>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-slate-300 font-bold">โหวตสดทั่วประเทศ</span>
                    </span>
                    <span>ผู้ร่วมโหวตทั้งหมด: <strong className="text-amber-400 font-mono font-bold">{totalVotes.toLocaleString()}</strong> คน</span>
                </div>

                {/* Vote Candidate List */}
                <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                    {candidatesWithLiveVotes.map((player) => {
                        const pct = totalVotes > 0 ? Math.round((player.votes / totalVotes) * 100) : 0;
                        const isSelected = selectedCandidate === player.id;

                        return (
                            <div
                                key={player.id}
                                onClick={() => !hasVoted && handleVote(player.id)}
                                className={cn(
                                    "relative overflow-hidden p-3 rounded-2xl border transition-all duration-200 backdrop-blur-md",
                                    !hasVoted && "hover:border-amber-400/50 hover:bg-white/5 cursor-pointer active:scale-[0.99]",
                                    isSelected 
                                        ? "bg-amber-500/15 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]" 
                                        : "bg-slate-900/80 border-white/10"
                                )}
                            >
                                {/* Progress Bar Background when voted */}
                                {hasVoted && (
                                    <div 
                                        className={cn(
                                            "absolute top-0 left-0 bottom-0 transition-all duration-700 opacity-20 pointer-events-none",
                                            isSelected ? "bg-amber-400" : "bg-slate-600"
                                        )}
                                        style={{ width: `${pct}%` }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={cn(
                                            "w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold shrink-0",
                                            isSelected ? "bg-amber-400 text-black shadow-md" : "bg-white/10 text-slate-300"
                                        )}>
                                            {player.number ? `#${player.number}` : player.pos}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <span className={cn(
                                                    "text-xs sm:text-sm font-bold truncate",
                                                    isSelected ? "text-amber-300" : "text-slate-100"
                                                )}>
                                                    {player.name}
                                                </span>
                                                {player.isGoalScorer && (
                                                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold border border-rose-500/30 shrink-0">
                                                        ⚽ ทำประตู
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-400 truncate">{player.team} ({player.pos})</span>
                                        </div>
                                    </div>

                                    {/* Vote Percentage / Action */}
                                    {hasVoted ? (
                                        <div className="flex items-center gap-1.5 font-mono font-black text-xs text-amber-400 shrink-0">
                                            <span>{pct}%</span>
                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                                        </div>
                                    ) : (
                                        <button className="px-3 py-1 rounded-xl bg-[#E5B842] text-black text-xs font-black hover:bg-amber-300 transition-colors shadow-sm shrink-0 cursor-pointer">
                                            โหวต
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
                    <span className="text-[10px] sm:text-xs">
                        {hasVoted ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกคะแนนของคุณเรียบร้อยแล้ว
                            </span>
                        ) : (
                            <span>แตะเพื่อเลือกนักเตะที่คุณประทับใจ</span>
                        )}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>

            </div>
        </div>
    );
}
