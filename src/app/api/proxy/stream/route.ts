import { NextRequest, NextResponse } from 'next/server';
import {
    checkRateLimit, getSafeClientIp, isIdentifiableIp,
    isBotUserAgent, isAllowedSiteOrigin,
    markViolation, isBanned,
} from '@/lib/rateLimit';
import { fetchWithGuard, isUrlAllowed } from '@/lib/safeFetch';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// 🎯 Relay egress: host .sbs แบนช่วง IP ของ Vercel (403 เสมอ แม้ Referer/Origin ถูก)
// เส้นทางเดียวที่ upstream ยอมรับ = IP ไม่โดนแบน + Referer dooball99.top
// ตั้ง STREAM_RELAY_BASE เป็น URL ของ Cloudflare Worker relay (ดู README ใน /worker)
// ถ้าไม่ตั้ง → ยิง upstream ตรงเหมือนเดิม (ต้องยอม 403 จนกว่าจะ deploy)
const RELAY_BASE = (process.env.STREAM_RELAY_BASE || '').replace(/\/$/, '');
const RELAY_KEY = process.env.STREAM_RELAY_KEY || '';

function relayedFetchUrl(upstreamUrl: string, referer: string): string | null {
    if (!RELAY_BASE) return null;
    try {
        const u = new URL('/stream', RELAY_BASE);
        u.searchParams.set('url', upstreamUrl);
        u.searchParams.set('referer', referer);
        return u.href;
    } catch {
        return null;
    }
}

// 🔒 CORS แบบ allowlist: ตอบเฉพาะ origin ที่ผ่านการตรวจเท่านั้น (ห้าม '*' เด็ดขาด)
// เพื่อไม่ให้เว็บอื่นฝัง player ชี้มาที่ /api/proxy/stream ของเราดูดสตรีมฟรี
// หา domain ปลายทางที่ผู้ชมใช้เข้ามาจริง: ตอนรันหลังรีเวิร์สโปรกซี/Vercel header Host จะถูกเขียนเป็น
// localhost แต่โดเมนจริงอยู่ใน X-Forwarded-Host
function selfHostOf(request: NextRequest): string {
    return request.headers.get('x-forwarded-host')?.trim() || request.nextUrl.host;
}

function allowedOriginFor(request: NextRequest): string {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    if (isAllowedSiteOrigin(referer, origin, selfHostOf(request))) {
        try {
            if (origin) return new URL(origin).origin;
            if (referer) return new URL(referer).origin;
        } catch {
            /* fallthrough */
        }
        // ผ่านการตรวจแต่ไม่มี Origin/Referer อ่านค่าได้ (กรณี dev) → ใช้ origin ของ request เอง
        if (process.env.NODE_ENV !== 'production') return request.nextUrl.origin;
    }
    return '';
}

function guardHeaders(request: NextRequest): Record<string, string> {
    const allowOrigin = allowedOriginFor(request);
    if (!allowOrigin) return {};
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
        'Access-Control-Allow-Credentials': 'false',
        'Vary': 'Origin',
    };
}

export async function OPTIONS(request: NextRequest) {
    const headers = guardHeaders(request);
    if (Object.keys(headers).length === 0) {
        return new NextResponse(null, { status: 403 });
    }
    return new NextResponse(null, { status: 204, headers });
}

// 🛡️ Guard หลักของ proxy (ตามลำดับ): IP แบน → บอท UA → Referer/Origin → Rate limit
// ข้อสังเกต: ปรับ limit จาก 30 → 90 req/min เพราะผู้ชมจริง 1 คนกิน HLS segments ~15/min
// และผู้ชมหลายคนอาจอยู่หลัง NAT เดียวกัน — กำแพงชั้นแรกจริงๆ คือ Referer/UA ที่ปัดบอทก่อนถึงตัวนับ
function guardRequest(request: NextRequest): { headers: Record<string, string>; reject?: NextResponse } {
    const ip = getSafeClientIp(request);
    const headers = guardHeaders(request);

    if (isBanned(ip)) {
        return {
            headers,
            reject: new NextResponse('Forbidden (temporary ban)', {
                status: 403,
                headers: { ...headers, 'Cache-Control': 'no-store' },
            }),
        };
    }
    if (isBotUserAgent(request.headers.get('user-agent'))) {
        markViolation(ip);
        return {
            headers,
            reject: new NextResponse('Forbidden', {
                status: 403,
                headers: { ...headers, 'Cache-Control': 'no-store' },
            }),
        };
    }
    if (!isAllowedSiteOrigin(
        request.headers.get('referer'),
        request.headers.get('origin'),
        selfHostOf(request),
    )) {
        // ⚠️ ไม่นับบัญชีแบน — เพราะผู้ใช้จริงกลุ่มใหญ่ (CGNAT มือถือ, privacy browser ตัด Referer)
        // อาจล้วนมาพร้อม IP เดียวกัน การสะสมคะแนนจะแบนคนดีทั้งก้อน
        // การปัดรายตัวด้วย 403 ร่วมกับ isBotUserAgent (นับบัญชีแบน) ก็ตัดเว็บดูด/บอททั้งกลุ่มจริงได้อยู่แล้ว
        markViolation(ip, false);
        return {
            headers,
            reject: new NextResponse('Forbidden (invalid referer)', {
                status: 403,
                headers: { ...headers, 'Cache-Control': 'no-store' },
            }),
        };
    }

    // 🛡️ ระบุ IP ไม่ได้ → ไม่นับ rate limit (ทุกคนจะแชร์โควตาเดียวกันจน self-DoS)
    // คุ้มกันชั้นแรกยังอยู่ครบ: ban ข้ามบอท (isBanned) + บอท UA  + Referer check
    if (isIdentifiableIp(ip)) {
        const check = checkRateLimit(`proxy_${ip}`, 90, 60 * 1000);
        if (!check.allowed) {
            return {
                headers,
                reject: new NextResponse('Too many requests, try again later', {
                    status: 429,
                    headers: { ...headers, 'Retry-After': '60', 'Cache-Control': 'no-store' },
                }),
            };
        }
    }

    return { headers };
}

export async function GET(request: NextRequest) {
    const guard = guardRequest(request);
    if (guard.reject) return guard.reject;
    const corsHeaders = guard.headers;

    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl || !isUrlAllowed(targetUrl)) {
        return new NextResponse('Invalid or missing url parameter', {
            status: 400,
            headers: corsHeaders,
        });
    }

    try {
        // If the URL ends with .flv, check if we should map it to .m3u8 for native HLS playback
        let fetchUrl = targetUrl;
        const wantsFlv = searchParams.get('raw') === 'true';
        if (targetUrl.includes('.flv') && !wantsFlv) {
            fetchUrl = targetUrl.replace(/\.flv(\?.*)?$/, '.m3u8$1');
        }

        // Determine appropriate Spoofed Referer & Origin based on the upstream domain
        // 🌐 ตั้งค่าเริ่มต้นเป็น Xoilac เพื่อให้ทุกลิงก์ที่บอทดึงมาใช้งานได้ทันทีโดยไม่ต้องแก้เพิ่มอีก
        let referer = 'https://xoilacxyd.io/';
        let origin = 'https://xoilacxyd.io';

        if (targetUrl.includes('domainkqt.cc') || targetUrl.includes('hexvaridstreamnode.com')) {
            referer = 'https://x1365.hexvaridstreamnode.com/';
            origin = 'https://x1365.hexvaridstreamnode.com';
        } else if (targetUrl.includes('sbs') || targetUrl.includes('do-ball.com') || targetUrl.includes('dooball99')) {
            referer = 'https://dooball99.top/';
            origin = 'https://dooball99.top';
        }

        // 🩺 รายงานสถานะ relay กลับไปใน error เพื่อวินิจฉัยจากภายนอกได้ (relay:ok / relay:403 / off)
        async function upstreamFetch(url: string): Promise<{ res: Response; relayNote: string }> {
            const relayUrl = relayedFetchUrl(url, referer);
            if (relayUrl) {
                const relayRes = await fetchWithGuard(relayUrl, {
                    headers: {
                        'X-Relay-Key': RELAY_KEY,
                        'User-Agent': UA,
                        'Accept': '*/*',
                        ...(request.headers.get('range') ? { 'Range': request.headers.get('range') as string } : {}),
                    },
                }, { timeoutMs: 12000 });
                // relay ล้ม → ยิงตรงซ้ำเพื่อความครอบคลุม (กรณี .sbs ทบทวนแบน/relay down)
                if (relayRes.ok) return { res: relayRes, relayNote: 'ok' };
                const directRes = await fetchWithGuard(url, {
                    headers: {
                        'Referer': referer,
                        'Origin': origin,
                        'User-Agent': UA,
                        'Accept': '*/*',
                        ...(request.headers.get('range') ? { 'Range': request.headers.get('range') as string } : {}),
                    },
                }, { timeoutMs: 8000 });
                return { res: directRes, relayNote: `relay:${relayRes.status}->direct:${directRes.status}` };
            }
            const directRes = await fetchWithGuard(url, {
                headers: {
                    'Referer': referer,
                    'Origin': origin,
                    'User-Agent': UA,
                    'Accept': '*/*',
                    ...(request.headers.get('range') ? { 'Range': request.headers.get('range') as string } : {}),
                },
            }, { timeoutMs: 8000 });
            return { res: directRes, relayNote: 'off' };
        }

        const { res: upstreamResponse, relayNote } = await upstreamFetch(fetchUrl);

        if (!upstreamResponse.ok) {
            // Fallback: if .m3u8 failed and original was .flv, try streaming original .flv
            if (fetchUrl !== targetUrl) {
                const flvRes = await fetchWithGuard(targetUrl, {
                    headers: {
                        'Referer': referer,
                        'Origin': origin,
                        'User-Agent': UA,
                        'Accept': '*/*',
                    },
                }, { timeoutMs: 8000 });
                if (flvRes.ok && flvRes.body) {
                    return new NextResponse(flvRes.body, {
                        status: 200,
                        headers: {
                            'Content-Type': 'video/x-flv',
                            ...corsHeaders,
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                        },
                    });
                }
            }

            return new NextResponse(`Upstream returned ${upstreamResponse.status}: ${upstreamResponse.statusText} [${relayNote}]`, {
                status: upstreamResponse.status,
                headers: corsHeaders,
            });
        }

        const contentType = upstreamResponse.headers.get('content-type') || '';
        const isM3u8 = fetchUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

        // For M3U8 playlists: rewrite relative URLs AND wrap chunks/sub-playlists with proxy so Referer header is always attached
        if (isM3u8) {
            const m3u8Text = await upstreamResponse.text();
            if (m3u8Text.length > 2 * 1024 * 1024) {
                return new NextResponse('Playlist too large', { status: 413, headers: corsHeaders });
            }
            const baseUrl = new URL(fetchUrl);

            const rewrittenLines = m3u8Text.split('\n').map((line) => {
                const trimmed = line.trim();
                if (!trimmed) return line;

                // Handle HLS tag lines containing URI="..." attributes (e.g. #EXT-X-KEY or #EXT-X-MEDIA)
                if (trimmed.startsWith('#')) {
                    if (trimmed.includes('URI="')) {
                        return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
                            try {
                                const resolved = new URL(uri, baseUrl).href;
                                return `URI="/api/proxy/stream?url=${encodeURIComponent(resolved)}"`;
                            } catch {
                                return match;
                            }
                        });
                    }
                    return line;
                }

                try {
                    // Convert relative URL (e.g. chunks.m3u8?... or segment-123.ts?...) to absolute URL
                    const resolved = new URL(trimmed, baseUrl).href;
                    // Route chunk/sub-playlist through proxy so CDN referer check passes
                    return `/api/proxy/stream?url=${encodeURIComponent(resolved)}`;
                } catch {
                    return line;
                }
            });

            const outputM3u8 = rewrittenLines.join('\n');

            return new NextResponse(outputM3u8, {
                status: 200,
                headers: {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    ...corsHeaders,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
            });
        }

        // For binary streams (e.g. direct TS / FLV / MP4)
        const rangeHeaders: Record<string, string> = {};
        const contentRange = upstreamResponse.headers.get('content-range');
        if (upstreamResponse.status === 206 || contentRange) {
            rangeHeaders['Accept-Ranges'] = 'bytes';
            rangeHeaders['Status'] = String(upstreamResponse.status);
            if (contentRange) rangeHeaders['X-Content-Range'] = contentRange;
        }
        return new NextResponse(upstreamResponse.body, {
            status: 200,
            headers: {
                'Content-Type': contentType || 'video/mp2t',
                ...rangeHeaders,
                ...corsHeaders,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (err: unknown) {
        console.error('Stream proxy error:', err);
        return new NextResponse('Internal Proxy Error', { status: 500, headers: corsHeaders });
    }
}
