'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ReactionPickerBarProps {
    onSendReaction: (emoji: string) => void;
}

const EMOJI_LIST = [
    { emoji: '⚽', label: 'เข้าประตู' },
    { emoji: '🔥', label: 'สุดยอด' },
    { emoji: '🎉', label: 'ดีใจ' },
    { emoji: '🟥', label: 'ใบแดง' },
    { emoji: '👏', label: 'ปรบมือ' },
    { emoji: '❤️', label: 'เชียร์' },
];

export default function ReactionPickerBar({ onSendReaction }: ReactionPickerBarProps) {
    const [cooldown, setCooldown] = useState(false);

    const handleClick = (emoji: string) => {
        if (cooldown) return;
        onSendReaction(emoji);

        // 300ms cooldown to prevent accidental rapid double taps
        setCooldown(true);
        setTimeout(() => setCooldown(false), 300);
    };

    return (
        <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-[#0B0F17]/90 border border-white/10 backdrop-blur-xl shadow-xl font-sans overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 px-2 shrink-0 border-r border-white/10 text-xs font-bold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">ส่ง Reaction สด</span>
            </div>

            <div className="flex items-center gap-1">
                {EMOJI_LIST.map((item) => (
                    <button
                        key={item.emoji}
                        type="button"
                        onClick={() => handleClick(item.emoji)}
                        disabled={cooldown}
                        title={item.label}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] hover:bg-white/15 border border-white/10 hover:border-amber-400/40 flex items-center justify-center text-lg sm:text-xl transition-all duration-150 active:scale-90 hover:scale-110 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                        {item.emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
