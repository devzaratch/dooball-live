import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { fetchWithGuard, isUrlAllowed } from '@/lib/safeFetch';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

// In-memory cache for resolved stream URLs (TTL: 5 minutes, cap 200 entries)
interface CacheItem {
    m3u8Url: string;
    expiresAt: number;
}
const resolveCache = new Map<string, CacheItem>();
const MAX_CACHE_ENTRIES = 200;

function putCache(key: string, item: CacheItem) {
    if (resolveCache.size >= MAX_CACHE_ENTRIES) {
        const oldest = resolveCache.keys().next().value;
        if (oldest) resolveCache.delete(oldest);
    }
    resolveCache.set(key, item);
}

export async function GET(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`resolve_${ip}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
        return NextResponse.json(
            { success: false, error: 'Too many requests, try again later' },
            { status: 429, headers: { 'Retry-After': '60' } }
        );
    }

    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl || !isUrlAllowed(targetUrl)) {
        return NextResponse.json({ success: false, error: 'Invalid or missing url parameter' }, { status: 400 });
    }

    try {
        const now = Date.now();

        // 1. Check cache first
        const cached = resolveCache.get(targetUrl);
        if (cached && cached.expiresAt > now) {
            const proxyStreamUrl = `/api/proxy/stream?url=${encodeURIComponent(cached.m3u8Url)}`;
            return NextResponse.json({
                success: true,
                source: 'cache',
                rawM3u8Url: cached.m3u8Url,
                streamUrl: proxyStreamUrl,
            });
        }

        // 2. Fetch the fixture HTML page (rewrite dooballlaos.com → dooball99.top)
        let resolvedTargetUrl = targetUrl;
        if (resolvedTargetUrl.includes('dooball-live-p6mk.vercel.app')) {
            const idMatch = resolvedTargetUrl.match(/(\d{7,})/);
            if (idMatch) {
                resolvedTargetUrl = `https://dooball99.top/fixtures/${idMatch[1]}`;
            }
        }
        let html = '';
        const response = await fetchWithGuard(resolvedTargetUrl, {
            headers: {
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Referer': 'https://dooball99.top/',
            },
        }, { timeoutMs: 8000 });

        if (response.ok) {
            html = await response.text();
        }

        // 3. Extract M3U8 stream URLs (direct in HTML)
        const m3u8Matches = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || [];

        // 3b. dooball99 (รูปแบบใหม่ พ.ย. 2569): ช่องทีวีฝังมากับหน้า HTML เลย
        // รูปแบบ inline: var POOL = [{"img": "...", "u": "<base64 ของ URL ที่ reverse แล้ว>"}]
        // (endpoint เดิม POST /api/v1/fixture-channels/{id} ถูกยกเลิก — ตอบกลับเป็น HTML หน้าแอป)
        const inlineStreams: string[] = [];
        const poolMatch = html.match(/var\s+POOL\s*=\s*(\[[\s\S]*?\]);/);
        if (poolMatch) {
            try {
                const pool = JSON.parse(poolMatch[1]) as Array<{ u?: string }>;
                pool.forEach((c) => {
                    if (c.u) {
                        try {
                            const decoded = Buffer.from(c.u, 'base64').toString('binary').split('').reverse().join('');
                            if (decoded.startsWith('http')) inlineStreams.push(decoded);
                        } catch { /* skip ช่อง decode ไม่ผ่าน */ }
                    }
                });
            } catch { /* โครงสร้างเพี้ยน → ปล่อยให้ fallback ยิง API เดิม */ }
        }

        // 3c. รูปแบบเก่า (เส้นทางสำรอง): POST /api/v1/fixture-channels/{id} → channels[].u
        const jwStreams: string[] = [];
        const fixtureMatch = resolvedTargetUrl.match(/dooball\d*\.top\/fixtures\/(\d+)/);
        if (fixtureMatch && inlineStreams.length === 0) {
            const id = fixtureMatch[1];
            try {
                const apiResp = await fetchWithGuard(`https://dooball99.top/api/v1/fixture-channels/${id}`, {
                    method: 'POST',
                    headers: {
                        'User-Agent': UA,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }, { timeoutMs: 8000 });
                if (apiResp.ok && (apiResp.headers.get('content-type') || '').includes('json')) {
                    const data = await apiResp.json();
                    if (data && Array.isArray(data.channels)) {
                        data.channels.forEach((c: { u?: string; img?: string }) => {
                            if (c.u) {
                                // URL เข้ารหัสแบบ base64 + reverse
                                try {
                                    const decoded = Buffer.from(c.u, 'base64').toString('binary').split('').reverse().join('');
                                    if (decoded) jwStreams.push(decoded);
                                } catch { }
                            }
                        });
                    }
                }
            } catch { }
        }

        // Combine and deduplicate
        const allMatches = [...m3u8Matches, ...inlineStreams, ...jwStreams];
        const uniqueMatches = [...new Set(allMatches)];

        if (uniqueMatches.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No live stream (.m3u8) found on this page. Match might not have started yet.',
            }, { status: 404 });
        }

        // Take the first active M3U8 stream
        const rawM3u8Url = uniqueMatches[0];
        if (!rawM3u8Url) {
            return NextResponse.json({
                success: false,
                error: 'Valid stream URL could not be parsed',
            }, { status: 404 });
        }

        // Save to cache for 5 minutes
        putCache(targetUrl, {
            m3u8Url: rawM3u8Url,
            expiresAt: now + 5 * 60 * 1000,
        });

        // Automatically wrap with our Stream Proxy for anti-hotlink referer bypass
        const proxyStreamUrl = `/api/proxy/stream?url=${encodeURIComponent(rawM3u8Url)}`;

        return NextResponse.json({
            success: true,
            source: 'live_resolved',
            rawM3u8Url,
            streamUrl: proxyStreamUrl,
            allCandidates: uniqueMatches,
        });

    } catch (err: unknown) {
        console.error('Error in /api/stream/resolve:', err);
        return NextResponse.json({
            success: false,
            error: 'Failed to resolve stream URL',
        }, { status: 500 });
    }
}
