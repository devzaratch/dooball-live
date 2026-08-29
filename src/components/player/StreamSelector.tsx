'use client';

import { useState } from 'react';
import { PlayCircle, Tv, Signal, Flag } from 'lucide-react';

export interface StreamLink {
    id: string;
    label: string;
    url: string;
}

interface StreamSelectorProps {
    streams: StreamLink[];
    onSelectStream?: (stream: StreamLink) => void;
    activeStreamId?: string;
    onReportStream?: () => void;
}

export default function StreamSelector({ streams, onSelectStream, activeStreamId, onReportStream }: StreamSelectorProps) {
    const [selectedId, setSelectedId] = useState<string>(activeStreamId || streams[0]?.id);

    const handleSelect = (stream: StreamLink) => {
        setSelectedId(stream.id);
        onSelectStream?.(stream);
    };

    if (!streams || streams.length === 0) return null;

    return (
        <div className="bg-[#0B0F17]/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl space-y-3 font-sans">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-[#E5B842]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        เลือกช่องสัญญาณถ่ายทอดสด
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {onReportStream && (
                        <button
                            type="button"
                            onClick={onReportStream}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                            title="แจ้งเตือนเมื่อสัญญาณภาพกระตุก หรือ ลิงก์เสีย"
                        >
                            <Flag className="w-3 h-3 text-rose-400" />
                            <span>แจ้งสัญญาณเสีย</span>
                        </button>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                        <Signal className="w-3 h-3 animate-pulse" />
                        สัญญาณเสถียร HD
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {streams.map((stream) => {
                    const isActive = selectedId === stream.id;

                    return (
                        <button
                            key={stream.id}
                            onClick={() => handleSelect(stream)}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${isActive
                                ? 'bg-gradient-to-r from-[#E5B842] to-[#d4a737] text-black border-[#E5B842] shadow-[0_0_15px_rgba(229,184,66,0.3)] font-bold scale-[1.02]'
                                : 'bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.07] hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <PlayCircle className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-[#E5B842]'}`} />
                            <span className="truncate">{stream.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}