"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { ref, push, onChildAdded, onChildRemoved, onValue, get, remove, DataSnapshot, Unsubscribe } from 'firebase/database';
import { db } from '@/lib/firebase';
import { User, Volume2, VolumeX, Sparkles, Send, Trash2, Megaphone, ShieldAlert, Settings, Check, X } from 'lucide-react';

export interface ClubBadgeInfo {
    id: string;
    name: string;
    icon: string;
    badgeStyle: string;
}

export const CLUB_BADGES: ClubBadgeInfo[] = [
    { id: 'LIV', name: 'ลิเวอร์พูล', icon: '🔴', badgeStyle: 'text-rose-300 bg-rose-500/15 border-rose-500/30' },
    { id: 'MCI', name: 'แมนฯ ซิตี้', icon: '🔵', badgeStyle: 'text-sky-300 bg-sky-500/15 border-sky-500/30' },
    { id: 'MUN', name: 'แมนฯ ยูไนเต็ด', icon: '🔴', badgeStyle: 'text-red-400 bg-red-500/15 border-red-500/30' },
    { id: 'ARS', name: 'อาร์เซนอล', icon: '🔴', badgeStyle: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
    { id: 'CHE', name: 'เชลซี', icon: '🔵', badgeStyle: 'text-blue-300 bg-blue-500/15 border-blue-500/30' },
    { id: 'RMA', name: 'เรอัล มาดริด', icon: '⚪', badgeStyle: 'text-slate-200 bg-white/10 border-white/20' },
    { id: 'BAR', name: 'บาร์เซโลนา', icon: '🟡', badgeStyle: 'text-amber-300 bg-amber-500/15 border-amber-500/30' },
    { id: 'THA', name: 'ทีมชาติไทย', icon: '🇹🇭', badgeStyle: 'text-blue-200 bg-blue-500/20 border-blue-400/40' },
    { id: 'FAN', name: 'แฟนบอลทั่วไป', icon: '⚽', badgeStyle: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
];

interface ChatMessage {
    id: string;
    userId?: string;
    user: string;
    clubBadge?: string;
    text: string;
    timestamp?: number;
    isAdmin?: boolean;
    role?: string;
}

const CHAT_STICKERS = [
    { label: '🔴 ลิเวอร์พูล', value: '🔴 ลิเวอร์พูล สู้ๆ! ⚽' },
    { label: '🔵 แมนฯ ซิตี้', value: '🔵 เรือใบสีฟ้า มาเลย! ⚡' },
    { label: '🔴 แมนฯ ยูไนเต็ด', value: '🔴 ปีศาจแดง เอาหน่อย! 🔥' },
    { label: '🔵 เชลซี', value: '🔵 สิงห์บลูส์ ลุย! 🦁' },
    { label: '🔴 อาร์เซนอล', value: '🔴 ปืนใหญ่ ลุยเต็มที่! 💣' },
    { label: '⚽ GOALLL!', value: '⚽ GOALLLLLLL!!!!! 🎉' },
    { label: '🔥 สู้ๆ!', value: '🔥 สู้ๆ วัยรุ่น! 💪' },
];

// Web Audio API Synthesizer สำหรับเสียงเอฟเฟกต์สนามบอล
const playStadiumSound = (type: 'cheer' | 'whistle' | 'goal', isMuted: boolean) => {
    if (isMuted) return;
    try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        if (type === 'whistle') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.1);
            osc.frequency.exponentialRampToValueAtTime(2900, ctx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'goal') {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sawtooth';
            osc2.type = 'square';
            osc1.frequency.setValueAtTime(340, ctx.currentTime);
            osc2.frequency.setValueAtTime(510, ctx.currentTime);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.7);
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.7);
            osc2.stop(ctx.currentTime + 0.7);
        } else if (type === 'cheer') {
            const bufferSize = ctx.sampleRate * 0.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 900;
            filter.Q.value = 2;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start();
            noise.stop(ctx.currentTime + 0.5);
        }
    } catch (e) {
        console.warn('Audio FX play error:', e);
    }
};

interface LiveChatProps {
    matchId: string;
    homeTeamName?: string;
    awayTeamName?: string;
}

export default function LiveChat({ matchId, homeTeamName, awayTeamName }: LiveChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [userId, setUserId] = useState<string>('');
    const [nickname, setNickname] = useState<string | null>(null);
    const [selectedBadge, setSelectedBadge] = useState<string>('FAN');
    const [isMuted, setIsMuted] = useState(false);
    const [pinnedNotice, setPinnedNotice] = useState<string | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [tempNickname, setTempNickname] = useState('');
    const [tempBadge, setTempBadge] = useState('FAN');
    const [isBanned, setIsBanned] = useState(false);
    const [banReason, setBanReason] = useState<string>('');
    const [cooldown, setCooldown] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Initial Setup: Load User Device ID, Nickname, Club Badge
    useEffect(() => {
        let storedUid = localStorage.getItem('dooball_user_id');
        if (!storedUid) {
            storedUid = 'u_' + Math.random().toString(36).slice(2, 9);
            localStorage.setItem('dooball_user_id', storedUid);
        }
        setUserId(storedUid);

        const savedName = localStorage.getItem('chat_nickname');
        if (savedName) {
            setNickname(savedName);
            setTempNickname(savedName);
        }

        const savedBadge = localStorage.getItem('chat_club_badge');
        if (savedBadge) {
            setSelectedBadge(savedBadge);
            setTempBadge(savedBadge);
        }
    }, []);

    // 2. Listen to Ban Status from Firebase
    useEffect(() => {
        if (!userId) return;
        const banRef = ref(db, `banned_users/${userId}`);
        const unsub = onValue(banRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                const now = Date.now();
                if (val.bannedUntil === -1 || (typeof val.bannedUntil === 'number' && val.bannedUntil > now)) {
                    setIsBanned(true);
                    setBanReason(val.reason || 'ทำผิดกฎการใช้งานห้องแชท');
                    return;
                }
            }
            setIsBanned(false);
            setBanReason('');
        });
        return () => unsub();
    }, [userId]);

    // สติ๊กเกอร์ทีมแชทแบบไดนามิกตามคู่แข่งขัน
    const dynamicStickers = useMemo(() => {
        if (homeTeamName || awayTeamName) {
            const home = homeTeamName || 'ทีมเหย้า';
            const away = awayTeamName || 'ทีมเยือน';

            return [
                { label: `🔴 ${home}`, value: `🔴 ${home} สู้ๆ! ⚽` },
                { label: `🔵 ${away}`, value: `🔵 ${away} สู้ๆ! ⚽` },
                { label: `⚽ GOALLL!`, value: `⚽ GOALLLLLLL!!!!! 🎉` },
                { label: `🔥 ลุยเต็มที่`, value: `🔥 ${home} vs ${away} สู้ๆ! 💪` },
                { label: `👏 สุดยอด!`, value: `👏 เชียร์แมตช์นี้สุดใจ! 🔥` },
            ];
        }

        return CHAT_STICKERS;
    }, [homeTeamName, awayTeamName]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-clean expired chat history (> 24 hours) & Realtime message subscription
    useEffect(() => {
        setMessages([]);

        const chatRef = ref(db, `chats/${matchId}`);
        const noticeRef = ref(db, `chat_notices/${matchId}`);

        get(chatRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const now = Date.now();
                const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

                const keys = Object.keys(data);
                let hasExpired = false;

                keys.forEach((key) => {
                    const msg = data[key];
                    if (msg?.timestamp && (now - msg.timestamp > TWENTY_FOUR_HOURS)) {
                        hasExpired = true;
                    }
                });

                if (hasExpired) {
                    remove(chatRef).catch(() => {});
                }
            }
        }).catch(() => {});

        let unsubscribeAdded: Unsubscribe | null = null;
        let unsubscribeRemoved: Unsubscribe | null = null;
        let unsubscribeNotice: Unsubscribe | null = null;

        try {
            unsubscribeAdded = onChildAdded(
                chatRef,
                (snapshot: DataSnapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === snapshot.key)) return prev;
                            return [...prev, {
                                id: snapshot.key as string,
                                userId: data.userId,
                                text: data.text,
                                user: data.user,
                                clubBadge: data.clubBadge,
                                timestamp: data.timestamp,
                                isAdmin: data.isAdmin,
                                role: data.role,
                            }];
                        });
                    }
                }
            );

            unsubscribeRemoved = onChildRemoved(chatRef, (snapshot: DataSnapshot) => {
                const removedId = snapshot.key;
                setMessages((prev) => prev.filter((m) => m.id !== removedId));
            });

            unsubscribeNotice = onValue(noticeRef, (snapshot) => {
                const val = snapshot.val();
                setPinnedNotice(val?.text || null);
            });
        } catch (error) {
            console.error('Firebase Chat Error:', error);
        }

        return () => {
            if (unsubscribeAdded) unsubscribeAdded();
            if (unsubscribeRemoved) unsubscribeRemoved();
            if (unsubscribeNotice) unsubscribeNotice();
        };
    }, [matchId]);

    const handleClearChat = async () => {
        if (!matchId) return;
        if (confirm('คุณต้องการล้างข้อความแชทในห้องนี้ทั้งหมดใช่หรือไม่?')) {
            try {
                const chatRef = ref(db, `chats/${matchId}`);
                await remove(chatRef);
                setMessages([]);
            } catch (err) {
                console.error('Failed to clear chat:', err);
            }
        }
    };

    // ระบบกรองคำไม่งาม (Profanity Filter)
    const filterProfanity = (text: string): string => {
        const BAD_WORDS = [
            'เหี้ย', 'ส้นตีน', 'ควย', 'เย็ด', 'แม่ง', 'สัตว์', 'เชี่ย', 'มึง', 'กู', 'กระจอก',
            'fuck', 'shit', 'bitch', 'bastard', 'cunt', 'dick', 'asshole'
        ];
        let cleaned = text;
        BAD_WORDS.forEach((word) => {
            const regex = new RegExp(word, 'gi');
            cleaned = cleaned.replace(regex, '***');
        });
        return cleaned;
    };

    // Cooldown countdown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleJoinChat = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = (fd.get('nickname') as string)?.trim();
        if (name && name.length > 0) {
            const cleanName = filterProfanity(name);
            localStorage.setItem('chat_nickname', cleanName);
            setNickname(cleanName);
            setTempNickname(cleanName);
        }
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (tempNickname.trim()) {
            const cleanName = filterProfanity(tempNickname.trim());
            localStorage.setItem('chat_nickname', cleanName);
            localStorage.setItem('chat_club_badge', tempBadge);
            setNickname(cleanName);
            setSelectedBadge(tempBadge);
            setIsProfileModalOpen(false);
        }
    };

    const sendMessage = (textToSend?: string) => {
        if (isBanned) return;
        const rawText = textToSend || input.trim();
        if (!rawText || !nickname) return;

        if (cooldown > 0) return;

        const messageText = filterProfanity(rawText);

        const chatRef = ref(db, `chats/${matchId}`);
        push(chatRef, {
            userId,
            user: nickname,
            clubBadge: selectedBadge,
            text: messageText,
            timestamp: Date.now(),
        }).catch((err) => {
            console.error('Failed to send message:', err);
            setMessages(prev => [...prev, { id: Date.now().toString(), text: messageText, user: nickname + " (offline)" }]);
        });

        setCooldown(3); // 3 seconds slow mode
        if (!textToSend) setInput("");
    };

    const triggerSoundAndSend = (soundType: 'cheer' | 'whistle' | 'goal', label: string) => {
        playStadiumSound(soundType, isMuted);
        if (nickname && !isBanned) {
            sendMessage(label);
        }
    };

    const currentBadgeObj = CLUB_BADGES.find((b) => b.id === selectedBadge) || CLUB_BADGES[8];

    return (
        <div className="flex flex-col h-full w-full bg-[#0B0F17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="p-3.5 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="font-bold text-slate-200 text-sm">Live Chat</h3>
                    <span className="text-[10px] text-slate-500">({messages.length})</span>
                </div>

                {/* Stadium Sound Effects Control */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => triggerSoundAndSend('cheer', '📣 [เสียงเฮสนาม!]')}
                        title="เสียงเฮสนาม"
                        className="px-2 py-0.5 rounded-lg text-xs bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 text-slate-300 transition-colors cursor-pointer"
                    >
                        📣 เฮ
                    </button>
                    <button
                        onClick={() => triggerSoundAndSend('whistle', '🎺 [เสียงนกหวีด!]')}
                        title="เสียงนกหวีด"
                        className="px-2 py-0.5 rounded-lg text-xs bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-slate-300 transition-colors cursor-pointer"
                    >
                        🎺 ปี้ด
                    </button>
                    <button
                        onClick={() => triggerSoundAndSend('goal', '⚽ [GOAL HORN!]')}
                        title="เสียงดีใจประตู"
                        className="px-2 py-0.5 rounded-lg text-xs bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 transition-colors cursor-pointer font-bold"
                    >
                        ⚽ GOAL
                    </button>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={isMuted ? 'เปิดเสียงเอฟเฟกต์' : 'ปิดเสียงเอฟเฟกต์'}
                    >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                    <button
                        onClick={handleClearChat}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                        title="ล้างข้อความแชทในห้องนี้"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Pinned Official Admin Notice */}
            {pinnedNotice && (
                <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 shadow-lg animate-in slide-in-from-top-2 shrink-0">
                    <Megaphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="flex-1 min-w-0">
                        <span className="font-extrabold text-amber-400">ประกาศจากแอดมิน: </span>
                        <span className="break-words font-medium">{pinnedNotice}</span>
                    </div>
                </div>
            )}

            {/* Banned Notice Banner */}
            {isBanned && (
                <div className="mx-3 mt-2.5 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2 shrink-0">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                    <div>
                        <p className="font-bold text-rose-300">🚫 บัญชีของคุณถูกระงับสิทธิ์การแชท</p>
                        <p className="text-[11px] text-rose-400">เหตุผล: {banReason}</p>
                    </div>
                </div>
            )}

            {/* ข้อความแชท */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 custom-scrollbar min-h-0 relative">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-2 py-12">
                        <Sparkles className="w-6 h-6 text-amber-400/60 animate-pulse" />
                        <p className="text-xs">ยังไม่มีข้อความ — เป็นคนแรกที่ร่วมพูดคุย!</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isAdmin = Boolean(msg.isAdmin || msg.role === 'admin');
                    const badgeObj = CLUB_BADGES.find((b) => b.id === msg.clubBadge);

                    if (isAdmin) {
                        return (
                            <div key={msg.id} className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] text-xs leading-relaxed animate-[fadeIn_0.2s_ease-out]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#E5B842] text-black font-black text-[9px] uppercase shadow-sm">
                                        👑 แอดมิน
                                    </span>
                                    <span className="font-extrabold text-amber-300">{msg.user}</span>
                                </div>
                                <p className="text-amber-100 font-medium break-words pl-1">{msg.text}</p>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className="text-xs leading-relaxed animate-[fadeIn_0.2s_ease-out] flex items-start gap-1.5 flex-wrap">
                            {badgeObj && (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold border shrink-0 ${badgeObj.badgeStyle}`}>
                                    <span>{badgeObj.icon}</span>
                                    <span>{badgeObj.name}</span>
                                </span>
                            )}
                            <span className="font-bold text-amber-400 shrink-0">{msg.user}: </span>
                            <span className="text-slate-200 break-words flex-1 min-w-[120px]">{msg.text}</span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* ส่วนกล่องข้อความด้านล่าง */}
            {!nickname ? (
                <form key="form-nickname" onSubmit={handleJoinChat} className="p-3.5 bg-white/[0.02] border-t border-white/10 shrink-0 flex flex-col gap-2.5">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-amber-400" /> ตั้งชื่อเล่นก่อนร่วมพูดคุยในแชทสด
                    </div>
                    <div className="flex gap-2">
                        <input
                            key="input-nickname"
                            type="text"
                            name="nickname"
                            defaultValue=""
                            required
                            maxLength={20}
                            placeholder="ชื่อเล่นของคุณ (สูงสุด 20 ตัวอักษร)"
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E5B842]/50 transition-all"
                        />
                        <button
                            type="submit"
                            className="bg-[#E5B842] hover:bg-[#d4a737] text-black px-4 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95 cursor-pointer"
                        >
                            เข้าร่วม
                        </button>
                    </div>
                </form>
            ) : (
                <div className="p-3 bg-white/[0.02] border-t border-white/10 shrink-0 flex flex-col gap-2">
                    {/* Quick Team Emotes Selector */}
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[11px]">
                        <span className="text-slate-500 shrink-0 text-[10px]">สติ๊กเกอร์:</span>
                        {dynamicStickers.map((sticker, idx) => (
                            <button
                                key={idx}
                                onClick={() => sendMessage(sticker.value)}
                                disabled={isBanned}
                                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all whitespace-nowrap border border-white/5 cursor-pointer shrink-0 disabled:opacity-40"
                            >
                                {sticker.label}
                            </button>
                        ))}
                    </div>

                    <form key="form-message" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    {nickname}
                                </span>
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${currentBadgeObj.badgeStyle}`}>
                                    {currentBadgeObj.icon} {currentBadgeObj.name}
                                </span>
                            </div>

                            <button 
                                type="button" 
                                onClick={() => {
                                    setTempNickname(nickname || '');
                                    setTempBadge(selectedBadge);
                                    setIsProfileModalOpen(true);
                                }}
                                className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                                title="แก้ไขชื่อเล่นและไอคอนทีมโปรด"
                            >
                                <Settings className="w-3 h-3" />
                                <span>โปรไฟล์แชท</span>
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                key="input-message"
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                maxLength={200}
                                disabled={isBanned}
                                placeholder={isBanned ? "บัญชีของคุณถูกระงับการแชท..." : "พิมพ์ข้อความเชียร์บอล..."}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E5B842]/50 transition-all disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || cooldown > 0 || isBanned}
                                className="bg-[#E5B842] disabled:bg-white/10 disabled:text-slate-400 hover:bg-[#d4a737] text-black px-3.5 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95 cursor-pointer flex items-center gap-1 min-w-[55px] justify-center"
                            >
                                <Send className="w-3.5 h-3.5" />
                                {cooldown > 0 ? `${cooldown}s` : 'ส่ง'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Profile Customization Modal */}
            {isProfileModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="w-full max-w-sm bg-[#0B0F17] border border-white/20 rounded-2xl p-4 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                            <h4 className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-amber-400" />
                                ปรับแต่งโปรไฟล์แชท
                            </h4>
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="text-slate-400 hover:text-white cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-300">ชื่อเล่นของคุณ:</label>
                                <input
                                    type="text"
                                    value={tempNickname}
                                    onChange={(e) => setTempNickname(e.target.value)}
                                    maxLength={20}
                                    required
                                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-300">เลือกทีมโปรด (แสดงป้ายข้างชื่อ):</label>
                                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                    {CLUB_BADGES.map((b) => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => setTempBadge(b.id)}
                                            className={`p-2 rounded-xl border text-left text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                                                tempBadge === b.id
                                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                                                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>{b.icon}</span>
                                            <span className="truncate text-[11px]">{b.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-bold border border-white/10 cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black text-xs font-extrabold shadow-md cursor-pointer"
                                >
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}