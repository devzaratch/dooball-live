'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRealtimeMatches } from '@/hooks/useRealtimeMatches';
import MatchSidebar from '@/components/layout/MatchSidebar';
import VideoPlayer from '@/components/player/VideoPlayer';
import StreamSelector, { StreamLink } from '@/components/player/StreamSelector';
import LiveChat from '@/components/chat/LiveChat';
import SocialShareBar from '@/components/common/SocialShareBar';
import LiveViewerBadge from '@/components/common/LiveViewerBadge';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getMatchRoomKey, cn } from '@/lib/utils';
import { Radio, Clock, ShieldAlert, Film, Sparkles, MessageSquare, BarChart2, Tv, Trophy } from 'lucide-react';

const MatchStats = dynamic(() => import('@/components/watch/MatchStats'), { ssr: false });
const MatchPrediction = dynamic(() => import('@/components/watch/MatchPrediction'), { ssr: false });
const MatchLineups = dynamic(() => import('@/components/watch/MatchLineups'), { ssr: false });
const MatchEventsTimeline = dynamic(() => import('@/components/watch/MatchEventsTimeline'), { ssr: false });
const SeoMatchPreview = dynamic(() => import('@/components/watch/SeoMatchPreview'), { ssr: false });
const ReportStreamModal = dynamic(() => import('@/components/player/ReportStreamModal'), { ssr: false });
const MatchCardGenerator = dynamic(() => import('@/components/common/MatchCardGenerator'), { ssr: false });
const PlayerOfMatchModal = dynamic(() => import('@/components/watch/PlayerOfMatchModal'), { ssr: false });

type MobileTab = 'CHAT' | 'STATS' | 'MATCHES' | 'INFO';

export default function WatchClient({ slug }: { slug: string }) {
    const { matches = [], loading } = useRealtimeMatches([]) || {};
    const [activeStream, setActiveStream] = useState<StreamLink | null>(null);
    const [adminBackupStream, setAdminBackupStream] = useState<StreamLink | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isPotmModalOpen, setIsPotmModalOpen] = useState(false);
    const [mobileTab, setMobileTab] = useState<MobileTab>('CHAT');

    const decodedSlug = decodeURIComponent(slug);
    const foundMatch = matches.find((m) => 
        m.id === slug || 
        m.slug === slug || 
        m.id === decodedSlug || 
        m.slug === decodedSlug ||
        m.slug?.toLowerCase() === decodedSlug.toLowerCase()
    ) || null;
    // ถ้าโหลดเสร็จแล้วยังหาไม่เจอ = ไม่มีแมตช์นี้จริง (ห้าม fallback ไปแมตช์แรก เพราะทำให้หน้า 404 ไม่เคยแสดง)
    const currentMatch = foundMatch;

    const isLive = currentMatch?.status === 'LIVE';
    // ไฮไลท์ของคู่นี้ (ถ้าไม่มีจะแสดงปุ่มพาไปหน้า /highlights แทน ไม่เอาคลิปอื่นมาปน)
    const highlightVideoId = (currentMatch as { highlightVideoId?: string } | null)?.highlightVideoId || '';

    // รับการอัปเดตช่องสำรองเฉพาะกิจแบบ Real-time จาก Admin Operations Room
    useEffect(() => {
        if (!currentMatch) return;
        const matchRoomKey = getMatchRoomKey(currentMatch);
        const backupRef = ref(db, `backup_streams/${matchRoomKey}`);
        const unsubscribe = onValue(backupRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.url) {
                setAdminBackupStream({
                    id: data.id || 'server-backup-kqt',
                    label: data.label || 'ช่องสำรอง 2',
                    url: data.url,
                    quality: data.quality || '1080p'
                });
            } else {
                setAdminBackupStream(null);
            }
        });
        return () => unsubscribe();
    }, [currentMatch]);

    // รวม streamLinks ปกติ และช่องสำรองสดจาก Admin
    const effectiveStreamLinks = useMemo(() => {
        const list = (currentMatch?.streamLinks ? [...currentMatch.streamLinks] : [])
            .filter((s) => s && s.url && s.url !== '#' && s.url.trim() !== '');

        // หากยังไม่มี streamLinks แต่มี currentMatch.link จากฐานข้อมูล ให้ใช้เป็นลิงก์หลักอัตโนมัติ
        if (list.length === 0 && currentMatch?.link && currentMatch.link !== '#' && currentMatch.link.trim() !== '') {
            list.push({
                id: 'stream-main-fallback',
                label: 'ลิงก์ถ่ายทอดสดหลัก (HD)',
                url: currentMatch.link.trim(),
                quality: '1080p',
            });
        }

        if (adminBackupStream && adminBackupStream.url && adminBackupStream.url !== '#') {
            const backupIndex = list.findIndex(
                (s) => s.id === adminBackupStream.id || s.label.includes('สำรอง') || s.url.includes('domainkqt')
            );
            if (backupIndex !== -1) {
                list[backupIndex] = adminBackupStream;
            } else {
                list.push(adminBackupStream);
            }
        }
        return list;
    }, [currentMatch, adminBackupStream]);

    useEffect(() => {
        if (effectiveStreamLinks && effectiveStreamLinks.length > 0) {
            if (!activeStream || !effectiveStreamLinks.some((s) => s.id === activeStream.id)) {
                queueMicrotask(() => setActiveStream(effectiveStreamLinks[0]));
            } else {
                const currentUpdated = effectiveStreamLinks.find((s) => s.id === activeStream.id);
                if (currentUpdated && currentUpdated.url !== activeStream.url) {
                    queueMicrotask(() => setActiveStream(currentUpdated));
                }
            }
        } else {
            queueMicrotask(() => setActiveStream(null));
        }
    }, [effectiveStreamLinks, activeStream]);

    // รับการอัปเดตลิงก์สตรีมด่วนแบบ Real-time จาก Admin Operations Room (กรณีแทนที่ลิงก์เดิม)
    useEffect(() => {
        if (!currentMatch) return;
        const matchRoomKey = getMatchRoomKey(currentMatch);
        const overridesRef = ref(db, `stream_overrides/${matchRoomKey}`);
        const unsubscribe = onValue(overridesRef, (snapshot) => {
            const overrides = snapshot.val();
            if (overrides && activeStream && overrides[activeStream.id]?.url) {
                const newUrl = overrides[activeStream.id].url;
                if (newUrl && newUrl !== activeStream.url) {
                    console.log(`Admin dynamically replaced stream URL for ${activeStream.id}`);
                    setActiveStream((prev) => prev ? { ...prev, url: newUrl } : prev);
                }
            }
        });
        return () => unsubscribe();
    }, [currentMatch, activeStream]);

    const handleAutoFallback = () => {
        if (!effectiveStreamLinks || effectiveStreamLinks.length <= 1) return;
        const currentIndex = effectiveStreamLinks.findIndex((s) => s.id === activeStream?.id);
        const nextIndex = (currentIndex + 1) % effectiveStreamLinks.length;
        if (nextIndex !== currentIndex && effectiveStreamLinks[nextIndex]) {
            console.log(`Auto-fallback switching stream to Server ${nextIndex + 1}`);
            setActiveStream(effectiveStreamLinks[nextIndex]);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-5 p-3 md:p-6 pb-24 md:pb-6 max-w-[1600px] mx-auto min-h-screen font-sans">

            {/* ====== Left Sidebar (Desktop Match List) ====== */}
            <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-48px)] overflow-hidden">
                <MatchSidebar
                    matches={matches}
                    activeSlug={slug}
                />
            </div>

            {/* ====== Center Main Content (Scoreboard + Video + Stream Selector) ====== */}
            <div className="flex flex-col gap-5 min-w-0">
                {currentMatch ? (
                    <>
                        {/* Hero Scoreboard */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-[#0B0F17] border border-white/10 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
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
                            onReportStream={() => setIsReportModalOpen(true)}
                        />

                        {/* Stream Selector */}
                        {effectiveStreamLinks && effectiveStreamLinks.length > 0 && (
                            <StreamSelector
                                streams={effectiveStreamLinks}
                                activeStreamId={activeStream?.id}
                                onSelectStream={(stream) => setActiveStream(stream)}
                                onReportStream={() => setIsReportModalOpen(true)}
                            />
                        )}

                        {/* Match Live Events Timeline */}
                        <MatchEventsTimeline
                            events={currentMatch.events}
                            homeTeamName={currentMatch.homeTeam?.name}
                            awayTeamName={currentMatch.awayTeam?.name}
                        />

                        {/* 1-Click Social Share Bar & Viral Match Story Card Trigger */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0B0F17]/90 border border-white/10 backdrop-blur-xl">
                            <SocialShareBar 
                                title={`ถ่ายทอดสดบอล ${currentMatch.homeTeam?.name} พบ ${currentMatch.awayTeam?.name} (${currentMatch.league?.name || 'DoBallLaos'})`}
                                className="flex-1"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsCardModalOpen(true)}
                                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                                    title="สร้างรูปภาพการ์ดผลบอลสำหรับแชร์"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    <span>การ์ดผลบอล Story</span>
                                </button>
                                <button
                                    onClick={() => setIsPotmModalOpen(true)}
                                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                                    title="โหวตนักเตะยอดเยี่ยมประจำแมตช์"
                                >
                                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                    <span>โหวต Man of Match</span>
                                </button>
                            </div>
                        </div>

                        {/* ====== MOBILE TAB SWITCHER BAR (Visible on Mobile < 1024px) ====== */}
                        <div className="lg:hidden flex items-center gap-1.5 p-1.5 bg-[#0B0F17]/95 border border-white/10 rounded-2xl backdrop-blur-xl shadow-xl sticky top-2 z-30">
                            <button
                                onClick={() => setMobileTab('CHAT')}
                                className={cn(
                                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                    mobileTab === 'CHAT' ? "bg-[#E5B842] text-black shadow-md font-black" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>แชทสด</span>
                            </button>
                            <button
                                onClick={() => setMobileTab('STATS')}
                                className={cn(
                                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                    mobileTab === 'STATS' ? "bg-[#E5B842] text-black shadow-md font-black" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <BarChart2 className="w-3.5 h-3.5" />
                                <span>สถิติ/11ตัวจริง</span>
                            </button>
                            <button
                                onClick={() => setMobileTab('MATCHES')}
                                className={cn(
                                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                    mobileTab === 'MATCHES' ? "bg-[#E5B842] text-black shadow-md font-black" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Tv className="w-3.5 h-3.5" />
                                <span>คู่อื่น</span>
                            </button>
                            <button
                                onClick={() => setMobileTab('INFO')}
                                className={cn(
                                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                    mobileTab === 'INFO' ? "bg-[#E5B842] text-black shadow-md font-black" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>ทายผล</span>
                            </button>
                        </div>

                        {/* ====== MOBILE TAB CONTENT RENDERING (Only active tab visible on mobile) ====== */}
                        <div className="lg:hidden flex flex-col gap-5">
                            {mobileTab === 'CHAT' && (
                                <div className="h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                                    <LiveChat 
                                        matchId={getMatchRoomKey(currentMatch || slug)}
                                        homeTeamName={currentMatch?.homeTeam?.name}
                                        awayTeamName={currentMatch?.awayTeam?.name}
                                    />
                                </div>
                            )}

                            {mobileTab === 'STATS' && (
                                <div className="flex flex-col gap-5">
                                    <MatchStats match={currentMatch} />
                                    <MatchLineups match={currentMatch} />
                                </div>
                            )}

                            {mobileTab === 'MATCHES' && (
                                <div>
                                    <MatchSidebar
                                        matches={matches}
                                        activeSlug={slug}
                                    />
                                </div>
                            )}

                            {mobileTab === 'INFO' && (
                                <div className="flex flex-col gap-5">
                                    <MatchPrediction match={currentMatch} />
                                    
                                    {/* Match Highlight Video Replay */}
                                    <div className="flex flex-col gap-3 p-5 rounded-3xl bg-[#0B0F17]/90 border border-white/10 backdrop-blur-xl shadow-xl font-sans">
                                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                                                    <Film className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                                                        ไฮไลท์ฟุตบอล HD
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
                                            {highlightVideoId ? (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${highlightVideoId}?rel=0`}
                                                    title={`ไฮไลท์ ${currentMatch.homeTeam?.name} พบ ${currentMatch.awayTeam?.name}`}
                                                    className="w-full h-full border-0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-4">
                                                    <Film className="w-8 h-8 text-slate-600" />
                                                    <p className="text-xs text-slate-400">คู่นี้ยังไม่มีคลิปไฮไลท์</p>
                                                    <Link href="/highlights" className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold hover:bg-rose-500/30 transition-colors">
                                                        ดูไฮไลท์คู่อื่น
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <SeoMatchPreview match={currentMatch} />
                                </div>
                            )}
                        </div>

                        {/* ====== DESKTOP COMPONENT STACK (Always visible on Desktop >= 1024px) ====== */}
                        <div className="hidden lg:flex flex-col gap-5">
                            {/* Live Match Stats & H2H */}
                            <MatchStats match={currentMatch} />

                            {/* Starting 11 Lineups & Tactical Pitch View */}
                            <MatchLineups match={currentMatch} />

                            {/* Match Prediction Poll */}
                            <MatchPrediction match={currentMatch} />

                            {/* Match Highlight Video Replay */}
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
                                    {highlightVideoId ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${highlightVideoId}?rel=0`}
                                            title={`ไฮไลท์ ${currentMatch.homeTeam?.name} พบ ${currentMatch.awayTeam?.name}`}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-4">
                                            <Film className="w-8 h-8 text-slate-600" />
                                            <p className="text-xs text-slate-400">คู่นี้ยังไม่มีคลิปไฮไลท์</p>
                                            <Link href="/highlights" className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold hover:bg-rose-500/30 transition-colors">
                                                ดูไฮไลท์คู่อื่น
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SEO Match Preview & H2H Statistical Box */}
                            <SeoMatchPreview match={currentMatch} />
                        </div>
                    </>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-[#0B0F17]/60 border border-white/10 rounded-2xl backdrop-blur-xl text-center px-4">
                        <ShieldAlert className="w-12 h-12 text-slate-500 mb-3 animate-bounce" />
                        <h3 className="text-base font-bold text-slate-200 mb-1">กำลังโหลดข้อมูลการแข่งขัน...</h3>
                        <p className="text-xs text-slate-400 max-w-sm">กรุณารอสักครู่</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-[#0B0F17]/60 border border-white/10 rounded-2xl backdrop-blur-xl text-center px-4">
                        <ShieldAlert className="w-12 h-12 text-slate-500 mb-3" />
                        <h3 className="text-base font-bold text-slate-200 mb-1">ไม่พบคู่แข่งขันนี้ (404)</h3>
                        <p className="text-xs text-slate-400 max-w-sm mb-4">ลิงก์อาจหมดอายุหรือแมตช์ถูกลบออกแล้ว</p>
                        <Link href="/" className="px-5 py-2.5 rounded-xl bg-[#E5B842] text-black text-xs font-bold hover:bg-[#f3c853] transition-colors">
                            กลับหน้าแรก
                        </Link>
                    </div>
                )}
            </div>

            {/* ====== Right Sidebar (Desktop Live Chat) ====== */}
            <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start h-[calc(100vh-48px)]">
                <LiveChat 
                    matchId={getMatchRoomKey(currentMatch || slug)}
                    homeTeamName={currentMatch?.homeTeam?.name}
                    awayTeamName={currentMatch?.awayTeam?.name}
                />
            </aside>

            {/* Report Broken Stream Modal */}
            <ReportStreamModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                matchId={getMatchRoomKey(currentMatch || slug)}
                matchName={currentMatch ? `${currentMatch.homeTeam?.name || ''} vs ${currentMatch.awayTeam?.name || ''}` : 'ถ่ายทอดสดฟุตบอล'}
                activeStream={activeStream}
            />

            {/* Match Story Card Generator Modal */}
            {currentMatch && (
                <MatchCardGenerator
                    match={currentMatch}
                    isOpen={isCardModalOpen}
                    onClose={() => setIsCardModalOpen(false)}
                />
            )}

            {/* Player of the Match Voting Modal */}
            {currentMatch && (
                <PlayerOfMatchModal
                    match={currentMatch}
                    isOpen={isPotmModalOpen}
                    onClose={() => setIsPotmModalOpen(false)}
                />
            )}

        </div>
    );
}