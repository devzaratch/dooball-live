'use client';

import { useState, useEffect } from 'react';
import { Match } from '@/types/football';
import { db } from '@/lib/firebase';
import { ref, onValue, set, runTransaction } from 'firebase/database';
import { Vote, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';

interface MatchPredictionProps {
    match: Match;
}

interface VotesData {
    home: number;
    draw: number;
    away: number;
}

export default function MatchPrediction({ match }: MatchPredictionProps) {
    const [votes, setVotes] = useState<VotesData>({ home: 12, draw: 5, away: 8 });
    const [userVote, setUserVote] = useState<'home' | 'draw' | 'away' | null>(null);
    const [voting, setVoting] = useState(false);

    const matchId = match?.id || 'default';
    const storageKey = `user_vote_${matchId}`;
    const homeName = match?.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match?.awayTeam?.name || 'ทีมเยือน';

    // ตรวจสอบการโหวตเดิมจาก localStorage และ Firebase Realtime DB
    useEffect(() => {
        if (!matchId) return;

        const savedVote = localStorage.getItem(storageKey) as 'home' | 'draw' | 'away' | null;
        if (savedVote) {
            setUserVote(savedVote);
        }

        if (db && matchId) {
            const votesRef = ref(db, `match_votes/${matchId}`);
            const unsubscribe = onValue(votesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setVotes({
                        home: Number(data.home || 0),
                        draw: Number(data.draw || 0),
                        away: Number(data.away || 0),
                    });
                }
            }, (err) => {
                console.warn('Firebase match_votes read error:', err.message);
            });

            return () => unsubscribe();
        }
    }, [matchId, storageKey]);

    if (!match) return null;

    const totalVotes = votes.home + votes.draw + votes.away;

    const getPercentage = (val: number) => {
        if (totalVotes === 0) return 33;
        return Math.round((val / totalVotes) * 100);
    };

    const handleVote = (option: 'home' | 'draw' | 'away') => {
        if (userVote || voting) return;

        setVoting(true);
        const newVotes = {
            ...votes,
            [option]: votes[option] + 1,
        };

        setVotes(newVotes);
        setUserVote(option);
        localStorage.setItem(storageKey, option);

        if (db && matchId) {
            const optionRef = ref(db, `match_votes/${matchId}/${option}`);
            runTransaction(optionRef, (currentVal) => {
                return (currentVal || 0) + 1;
            }).catch((err) => {
                console.warn('Firebase vote transaction error:', err);
            });
        }

        setVoting(false);
    };

    const homePercent = getPercentage(votes.home);
    const drawPercent = getPercentage(votes.draw);
    const awayPercent = getPercentage(votes.away);

    return (
        <div className="flex flex-col gap-4 bg-[#0B0F17]/90 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl font-sans">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                        <Vote className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm md:text-base text-slate-100 flex items-center gap-2">
                            ทายผลการแข่งขันแมตช์นี้
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </h3>
                        <p className="text-[11px] text-slate-400">ร่วมโหวตทีมที่คุณคิดว่าจะชนะในแมตช์นี้</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>รวม {totalVotes} โหวต</span>
                </div>
            </div>

            {/* Voting Options Grid */}
            <div className="grid grid-cols-3 gap-2.5 md:gap-4 my-1">
                {/* Home Win */}
                <button
                    disabled={Boolean(userVote) || voting}
                    onClick={() => handleVote('home')}
                    className={`relative flex flex-col items-center justify-between p-3 md:p-4 rounded-2xl border transition-all cursor-pointer ${
                        userVote === 'home'
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                            : userVote
                                ? 'bg-white/[0.02] border-white/5 text-slate-400 opacity-80 cursor-default'
                                : 'bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                    {userVote === 'home' && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-amber-400">
                            <CheckCircle className="w-3 h-3" /> เลือกแล้ว
                        </span>
                    )}
                    <span className="text-xs font-bold text-slate-300 truncate max-w-full mb-2">
                        {homeName} ชนะ
                    </span>
                    <span className="text-xl md:text-2xl font-black font-mono text-amber-400">
                        {homePercent}%
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">{votes.home} เสียง</span>
                </button>

                {/* Draw */}
                <button
                    disabled={Boolean(userVote) || voting}
                    onClick={() => handleVote('draw')}
                    className={`relative flex flex-col items-center justify-between p-3 md:p-4 rounded-2xl border transition-all cursor-pointer ${
                        userVote === 'draw'
                            ? 'bg-blue-500/20 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                            : userVote
                                ? 'bg-white/[0.02] border-white/5 text-slate-400 opacity-80 cursor-default'
                                : 'bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                    {userVote === 'draw' && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-blue-400">
                            <CheckCircle className="w-3 h-3" /> เลือกแล้ว
                        </span>
                    )}
                    <span className="text-xs font-bold text-slate-300 truncate max-w-full mb-2">
                        ผลเสมอ
                    </span>
                    <span className="text-xl md:text-2xl font-black font-mono text-blue-400">
                        {drawPercent}%
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">{votes.draw} เสียง</span>
                </button>

                {/* Away Win */}
                <button
                    disabled={Boolean(userVote) || voting}
                    onClick={() => handleVote('away')}
                    className={`relative flex flex-col items-center justify-between p-3 md:p-4 rounded-2xl border transition-all cursor-pointer ${
                        userVote === 'away'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                            : userVote
                                ? 'bg-white/[0.02] border-white/5 text-slate-400 opacity-80 cursor-default'
                                : 'bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                    {userVote === 'away' && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <CheckCircle className="w-3 h-3" /> เลือกแล้ว
                        </span>
                    )}
                    <span className="text-xs font-bold text-slate-300 truncate max-w-full mb-2">
                        {awayName} ชนะ
                    </span>
                    <span className="text-xl md:text-2xl font-black font-mono text-emerald-400">
                        {awayPercent}%
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">{votes.away} เสียง</span>
                </button>
            </div>

            {/* Voting Distribution Progress Bar */}
            <div className="flex flex-col gap-1.5 pt-2">
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex p-0.5 border border-white/5">
                    <div 
                        style={{ width: `${homePercent}%` }} 
                        className="h-full bg-amber-500 rounded-l-full transition-all duration-500" 
                        title={`เหย้า ชนะ ${homePercent}%`}
                    />
                    <div 
                        style={{ width: `${drawPercent}%` }} 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        title={`เสมอ ${drawPercent}%`}
                    />
                    <div 
                        style={{ width: `${awayPercent}%` }} 
                        className="h-full bg-emerald-500 rounded-r-full transition-all duration-500" 
                        title={`เยือน ชนะ ${awayPercent}%`}
                    />
                </div>
                {userVote && (
                    <p className="text-[11px] text-center text-amber-400 font-semibold mt-1">
                        ขอบคุณสำหรับการโหวตทายผล! มาร่วมลุ้นผลการแข่งขันแมตช์นี้ไปด้วยกัน 🔥
                    </p>
                )}
            </div>
        </div>
    );
}
