'use client';

import { useState, useEffect } from 'react';
import { Match } from '@/types/football';
import { Award, Star, Sparkles, CheckCircle2, X, Trophy, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerCandidate {
    id: string;
    name: string;
    team: string;
    pos: string;
    votes: number;
}

interface PlayerOfMatchModalProps {
    match: Match;
    isOpen: boolean;
    onClose: () => void;
}

export default function PlayerOfMatchModal({ match, isOpen, onClose }: PlayerOfMatchModalProps) {
    const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);

    const homeName = match?.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match?.awayTeam?.name || 'ทีมเยือน';
    const storageKey = `potm_voted_${match?.id || match?.slug}`;

    const [candidates, setCandidates] = useState<PlayerCandidate[]>([
        { id: 'p1', name: `${homeName} - กองหน้าตัวหลัก`, team: homeName, pos: 'FWD', votes: 142 },
        { id: 'p2', name: `${homeName} - มิดฟิลด์จอมทัพ`, team: homeName, pos: 'MID', votes: 98 },
        { id: 'p3', name: `${homeName} - ผู้รักษาประตูจอมหนึบ`, team: homeName, pos: 'GK', votes: 64 },
        { id: 'p4', name: `${awayName} - ดาวยิงความเร็วสูง`, team: awayName, pos: 'FWD', votes: 115 },
        { id: 'p5', name: `${awayName} - จอมแอสซิสต์`, team: awayName, pos: 'MID', votes: 82 },
    ]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const voted = localStorage.getItem(storageKey);
        if (voted) {
            setHasVoted(true);
            setSelectedCandidate(voted);
        }
    }, [storageKey]);

    if (!isOpen || !match) return null;

    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

    const handleVote = (candidateId: string) => {
        if (hasVoted) return;

        setCandidates((prev) =>
            prev.map((c) => (c.id === candidateId ? { ...c, votes: c.votes + 1 } : c))
        );
        setSelectedCandidate(candidateId);
        setHasVoted(true);

        try {
            localStorage.setItem(storageKey, candidateId);
        } catch {}
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.3s_ease-out] font-sans">
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-[#0B0F17] to-slate-950 border-2 border-amber-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col gap-5">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                            โหวตนักเตะยอดเยี่ยม (Player of the Match)
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </h3>
                        <p className="text-xs text-slate-400">{homeName} vs {awayName}</p>
                    </div>
                </div>

                {/* Vote List */}
                <div className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                    {candidates.map((player) => {
                        const pct = totalVotes > 0 ? Math.round((player.votes / totalVotes) * 100) : 0;
                        const isSelected = selectedCandidate === player.id;

                        return (
                            <div
                                key={player.id}
                                onClick={() => !hasVoted && handleVote(player.id)}
                                className={cn(
                                    "relative overflow-hidden p-3.5 rounded-2xl border transition-all duration-200 backdrop-blur-md",
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
                                            "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0",
                                            isSelected ? "bg-amber-400 text-black shadow-md" : "bg-white/10 text-slate-300"
                                        )}>
                                            {player.pos}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={cn(
                                                "text-xs sm:text-sm font-bold truncate",
                                                isSelected ? "text-amber-300" : "text-slate-100"
                                            )}>
                                                {player.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{player.team}</span>
                                        </div>
                                    </div>

                                    {/* Vote Percentage / Button */}
                                    {hasVoted ? (
                                        <div className="flex items-center gap-1 font-mono font-black text-xs text-amber-400 shrink-0">
                                            <span>{pct}%</span>
                                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                                        </div>
                                    ) : (
                                        <button className="px-3 py-1.5 rounded-xl bg-[#E5B842] text-black text-xs font-black hover:bg-amber-300 transition-colors shadow-sm shrink-0">
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
                    <span>ผู้ร่วมโหวตทั้งหมด: <strong className="text-white font-mono">{totalVotes}</strong> คน</span>
                    {hasVoted && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> บันทึกการโหวตแล้ว
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
}
