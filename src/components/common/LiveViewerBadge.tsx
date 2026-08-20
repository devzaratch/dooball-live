'use client';

import { Eye, Users } from 'lucide-react';
import { useLiveViewers } from '@/hooks/useLiveViewers';
import { cn } from '@/lib/utils';

interface LiveViewerBadgeProps {
    matchId: string;
    isLive?: boolean;
    variant?: 'badge' | 'player_overlay' | 'card_tag';
    className?: string;
}

export default function LiveViewerBadge({
    matchId,
    isLive = true,
    variant = 'badge',
    className
}: LiveViewerBadgeProps) {
    const { formattedViewerCount } = useLiveViewers(matchId, isLive);

    if (variant === 'player_overlay') {
        return (
            <div className={cn(
                "absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-white/15 backdrop-blur-md shadow-xl text-slate-200 text-xs font-bold transition-all group-hover:opacity-100",
                className
            )}>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Eye className="w-3.5 h-3.5 text-[#E5B842] shrink-0" />
                <span className="font-mono text-[#E5B842] font-black">{formattedViewerCount}</span>
                <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">กำลังรับชมสด</span>
            </div>
        );
    }

    if (variant === 'card_tag') {
        return (
            <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-bold text-amber-400 font-mono",
                className
            )}>
                <Eye className="w-2.5 h-2.5 text-amber-400" />
                <span>{formattedViewerCount}</span>
            </span>
        );
    }

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm backdrop-blur-md font-sans",
            className
        )}>
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-white font-extrabold">{formattedViewerCount}</span>
            <span className="text-[11px] text-slate-300 font-normal">คนรับชมสด</span>
        </div>
    );
}
