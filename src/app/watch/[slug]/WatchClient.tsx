'use client';

import { useState, useEffect } from 'react';
import { useRealtimeMatches } from '@/hooks/useRealtimeMatches';
import MatchSidebar from '@/components/layout/MatchSidebar';
import VideoPlayer from '@/components/player/VideoPlayer';
import StreamSelector, { StreamLink } from '@/components/player/StreamSelector';
import LiveChat from '@/components/LiveChat';
import AdBanner from '@/components/ads/AdBanner';
import MatchPrediction from '@/components/watch/MatchPrediction';
import MatchLineups from '@/components/watch/MatchLineups';
import MatchEventsTimeline from '@/components/watch/MatchEventsTimeline';
import SeoMatchPreview from '@/components/watch/SeoMatchPreview';
import SocialShareBar from '@/components/common/SocialShareBar';
import LiveViewerBadge from '@/components/common/LiveViewerBadge';
import { Radio, Clock, ShieldAlert, Film, Sparkles } from 'lucide-react';

export default function WatchClient({ slug }: { slug: string }) {
    const { matches = [] } = useRealtimeMatches([]) || {};
    const [activeStream, setActiveStream] = useState<StreamLink | null>(null);

    const decodedSlug = decodeURIComponent(slug);
    const currentMatch = matches.find((m) => 
        m.id === slug || 
        m.slug === slug || 
        m.id === decodedSlug || 
        m.slug === decodedSlug ||
        m.slug?.toLowerCase() === decodedSlug.toLowerCase()
    ) || (matches.length > 0 ? matches[0] : null);

    const isLive = currentMatch?.status === 'LIVE';

    useEffect(() => {
        if (currentMatch?.streamLinks && currentMatch.streamLinks.length > 0) {
            if (!activeStream || !currentMatch?.streamLinks?.some((s) => s.id === activeStream.id)) {
                setActiveStream(currentMatch.streamLinks[0]);
            }
        } else {
            setActiveStream(null);
        }
    }, [currentMatch, activeStream]);

    const handleAutoFallback = () => {
        if (!currentMatch?.streamLinks || currentMatch.streamLinks.length <= 1) return;
        const currentIndex = currentMatch.streamLinks.findIndex((s) => s.id === activeStream?.id);
        const nextIndex = (currentIndex + 1) % currentMatch.streamLinks.length;
        if (nextIndex !== currentIndex && currentMatch.streamLinks[nextIndex]) {
            console.log(`Auto-fallback switching stream to Server ${nextIndex + 1}`);
            setActiveStream(currentMatch.streamLinks[nextIndex]);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-5 p-3 md:p-6 pb-20 md:pb-6 max-w-[1600px] mx-auto min-h-screen font-sans">

            {/* ====== Left Sidebar (Match List) ====== */}
            <div className="order-3 lg:order-1 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-48px)] overflow-hidden">
                <MatchSidebar
                    matches={matches}
                    activeSlug={slug}
                />
            </div>

            {/* ====== Center Content (Scoreboard + Video + Stream Selector) ====== */}
            <div className="order-1 lg:order-2 flex flex-col gap-5 min-w-0">
                {currentMatch ? (
                    <>
                        {/* Hero Scoreboard */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-[#0B0F17] border border-white/10 p-5 shadow-2xl backdrop-blur-xl">
                            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#E5B842]/10 blur-[60px] pointer-events-none rounded-full" />
                            {isLive && (
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />
                            )}

                            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5 flex-1 sm:justify-end text-left sm:text-right w-full">
                                    <div className="truncate order-2 sm:order-1">
                                        <h2 className="text-sm sm:text-base font-bold text-slate-100 tracking-wide truncate">
                                            {currentMatch.homeTeam?.name ?? 'ทีมเหย้า'}
                                        </h2>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">ทีมเหย้า</span>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-inner shrink-0 overflow-hidden order-1 sm:order-2">
                                        {currentMatch.homeTeam?.logo ? (
                                            <img src={currentMatch.homeTeam.logo} alt="" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-xs font-bold text-slate-400">H</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 min-w-[90px]">
                                    {isLive || currentMatch.status === 'FINISHED' || (currentMatch.homeTeam?.score !== '-' && currentMatch.homeTeam?.score !== '?' && currentMatch.homeTeam?.score !== undefined) ? (
                                        <div className="flex items-center gap-2 font-mono">
                                            <span className="text-2xl sm:text-3xl font-black text-[#E5B842]">
                                                {currentMatch.homeTeam?.score ?? 0}
                                            </span>
                                            <span className="text-slate-500 font-bold">:</span>
                                            <span className="text-2xl sm:text-3xl font-black text-[#E5B842]">
                                                {currentMatch.awayTeam?.score ?? 0}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-lg font-black font-mono text-slate-500 my-0.5">VS</span>
                                    )}
                                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
                                        {isLive ? (
                                            <>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20 animate-pulse">
                                                    <Radio className="w-3 h-3 text-rose-500" />
                                                    LIVE NOW
                                                </span>
                                                <LiveViewerBadge matchId={currentMatch.id} isLive={isLive} variant="badge" />
                                            </>
                                        ) : currentMatch.status === 'FINISHED' ? (
                                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold border border-white/5">
                                                จบการแข่งขัน
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                                                <Clock className="w-3 h-3" />
                                                {currentMatch.kickoffTime ?? 'รอเริ่มการแข่งขัน'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3.5 flex-1 justify-start text-left w-full">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-inner shrink-0 overflow-hidden">
                                        {currentMatch.awayTeam?.logo ? (
                                            <img src={currentMatch.awayTeam.logo} alt="" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-xs font-bold text-slate-400">A</span>
                                        )}
                                    </div>
                                    <div className="truncate">
                                        <h2 className="text-sm sm:text-base font-bold text-slate-100 tracking-wide truncate">
                                            {currentMatch.awayTeam?.name ?? 'ทีมเยือน'}
                                        </h2>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">ทีมเยือน</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Video Player */}
                        <VideoPlayer 
                            streamUrl={activeStream?.url} 
                            onAutoFallback={handleAutoFallback}
                        />

                        {/* Stream Selector */}
                        {currentMatch.streamLinks && currentMatch.streamLinks.length > 0 && (
                            <StreamSelector
                                streams={currentMatch.streamLinks}
                                activeStreamId={activeStream?.id}
                                onSelectStream={(stream) => setActiveStream(stream)}
                            />
                        )}

                        {/* Match Live Events Timeline */}
                        <MatchEventsTimeline
                            events={currentMatch.events}
                            homeTeamName={currentMatch.homeTeam?.name}
                            awayTeamName={currentMatch.awayTeam?.name}
                        />

                        {/* 1-Click Social Share Bar (LINE / Facebook / Messenger / X) */}
                        <SocialShareBar 
                            title={`ถ่ายทอดสดบอล ${currentMatch.homeTeam?.name} พบ ${currentMatch.awayTeam?.name} (${currentMatch.league?.name || 'DoBallLaos'})`}
                        />

                        {/* Match Highlight Video Replay (ไฮไลท์ฟุตบอลย้อนหลัง HD) */}
                        <div className="flex flex-col gap-3 p-5 rounded-3xl bg-[#0B0F17]/90 border border-white/10 backdrop-blur-xl shadow-xl font-sans">
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                                        <Film className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-sm md:text-base text-slate-100 flex items-center gap-2">
                                            ไฮไลท์ฟุตบอลย้อนหลัง HD (Match Highlights & Goal Replay)
                                            <Sparkles className="w-4 h-4 text-amber-400" />
                                        </h3>
                                        <p className="text-[11px] text-slate-400">ชมประตูสำคัญและการแข่งขันย้อนหลังแบบเต็มอิ่ม</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                    Full HD 1080p
                                </span>
                            </div>

                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
                                <iframe
                                    src={`https://www.youtube.com/embed/${(currentMatch as any).highlightVideoId || 'b3Ge5NUbI2o'}?rel=0`}
                                    title={`ไฮไลท์ ${currentMatch.homeTeam?.name} พบ ${currentMatch.awayTeam?.name}`}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>

                        {/* Starting 11 Lineups & Tactical Pitch View */}
                        <MatchLineups match={currentMatch} />

                        {/* Match Prediction Poll */}
                        <MatchPrediction match={currentMatch} />

                        {/* SEO Match Preview & H2H Statistical Box */}
                        <SeoMatchPreview match={currentMatch} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-[#0B0F17]/60 border border-white/10 rounded-2xl backdrop-blur-xl text-center px-4">
                        <ShieldAlert className="w-12 h-12 text-slate-500 mb-3 animate-bounce" />
                        <h3 className="text-base font-bold text-slate-200 mb-1">ไม่พบข้อมูลการแข่งขัน</h3>
                        <p className="text-xs text-slate-400 max-w-sm">กำลังโหลดข้อมูล...</p>
                    </div>
                )}
            </div>

            {/* ====== Right Sidebar (Live Chat) ====== */}
            <aside className="order-2 lg:order-3 lg:sticky lg:top-6 lg:self-start h-[500px] lg:h-[calc(100vh-48px)]">
                <LiveChat 
                    matchId={currentMatch?.id ?? slug}
                    homeTeamName={currentMatch?.homeTeam?.name}
                    awayTeamName={currentMatch?.awayTeam?.name}
                />
            </aside>

        </div>
    );
}