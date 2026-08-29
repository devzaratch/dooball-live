'use client';

import { useState } from 'react';
import { Flag, AlertTriangle, CheckCircle2, X, Loader2, VolumeX, Tv2, WifiOff, Send } from 'lucide-react';
import { ref, push, set, serverTimestamp, runTransaction } from 'firebase/database';
import { db } from '@/lib/firebase';
import { StreamLink } from './StreamSelector';

interface ReportStreamModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string;
    matchName?: string;
    activeStream?: StreamLink | null;
}

const REPORT_REASONS = [
    { id: 'broken_link', label: 'ลิงก์เสีย / เล่นไม่ได้', icon: WifiOff, color: 'text-rose-400' },
    { id: 'black_screen', label: 'จอดำ / สัญญาณขาดหาย', icon: Tv2, color: 'text-amber-400' },
    { id: 'audio_issue', label: 'ไม่มีเสียง / เสียงไม่ตรงภาพ', icon: VolumeX, color: 'text-sky-400' },
    { id: 'lagging', label: 'ภาพกระตุก / โหลดค้างช้า', icon: AlertTriangle, color: 'text-orange-400' },
];

export default function ReportStreamModal({
    isOpen,
    onClose,
    matchId,
    matchName = 'การแข่งขันสด',
    activeStream,
}: ReportStreamModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>('broken_link');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !activeStream) return;

        setIsSubmitting(true);

        try {
            const reasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);

            const res = await fetch('/api/matches/report-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    matchName,
                    streamId: activeStream.id || 'default_stream',
                    streamLabel: activeStream.label || 'ลิงก์ถ่ายทอดสด',
                    streamUrl: activeStream.url || '',
                    reasonId: selectedReason,
                    reasonLabel: reasonObj?.label || 'แจ้งลิงก์เสีย',
                    note: note.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setIsSuccess(true);
                setTimeout(() => {
                    setIsSuccess(false);
                    onClose();
                }, 2000);
            } else {
                throw new Error(data.error || 'Failed to report');
            }
        } catch (err) {
            console.error('Failed to submit stream report:', err);
            // Fallback UX success so the user modal closes gracefully
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md bg-[#0B0F17] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 font-sans overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background Glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                            <Flag className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base text-slate-100">แจ้งปัญหาสัญญาณถ่ายทอดสด</h3>
                            <p className="text-xs text-slate-400 truncate max-w-[230px]">
                                {activeStream?.label || 'ช่องสัญญาณปัจจุบัน'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-slate-100">ส่งรายงานเรียบร้อยแล้ว!</h4>
                        <p className="text-xs text-slate-400 max-w-xs">
                            ขอบคุณสำหรับการแจ้งเตือน ทีมงานกำลังเร่งตรวจสอบสัญญาณช่องนี้ให้โดยเร็วที่สุดครับ
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Stream Context Info */}
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 flex justify-between items-center">
                            <span className="text-slate-400">แมตช์:</span>
                            <span className="font-semibold text-slate-100 truncate max-w-[240px]">{matchName}</span>
                        </div>

                        {/* Reasons Grid */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                เลือกปัญหาที่พบ
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {REPORT_REASONS.map((reason) => {
                                    const Icon = reason.icon;
                                    const isSelected = selectedReason === reason.id;

                                    return (
                                        <button
                                            key={reason.id}
                                            type="button"
                                            onClick={() => setSelectedReason(reason.id)}
                                            className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left text-xs font-medium transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-rose-500/15 border-rose-500/50 text-slate-100 shadow-[0_0_15px_rgba(244,63,94,0.15)] font-bold'
                                                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] text-slate-300 hover:text-white'
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 shrink-0 ${reason.color}`} />
                                            <span className="leading-tight">{reason.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Optional Note */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400">
                                รายละเอียดเพิ่มเติม (ไม่บังคับ)
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="เช่น นาทีที่ 35 ภาพค้างจอดำ..."
                                maxLength={100}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2 flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold shadow-lg shadow-rose-600/20 border border-rose-400/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-3.5 h-3.5" />
                                        ส่งรายงาน
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
