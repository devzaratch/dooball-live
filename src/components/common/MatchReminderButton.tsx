'use client';

import { useState, useEffect } from 'react';
import { Match } from '@/types/football';
import { Bell, BellRing, Check } from 'lucide-react';

interface MatchReminderButtonProps {
    match: Match;
    variant?: 'icon' | 'button' | 'badge';
    className?: string;
}

export default function MatchReminderButton({ match, variant = 'button', className = '' }: MatchReminderButtonProps) {
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const storageKey = 'user_match_reminders';

    useEffect(() => {
        try {
            const savedReminders: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
            setIsSaved(savedReminders.includes(match.id));
        } catch {
            setIsSaved(false);
        }
    }, [match.id]);

    const toggleReminder = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const savedReminders: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
            let updated: string[] = [];

            if (savedReminders.includes(match.id)) {
                updated = savedReminders.filter((id) => id !== match.id);
                setIsSaved(false);
            } else {
                updated = [...savedReminders, match.id];
                setIsSaved(true);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }

            localStorage.setItem(storageKey, JSON.stringify(updated));
            // Trigger custom event so other components sync instantly
            window.dispatchEvent(new Event('reminders_updated'));
        } catch (err) {
            console.error('Failed to toggle reminder:', err);
        }
    };

    if (variant === 'icon') {
        return (
            <div className="relative inline-block">
                <button
                    onClick={toggleReminder}
                    title={isSaved ? 'ยกเลิกการแจ้งเตือน' : 'แจ้งเตือนเมื่อบอลเริ่มเตะ'}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isSaved
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white border border-white/10'
                    } ${className}`}
                >
                    {isSaved ? <BellRing className="w-4 h-4 text-amber-400 animate-bounce" /> : <Bell className="w-4 h-4" />}
                </button>
            </div>
        );
    }

    return (
        <div className="relative inline-block">
            <button
                onClick={toggleReminder}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSaved
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border-white/10'
                } ${className}`}
            >
                {isSaved ? (
                    <>
                        <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>ติดตามแล้ว</span>
                    </>
                ) : (
                    <>
                        <Bell className="w-3.5 h-3.5 text-slate-400" />
                        <span>แจ้งเตือน</span>
                    </>
                )}
            </button>

            {/* Notification Toast Confirmation */}
            {showToast && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/50 text-amber-400 text-[11px] font-semibold whitespace-nowrap shadow-2xl backdrop-blur-md flex items-center gap-1.5 animate-[fadeIn_0.2s_ease-out] z-30">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>บันทึกการแจ้งเตือนแล้ว!</span>
                </div>
            )}
        </div>
    );
}
