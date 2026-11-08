'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
// mpegts.js ใช้ type-only import เนื่องจาก dist ของมันอ้าง global `self` ตั้งแต่ module scope
// ถ้าเรียก import จริงตั้งแต่ต้นไฟล์จะพังตอน SSR ("self is not defined") — ต้อง dynamic import ฝั่ง browser เท่านั้น
import type mpegts from 'mpegts.js';
import {
    AlertCircle, Loader2, RefreshCw, Tv, PictureInPicture, Flag,
    Lock, Unlock, RotateCcw, RotateCw, Maximize, Minimize, X,
    ChevronUp, Sparkles, Volume2, VolumeX, Clapperboard, Settings
} from 'lucide-react';
import LiveViewerBadge from '@/components/common/LiveViewerBadge';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
    streamUrl?: string;
    poster?: string;
    matchSlug?: string;
    onAutoFallback?: () => void;
    onReportStream?: () => void;
}

export default function VideoPlayer({ streamUrl, poster, matchSlug, onAutoFallback, onReportStream }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const mpegtsRef = useRef<mpegts.MSEPlayer | null>(null);
    const fatalErrorCountRef = useRef<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [isPipSupported, setIsPipSupported] = useState(false);
    const [isPipActive, setIsPipActive] = useState(false);
    const [isScreenLocked, setIsScreenLocked] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isScrolledOffScreen, setIsScrolledOffScreen] = useState(false);
    const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState(false);
    const [seekFeedback, setSeekFeedback] = useState<{ direction: 'left' | 'right'; seconds: number } | null>(null);
    const [qualityLevels, setQualityLevels] = useState<Array<{ index: number; height: number; label: string }>>([]);
    const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = Auto
    const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
    const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
    const seekTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleSelectQuality = (levelIndex: number) => {
        setSelectedQuality(levelIndex);
        if (hlsRef.current) {
            hlsRef.current.currentLevel = levelIndex;
        }
        setIsQualityMenuOpen(false);
    };

    // 1. ตรวจสอบการรองรับ Picture-in-Picture
    useEffect(() => {
        if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled) {
            queueMicrotask(() => setIsPipSupported(true));
        }
    }, []);

    // 2. ป้องกันหน้าจอดับเองระหว่างรับชม (Web Screen Wake Lock API)
    useEffect(() => {
        let wakeLock: { release: () => Promise<void> } | null = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen');
                }
            } catch { }
        };

        requestWakeLock();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock) {
                wakeLock.release().catch(() => { });
            }
        };
    }, []);

    // 3. IntersectionObserver สำหรับตรวจจับ Floating Mini Player เมื่อผู้ใช้เลื่อนลงด้านล่าง
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // ถ้าเครื่องเล่นหลุดจากสายตาไปด้านบนมากกว่า 80%
                if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                    setIsScrolledOffScreen(true);
                } else {
                    setIsScrolledOffScreen(false);
                    setIsMiniPlayerDismissed(false); // รีเซ็ตการซ่อนเมื่อเลื่อนกลับมา
                }
            },
            { threshold: [0, 0.2] }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const togglePip = async () => {
        if (!videoRef.current) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPipActive(false);
            } else {
                await videoRef.current.requestPictureInPicture();
                setIsPipActive(true);
            }
        } catch (err) {
            console.error('Picture in Picture failed:', err);
        }
    };

    const [isResolvingStream, setIsResolvingStream] = useState(false);
    const [resolvedFromPageUrl, setResolvedFromPageUrl] = useState<string | null>(null);

    // ช่วยแกะ src ออกจาก string กรณีที่ Backend ส่งมาเป็น <iframe src="...">
    const getCleanUrl = useCallback((url?: string) => {
        if (!url) return '';
        if (url.includes('<iframe')) {
            const match = url.match(/src=["']([^"']+)["']/);
            return match ? match[1] : url;
        }
        return url.trim();
    }, []);

    const rawCleanUrl = getCleanUrl(streamUrl);

    // ตรวจจับว่า URL ที่ได้มาเป็นหน้า fixture (เช่น dooball99.top/fixtures/...) หรือไม่ เพื่อแกะ M3U8 อัตโนมัติ
    useEffect(() => {
        if (!rawCleanUrl || rawCleanUrl === '#') {
            queueMicrotask(() => setResolvedFromPageUrl(null));
            return;
        }

        const isFixturePage = rawCleanUrl.includes('dooball99.top/fixtures/') || rawCleanUrl.includes('/fixtures/');
        if (isFixturePage) {
            let isCancelled = false;
            setIsResolvingStream(true);

            fetch(`/api/stream/resolve?url=${encodeURIComponent(rawCleanUrl)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (!isCancelled) {
                        if (data && data.success && data.streamUrl) {
                            setResolvedFromPageUrl(data.streamUrl);
                        } else {
                            // Fallback: ถ้าแกะ M3U8 ไม่ได้ให้ใช้ URL เดิม
                            setResolvedFromPageUrl(rawCleanUrl);
                        }
                    }
                })
                .catch(() => {
                    if (!isCancelled) {
                        setResolvedFromPageUrl(rawCleanUrl);
                    }
                })
                .finally(() => {
                    if (!isCancelled) {
                        setIsResolvingStream(false);
                    }
                });

            return () => {
                isCancelled = true;
            };
        } else {
            setResolvedFromPageUrl(null);
            setIsResolvingStream(false);
        }
    }, [rawCleanUrl]);

    // เลือกระหว่าง URL ที่แกะเสร็จแล้ว หรือ URL ดั้งเดิม
    const cleanUrl = resolvedFromPageUrl || rawCleanUrl;

    // ตรวจสอบและแปลงลิงก์ที่ติด Anti-Hotlink (เช่น domainkqt.cc, .flv, หรือ *.sbs) ให้ผ่าน Stream Proxy อัตโนมัติ
    const rawIsFlv = cleanUrl.includes('.flv') && !cleanUrl.includes('.m3u8');
    const resolvedUrl = (cleanUrl.includes('domainkqt.cc') || cleanUrl.includes('.flv') || cleanUrl.includes('.sbs') || cleanUrl.includes('do-ball.com')) && !cleanUrl.startsWith('/api/proxy/stream')
        ? `/api/proxy/stream?url=${encodeURIComponent(cleanUrl)}${rawIsFlv ? '&raw=true' : ''}`
        : cleanUrl;

    // หมายเหตุ: ต้องเช็คจากลิงก์ต้นทาง (cleanUrl) ไม่ใช่ resolvedUrl เพราะหลังถูก encode ผ่าน proxy แล้ว ".flv" ยังค้างอยู่ใน query ทำให้แยกแยะไม่ได้
    const isHls = !rawIsFlv && (resolvedUrl.includes('.m3u8') || resolvedUrl.includes('/api/proxy/stream') || resolvedUrl.includes('playlist'));
    const isEmbed = !isHls && (
        resolvedUrl.includes('youtube.com') ||
        resolvedUrl.includes('youtu.be') ||
        resolvedUrl.includes('embed') ||
        resolvedUrl.includes('player') ||
        (resolvedUrl.startsWith('http') && !resolvedUrl.match(/\.(mp4|webm|ogg)$/i))
    );

    const handleRetry = () => {
        setHasError(false);
        setIsLoading(true);
        setReloadKey((prev) => prev + 1);
    };

    // 4. Double-Tap Seek (แตะ 2 ครั้ง กรอเวลา 10 วินาที ซ้าย/ขวา)
    const lastTapTimeRef = useRef<number>(0);
    const handleContainerTouchOrClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (isEmbed || isScreenLocked) return;

        const now = lastTapTimeRef.current;
        lastTapTimeRef.current = performance.now();
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        let clientX = 0;
        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else if ('clientX' in e) {
            clientX = e.clientX;
        }

        const relativeX = clientX - rect.left;
        const isLeftHalf = relativeX < rect.width / 2;

        // ตรวจสอบว่าเป็น Double Tap (ระยะเวลาห่างกันไม่เกิน 300ms และตำแหน่งใกล้เคียงกัน)
        if (now - lastTapRef.current.time < 300 && Math.abs(clientX - lastTapRef.current.x) < 80) {
            const video = videoRef.current;
            if (video) {
                if (isLeftHalf) {
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    showSeekFeedback('left', 10);
                } else {
                    video.currentTime = video.currentTime + 10;
                    showSeekFeedback('right', 10);
                }
            }
            lastTapRef.current = { time: 0, x: 0 };
        } else {
            lastTapRef.current = { time: now, x: clientX };
        }
    };

    const showSeekFeedback = (direction: 'left' | 'right', seconds: number) => {
        if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
        setSeekFeedback({ direction, seconds });
        seekTimerRef.current = setTimeout(() => {
            setSeekFeedback(null);
        }, 850);
    };

    const scrollToPlayer = () => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    useEffect(() => {
        fatalErrorCountRef.current = 0;

        if (!resolvedUrl) {
            queueMicrotask(() => {
                setIsLoading(false);
                setHasError(false);
                setQualityLevels([]);
                setSelectedQuality(-1);
            });
            return;
        }

        queueMicrotask(() => {
            setIsLoading(true);
            setHasError(false);
            setQualityLevels([]);
            setSelectedQuality(-1);
        });

        if (isEmbed) {
            return;
        }

        let hls: Hls | null = null;
        const video = videoRef.current;

        // 🎞️ สายพันธุ์ FLV (live HTTP-FLV): hls.js แปลงไฟล์ FLV ไม่ได้ — ต้องใช้ mpegts.js แปลง FLV→fMP4 ผ่าน MSE
        // (dynamic import เพราะ mpegts.js อ้าง global `self` ตั้งแต่ module scope — import ลอยหัวไฟล์จะพังตอน SSR)
        if (rawIsFlv && video) {
            let disposed = false;

            import('mpegts.js')
                .then(({ default: mpegts }) => {
                    if (disposed) return;

                    // MSE ไม่มี (เช่น iOS Safari) → ไม่มีวิธีถอดรหัส FLV ในเบราว์เซอร์นี้ ให้หน้า fallback จัดการ
                    if (!mpegts.isSupported()) {
                        queueMicrotask(() => {
                            setIsLoading(false);
                            setHasError(true);
                        });
                        return;
                    }

                    if (mpegtsRef.current) {
                        mpegtsRef.current.destroy();
                        mpegtsRef.current = null;
                    }

                    const mts = mpegts.createPlayer(
                        {
                            type: 'flv',
                            isLive: true,
                            cors: true,
                            url: resolvedUrl,
                        },
                        {
                            enableStashBuffer: false,
                            liveBufferLatencyChasing: true,
                            lazyLoad: false,
                            autoCleanupSourceBuffer: true,
                        }
                    ) as mpegts.MSEPlayer; // isSupported() gate ข้างบนการันตี MSE path แล้ว
                    mpegtsRef.current = mts;

                    mts.on(mpegts.Events.MEDIA_INFO, () => {
                        setIsLoading(false);
                        video.play().catch(() => { });
                    });

                    mts.on(mpegts.Events.ERROR, (errType: string) => {
                        fatalErrorCountRef.current += 1;
                        if (fatalErrorCountRef.current < 3 && (errType === mpegts.ErrorTypes.NETWORK_ERROR || errType === mpegts.ErrorTypes.OTHER_ERROR)) {
                            // สัญญาณหลุดชั่ววูบ (เช่น CDN เร่เซ็น key) — พยายาม reconnect ก่อนยอมแพ้
                            try {
                                mts.unload();
                                mts.load();
                                video.play().catch(() => { });
                            } catch {
                                /* reconnect พัง → ให้ตัวนับ error นับต่อในรอบถัดไป */
                            }
                            return;
                        }

                        if (fatalErrorCountRef.current >= 3) {
                            setHasError(true);
                            setIsLoading(false);
                            mts.destroy();
                            mpegtsRef.current = null;
                            onAutoFallback?.();
                        }
                    });

                    mts.attachMediaElement(video);
                    mts.load();
                })
                .catch(() => {
                    if (!disposed) {
                        queueMicrotask(() => {
                            setIsLoading(false);
                            setHasError(true);
                        });
                    }
                });

            return () => {
                disposed = true;
                if (mpegtsRef.current) {
                    mpegtsRef.current.destroy();
                    mpegtsRef.current = null;
                }
            };
        } else if (isHls && video) {
            if (Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                });
                hlsRef.current = hls;

                hls.loadSource(resolvedUrl);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                    setIsLoading(false);
                    video.play().catch(() => { });
                    if (data.levels && data.levels.length > 1) {
                        const parsed = data.levels.map((lvl, idx) => ({
                            index: idx,
                            height: lvl.height || 0,
                            label: lvl.height ? `${lvl.height}p` : `ระดับ ${idx + 1}`,
                        }));
                        parsed.sort((a, b) => b.height - a.height);
                        setQualityLevels(parsed);
                    }
                });

                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        fatalErrorCountRef.current += 1;
                        if (fatalErrorCountRef.current >= 3) {
                            setHasError(true);
                            setIsLoading(false);
                            hls?.destroy();
                            hlsRef.current = null;
                            onAutoFallback?.();
                            return;
                        }

                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls?.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls?.recoverMediaError();
                                break;
                            default:
                                setHasError(true);
                                setIsLoading(false);
                                hls?.destroy();
                                hlsRef.current = null;
                                onAutoFallback?.();
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = resolvedUrl;
                const handleLoaded = () => {
                    setIsLoading(false);
                    video.play().catch(() => { });
                };
                const handleError = () => {
                    setHasError(true);
                    setIsLoading(false);
                    onAutoFallback?.();
                };

                video.addEventListener('loadedmetadata', handleLoaded);
                video.addEventListener('error', handleError);

                return () => {
                    video.removeEventListener('loadedmetadata', handleLoaded);
                    video.removeEventListener('error', handleError);
                };
            }
        } else if (video) {
            video.src = resolvedUrl;
        }

        return () => {
            if (hls) {
                hls.destroy();
                hlsRef.current = null;
            }
        };
    }, [resolvedUrl, isHls, isEmbed, rawIsFlv, reloadKey]);

    if (!resolvedUrl) {
        return (
            <div className="w-full aspect-video bg-slate-950 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3 text-slate-400 p-6 text-center shadow-2xl">
                <div className="p-4 rounded-full bg-white/5 border border-white/5">
                    <Tv className="w-10 h-10 text-slate-500" />
                </div>
                <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-200">ยังไม่มีสัญญาณถ่ายทอดสด</p>
                    <p className="text-xs text-slate-500">สัญญาณจะปรากฏเมื่อการแข่งขันเริ่มต้นขึ้น หรือลองเลือกคู่แข่งขันอื่น</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ====== MAIN VIDEO PLAYER CONTAINER ====== */}
            <div
                ref={containerRef}
                onClick={handleContainerTouchOrClick}
                className={cn(
                    "relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group select-none transition-all duration-500",
                    isTheaterMode && "lg:-mx-8 lg:scale-[1.03] z-30 shadow-[0_0_50px_rgba(0,0,0,0.9)] border-[#E5B842]/40"
                )}
            >
                {/* Live Concurrent Viewer Counter Overlay */}
                <LiveViewerBadge matchId={matchSlug || 'live-stream'} isLive={true} variant="player_overlay" />

                {/* Top Controls Overlay: Quality, Lock, Theater & PiP */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                    {/* HLS Quality Selector Dropdown */}
                    {!isEmbed && qualityLevels.length > 0 && !isScreenLocked && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsQualityMenuOpen(!isQualityMenuOpen);
                                }}
                                title="ความคมชัดวิดีโอ (Quality)"
                                className={cn(
                                    "p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs opacity-0 group-hover:opacity-100",
                                    isQualityMenuOpen && "opacity-100 border-[#E5B842] text-[#E5B842]"
                                )}
                            >
                                <Settings className="w-4 h-4 text-[#E5B842]" />
                                <span className="hidden sm:inline font-medium">
                                    {selectedQuality === -1
                                        ? 'อัตโนมัติ'
                                        : (qualityLevels.find((q) => q.index === selectedQuality)?.label || 'Auto')}
                                </span>
                            </button>

                            {isQualityMenuOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-11 z-50 w-36 py-1 bg-slate-900/95 border border-white/15 rounded-xl backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 text-xs"
                                >
                                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10">
                                        เลือกความคมชัด
                                    </div>
                                    <button
                                        onClick={() => handleSelectQuality(-1)}
                                        className={cn(
                                            "w-full px-3 py-2 text-left hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer",
                                            selectedQuality === -1 ? "text-[#E5B842] font-bold" : "text-slate-300"
                                        )}
                                    >
                                        <span>อัตโนมัติ (Auto)</span>
                                        {selectedQuality === -1 && <span className="text-[10px]">✓</span>}
                                    </button>
                                    {qualityLevels.map((lvl) => (
                                        <button
                                            key={lvl.index}
                                            onClick={() => handleSelectQuality(lvl.index)}
                                            className={cn(
                                                "w-full px-3 py-2 text-left hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer",
                                                selectedQuality === lvl.index ? "text-[#E5B842] font-bold" : "text-slate-300"
                                            )}
                                        >
                                            <span>{lvl.label}</span>
                                            {selectedQuality === lvl.index && <span className="text-[10px]">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Screen Lock Toggle Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsScreenLocked(!isScreenLocked);
                        }}
                        title={isScreenLocked ? 'ปลดล็อกการสัมผัส' : 'ล็อกหน้าจอสัมผัส'}
                        className={`p-2 rounded-xl border backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs ${isScreenLocked
                                ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(229,184,66,0.3)]'
                                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border-white/10 opacity-0 group-hover:opacity-100'
                            }`}
                    >
                        {isScreenLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-slate-300" />}
                        <span className="hidden sm:inline font-medium">{isScreenLocked ? 'ล็อกจออยู่' : 'ล็อกจอ'}</span>
                    </button>

                    {/* PiP Button */}
                    {!isEmbed && isPipSupported && !isScreenLocked && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePip();
                            }}
                            title="Picture-in-Picture (ย่อหน้าจอ)"
                            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs"
                        >
                            <PictureInPicture className="w-4 h-4 text-[#E5B842]" />
                            <span className="hidden sm:inline font-medium">{isPipActive ? 'ออกจาก PiP' : 'หน้าจอลอย'}</span>
                        </button>
                    )}
                </div>

                {/* Screen Locked Overlay Banner */}
                {isScreenLocked && (
                    <div className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md animate-in fade-in">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>ล็อกหน้าจออยู่ (แตะไอคอนแม่กุญแจเพื่อปลด)</span>
                    </div>
                )}

                {/* Double-Tap Seek Ripple Overlay */}
                {seekFeedback && (
                    <div
                        className={`absolute inset-y-0 z-40 flex items-center justify-center pointer-events-none transition-all duration-300 ${seekFeedback.direction === 'left' ? 'left-0 w-1/3 bg-white/10 rounded-r-full' : 'right-0 w-1/3 bg-white/10 rounded-l-full'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-1 bg-black/70 px-4 py-3 rounded-2xl border border-white/20 backdrop-blur-md text-white shadow-2xl animate-in zoom-in-75">
                            {seekFeedback.direction === 'left' ? (
                                <>
                                    <RotateCcw className="w-6 h-6 text-amber-400 animate-spin" />
                                    <span className="text-xs font-bold font-mono">-10 วินาที</span>
                                </>
                            ) : (
                                <>
                                    <RotateCw className="w-6 h-6 text-amber-400 animate-spin" />
                                    <span className="text-xs font-bold font-mono">+10 วินาที</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {(isLoading || isResolvingStream) && !hasError && (
                    <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-white transition-opacity">
                        <Loader2 className="w-9 h-9 text-[#E5B842] animate-spin" />
                        <span className="text-xs font-medium text-slate-300 tracking-wide">
                            {isResolvingStream ? 'กำลังดึงสัญญาณสดความคมชัดระดับ HD...' : 'กำลังเชื่อมต่อสัญญาณถ่ายทอดสด...'}
                        </span>
                    </div>
                )}

                {/* Error Overlay */}
                {hasError && (
                    <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-rose-400 p-4 text-center">
                        <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20">
                            <AlertCircle className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-200">ไม่สามารถโหลดสัญญาณภาพได้</p>
                            <p className="text-xs text-slate-400">สัญญาณอาจจะขัดข้อง หรือสลับไปใช้ช่องทางสำรองด้านล่าง</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                            <button
                                onClick={handleRetry}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/10 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                ลองเชื่อมต่อใหม่
                            </button>
                            {onReportStream && (
                                <button
                                    onClick={onReportStream}
                                    className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium rounded-xl border border-rose-500/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                                >
                                    <Flag className="w-3.5 h-3.5 text-rose-400" />
                                    แจ้งลิงก์นี้เสีย
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Embed Iframe Player */}
                {isEmbed ? (
                    <iframe
                        key={`embed-${resolvedUrl}-${reloadKey}`}
                        src={resolvedUrl}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={() => setIsLoading(false)}
                        onError={() => {
                            setHasError(true);
                            setIsLoading(false);
                        }}
                    />
                ) : (
                    /* HLS / Native HTML5 Video Player */
                    <video
                        ref={videoRef}
                        poster={poster}
                        controls={!isScreenLocked}
                        playsInline
                        className="w-full h-full object-contain"
                        onCanPlay={() => setIsLoading(false)}
                        onError={() => {
                            setHasError(true);
                            setIsLoading(false);
                        }}
                    />
                )}
            </div>

            {/* ====== IN-SITE FLOATING MINI PLAYER (Auto pops up when scrolling down) ====== */}
            {isScrolledOffScreen && !isMiniPlayerDismissed && !hasError && (
                <div className="fixed bottom-20 md:bottom-6 right-4 z-[998] w-64 sm:w-80 aspect-video rounded-2xl overflow-hidden bg-slate-950 border-2 border-[#E5B842]/80 shadow-[0_0_35px_rgba(0,0,0,0.9)] backdrop-blur-2xl animate-[slideUp_0.4s_ease-out] group select-none">

                    {/* Mini Player Overlay Controls */}
                    <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-auto">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-black text-[9px] tracking-wider uppercase flex items-center gap-1 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            LIVE MINI
                        </span>

                        <div className="flex items-center gap-1 bg-black/70 p-1 rounded-xl border border-white/20 backdrop-blur-md">
                            <button
                                onClick={scrollToPlayer}
                                className="p-1 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
                                title="เลื่อนกลับไปด้านบน (Scroll to Top)"
                            >
                                <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setIsMiniPlayerDismissed(true)}
                                className="p-1 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                                title="ปิดหน้าจอมินิ"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Mini Video Feed */}
                    {isEmbed ? (
                        <iframe
                            src={cleanUrl}
                            className="w-full h-full border-0 pointer-events-none"
                        />
                    ) : (
                        <div
                            onClick={scrollToPlayer}
                            className="w-full h-full flex items-center justify-center cursor-pointer bg-black/90 relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10" />
                            <Tv className="w-8 h-8 text-[#E5B842] animate-pulse relative z-10" />
                            <span className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-amber-300 font-bold z-10">
                                แตะเพื่อกลับไปรับชมจอหลัก
                            </span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}