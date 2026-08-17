'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { AlertCircle, Loader2, RefreshCw, Tv } from 'lucide-react';

interface VideoPlayerProps {
    streamUrl?: string;
    poster?: string;
    matchSlug?: string;
    onAutoFallback?: () => void;
}

export default function VideoPlayer({ streamUrl, poster, matchSlug, onAutoFallback }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    // ช่วยแกะ src ออกจาก string กรณีที่ Backend ส่งมาเป็น <iframe src="...">
    const getCleanUrl = useCallback((url?: string) => {
        if (!url) return '';
        if (url.includes('<iframe')) {
            const match = url.match(/src=["']([^"']+)["']/);
            return match ? match[1] : url;
        }
        return url.trim();
    }, []);

    const cleanUrl = getCleanUrl(streamUrl);
    const isHls = cleanUrl.includes('.m3u8');
    const isEmbed = cleanUrl.includes('youtube.com') ||
        cleanUrl.includes('youtu.be') ||
        cleanUrl.includes('embed') ||
        cleanUrl.includes('player') ||
        (cleanUrl.startsWith('http') && !isHls && !cleanUrl.match(/\.(mp4|webm|ogg)$/i));

    const handleRetry = () => {
        setHasError(false);
        setIsLoading(true);
        setReloadKey((prev) => prev + 1);
    };

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);

        if (!cleanUrl) {
            setIsLoading(false);
            return;
        }

        // ถ้าเป็น Embed (iframe) เปิด Loading ไว้รอ onload event
        if (isEmbed) {
            return;
        }

        let hls: Hls | null = null;
        const video = videoRef.current;

        if (isHls && video) {
            if (Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                });

                hls.loadSource(cleanUrl);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setIsLoading(false);
                    video.play().catch(() => { });
                });

                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                // พยายาม Re-connect ถ้าเครือข่ายหลุดชั่วคราว
                                hls?.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls?.recoverMediaError();
                                break;
                            default:
                                setHasError(true);
                                setIsLoading(false);
                                hls?.destroy();
                                onAutoFallback?.();
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS บน Safari (iOS / macOS)
                video.src = cleanUrl;
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
            // Direct Video (MP4 / WebM)
            video.src = cleanUrl;
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [cleanUrl, isHls, isEmbed, reloadKey]);

    if (!cleanUrl) {
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
        <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
            {/* Loading Overlay */}
            {isLoading && !hasError && (
                <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-white transition-opacity">
                    <Loader2 className="w-9 h-9 text-[#E5B842] animate-spin" />
                    <span className="text-xs font-medium text-slate-300 tracking-wide">กำลังเชื่อมต่อสัญญาณถ่ายทอดสด...</span>
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
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/10 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            ลองเชื่อมต่อใหม่
                        </button>
                    </div>
                </div>
            )}

            {/* Embed Iframe Player */}
            {isEmbed ? (
                <iframe
                    key={`embed-${cleanUrl}-${reloadKey}`}
                    src={cleanUrl}
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
                    controls
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
    );
}