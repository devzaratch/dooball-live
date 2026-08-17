"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { ref, push, onChildAdded, DataSnapshot, Unsubscribe } from 'firebase/database';
import { db } from '@/lib/firebase';
import { User, Volume2, VolumeX, Sparkles, Send } from 'lucide-react';

interface ChatMessage {
    id: string;
    text: string;
    user: string;
    timestamp?: number;
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

// Web Audio API Synthesizer สำหรับเสียงเอฟเฟกต์สนามบอล (ไม่ต้องพึ่งไฟล์ภายนอก)
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
    const [nickname, setNickname] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const savedName = localStorage.getItem('chat_nickname');
        if (savedName) setNickname(savedName);
    }, []);

    useEffect(() => {
        setMessages([]);

        const chatRef = ref(db, `chats/${matchId}`);
        let unsubscribe: Unsubscribe | null = null;

        try {
            unsubscribe = onChildAdded(
                chatRef,
                (snapshot: DataSnapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        setMessages((prev) => [...prev, {
                            id: snapshot.key as string,
                            text: data.text,
                            user: data.user,
                            timestamp: data.timestamp,
                        }]);
                    }
                },
                (error) => {
                    console.warn('Firebase Realtime Chat read permission warning:', error.message);
                }
            );
        } catch (error) {
            console.error('Firebase Chat Error:', error);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [matchId]);

    const handleJoinChat = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = (fd.get('nickname') as string)?.trim();
        if (name && name.length > 0) {
            localStorage.setItem('chat_nickname', name);
            setNickname(name);
        }
    };

    const sendMessage = (textToSend?: string) => {
        const messageText = textToSend || input.trim();
        if (!messageText || !nickname) return;

        const chatRef = ref(db, `chats/${matchId}`);
        push(chatRef, {
            user: nickname,
            text: messageText,
            timestamp: Date.now(),
        }).catch((err) => {
            console.error('Failed to send message:', err);
            setMessages(prev => [...prev, { id: Date.now().toString(), text: messageText, user: nickname + " (offline)" }]);
        });

        if (!textToSend) setInput("");
    };

    const triggerSoundAndSend = (soundType: 'cheer' | 'whistle' | 'goal', label: string) => {
        playStadiumSound(soundType, isMuted);
        if (nickname) {
            sendMessage(label);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0B0F17] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
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
                </div>
            </div>

            {/* ข้อความแชท */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 custom-scrollbar min-h-0 relative">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-2 py-12">
                        <Sparkles className="w-6 h-6 text-amber-400/60 animate-pulse" />
                        <p className="text-xs">ยังไม่มีข้อความ — เป็นคนแรกที่ร่วมพูดคุย!</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className="text-xs leading-relaxed animate-[fadeIn_0.2s_ease-out]">
                        <span className="font-bold text-amber-400">{msg.user}: </span>
                        <span className="text-slate-200">{msg.text}</span>
                    </div>
                ))}
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
                                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all whitespace-nowrap border border-white/5 cursor-pointer shrink-0"
                            >
                                {sticker.label}
                            </button>
                        ))}
                    </div>

                    <form key="form-message" onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                ชื่อผู้ใช้: {nickname}
                            </span>
                            <button 
                                type="button" 
                                onClick={() => { localStorage.removeItem('chat_nickname'); setNickname(null); }}
                                className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                                เปลี่ยนชื่อ
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <input
                                key="input-message"
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                maxLength={200}
                                placeholder="พิมพ์ข้อความเชียร์บอล..."
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E5B842]/50 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="bg-[#E5B842] disabled:bg-[#E5B842]/30 disabled:text-black/50 hover:bg-[#d4a737] text-black px-3.5 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95 cursor-pointer flex items-center gap-1"
                            >
                                <Send className="w-3.5 h-3.5" />
                                ส่ง
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}