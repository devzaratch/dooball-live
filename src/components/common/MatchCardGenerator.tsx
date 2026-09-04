'use client';

import { useState, useRef } from 'react';
import { Match } from '@/types/football';
import { 
    Download, Share2, Sparkles, X, Trophy, Flame, 
    CheckCircle2, Image as ImageIcon, Copy, Check 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchCardGeneratorProps {
    match: Match;
    isOpen: boolean;
    onClose: () => void;
}

export default function MatchCardGenerator({ match, isOpen, onClose }: MatchCardGeneratorProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen || !match) return null;

    const homeScore = match.homeTeam?.score ?? '0';
    const awayScore = match.awayTeam?.score ?? '0';
    const isLive = match.status === 'LIVE';
    const isFinished = match.status === 'FINISHED';

    const handleDownloadCanvas = async () => {
        setIsGenerating(true);
        try {
            // สร้าง Canvas เสมือนและวาดการ์ดผลบอลแบบความละเอียดสูง (1080x1350)
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1350;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. Background Gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
            bgGrad.addColorStop(0, '#060A10');
            bgGrad.addColorStop(0.5, '#0B0F17');
            bgGrad.addColorStop(1, '#020408');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1080, 1350);

            // 2. Gold Border & Accent Lines
            ctx.strokeStyle = '#E5B842';
            ctx.lineWidth = 12;
            ctx.strokeRect(30, 30, 1020, 1290);

            // 3. Top Branding Header
            ctx.fillStyle = '#E5B842';
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('DOOBALL LIVE • MATCH SUMMARY', 540, 110);

            // 4. League Name
            ctx.fillStyle = '#94A3B8';
            ctx.font = 'bold 32px sans-serif';
            ctx.fillText((match.league?.name || 'FOOTBALL LEAGUE').toUpperCase(), 540, 180);

            // 5. Match Status Pill
            ctx.fillStyle = isLive ? '#EF4444' : '#10B981';
            ctx.beginPath();
            ctx.roundRect(420, 220, 240, 56, 28);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 26px sans-serif';
            ctx.fillText(isLive ? `🔴 LIVE ${match.currentMinute || ''}'` : isFinished ? 'FULL TIME (จบการแข่งขัน)' : 'UPCOMING MATCH', 540, 258);

            // 6. Team Names
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 44px sans-serif';
            ctx.fillText(match.homeTeam?.name || 'ทีมเหย้า', 540, 440);

            // 7. Large Score Banner
            ctx.fillStyle = '#0F172A';
            ctx.beginPath();
            ctx.roundRect(290, 520, 500, 220, 32);
            ctx.fill();
            ctx.strokeStyle = 'rgba(229, 184, 66, 0.4)';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#E5B842';
            ctx.font = '900 130px monospace';
            ctx.fillText(`${homeScore}  -  ${awayScore}`, 540, 675);

            // 8. Away Team Name
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 44px sans-serif';
            ctx.fillText(match.awayTeam?.name || 'ทีมเยือน', 540, 840);

            // 9. Match Stadium & Time
            ctx.fillStyle = '#64748B';
            ctx.font = '28px sans-serif';
            ctx.fillText(`เวลาแข่งขัน: ${match.kickoffTime || 'สด'} • ถ่ายทอดสดทาง Dooball Live`, 540, 960);

            // 10. Footer Call to Action
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(60, 1100, 960, 160);

            ctx.fillStyle = '#E5B842';
            ctx.font = 'bold 30px sans-serif';
            ctx.fillText('ดูบอลสดออนไลน์ฟรี คมชัดระดับ HD ไม่กระตุก', 540, 1170);
            ctx.fillStyle = '#94A3B8';
            ctx.font = '24px sans-serif';
            ctx.fillText('www.dooball-live.com (ເບິ່ງບານສົດ ຟຣີ)', 540, 1220);

            // Download Trigger
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `dooball-match-${match.homeTeam?.name}-vs-${match.awayTeam?.name}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Canvas export error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyShareLink = () => {
        if (typeof window === 'undefined') return;
        const url = window.location.origin + `/watch/${match.slug || match.id}`;
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-[fadeIn_0.3s_ease-out] font-sans">
            <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-[#0B0F17] to-slate-950 border-2 border-[#E5B842]/50 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(229,184,66,0.3)] flex flex-col gap-6">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            สร้างการ์ดผลบอล (Match Story Card)
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </h3>
                        <p className="text-xs text-slate-400">สร้างภาพกราฟิกสรุปผลบอลสวยงามสำหรับแชร์ลงโซเชียล</p>
                    </div>
                </div>

                {/* Live Card Preview Box */}
                <div 
                    ref={cardRef}
                    className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-b from-slate-950 via-[#0B0F17] to-slate-950 border border-amber-500/30 shadow-2xl flex flex-col items-center justify-between text-center gap-4"
                >
                    {/* Top League & Branding */}
                    <div className="flex items-center justify-between w-full text-[11px] text-slate-400 border-b border-white/10 pb-2">
                        <span className="font-bold text-[#E5B842] flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" />
                            {match.league?.name || 'ลีกฟุตบอล'}
                        </span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            isLive ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-400"
                        )}>
                            {isLive ? `🔴 LIVE ${match.currentMinute || ''}'` : isFinished ? 'จบการแข่งขัน (FT)' : 'รอแข่ง'}
                        </span>
                    </div>

                    {/* Match Score Display */}
                    <div className="flex items-center justify-between w-full py-2 gap-2">
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center mb-1">
                                {match.homeTeam?.logo ? (
                                    <img src={match.homeTeam.logo} alt="" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="font-bold text-xs">H</span>
                                )}
                            </div>
                            <span className="font-black text-sm text-white line-clamp-1">{match.homeTeam?.name}</span>
                        </div>

                        <div className="px-4 py-2 rounded-2xl bg-black/80 border border-amber-500/40 font-mono font-black text-2xl text-[#E5B842] shadow-[0_0_20px_rgba(229,184,66,0.2)]">
                            {homeScore} : {awayScore}
                        </div>

                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center mb-1">
                                {match.awayTeam?.logo ? (
                                    <img src={match.awayTeam.logo} alt="" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="font-bold text-xs">A</span>
                                )}
                            </div>
                            <span className="font-black text-sm text-white line-clamp-1">{match.awayTeam?.name}</span>
                        </div>
                    </div>

                    {/* Watermark Tag */}
                    <div className="w-full pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Dooball Live Official</span>
                        <span>www.dooball-live.com</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleDownloadCanvas}
                        disabled={isGenerating}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#E5B842] to-amber-500 hover:from-[#f5cb58] hover:to-amber-400 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,184,66,0.3)] transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        <span>{isGenerating ? 'กำลังสร้างรูปภาพ...' : 'ดาวน์โหลดรูปภาพ HD (PNG)'}</span>
                    </button>

                    <button
                        onClick={handleCopyShareLink}
                        className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer"
                    >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                        <span>{isCopied ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์แชร์'}</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
