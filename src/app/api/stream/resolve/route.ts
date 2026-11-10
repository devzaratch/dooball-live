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

// 🎯 streamUrl ที่เล่นได้จริง:
//  - ถ้าตั้ง STREAM_RELAY_BASE (Cloudflare Worker) → browser ผู้ชมเรียก Worker ตรง
//    (Vercel egress โดน Cloudflare แชลเลนจ์ที่ workers.dev จึงห้ามให้ Vercel เป็นคนกลาง)
//  - ถ้าไม่มี → ใช้ /api/proxy/stream ของตัวเอง (เหมาะกับ server ที่ IP ไม่โดนแบน เช่น local)
const RELAY_BASE = (process.env.STREAM_RELAY_BASE || '').replace(/\/$/, '');
const DOOBALL_REFERER = 'https://dooball99.top/';

function buildStreamUrl(m3u8Url: string): string {
    if (RELAY_BASE) {
        return `${RELAY_BASE}/stream?url=${encodeURIComponent(m3u8Url)}&referer=${encodeURIComponent(DOOBALL_REFERER)}`;
    }
    return `/api/proxy/stream?url=${encodeURIComponent(m3u8Url)}`;
}

// URL หลัก (โดยไม่มี url param) ให้ player ไปร้องเองกับ candidates ที่สุ่มเลือกเอง
function relayDirectBase(): string | null {
    return RELAY_BASE ? `${RELAY_BASE}/stream` : null;
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
    // nocache=1: บังคับ resolve สด (ใช้หลังกด Retry เพื่อได้ wmsAuthSign token ใหม่)
    const noCache = searchParams.get('nocache') === '1';

    if (!targetUrl || !isUrlAllowed(targetUrl)) {
        return NextResponse.json({ success: false, error: 'Invalid or missing url parameter' }, { status: 400 });
    }

    try {
        const now = Date.now();

        // 1. Check cache first
        const cached = resolveCache.get(targetUrl);
        if (!noCache && cached && cached.expiresAt > now) {
            return NextResponse.json({
                success: true,
                source: 'cache',
                rawM3u8Url: cached.m3u8Url,
                streamUrl: buildStreamUrl(cached.m3u8Url),
                relayDirect: relayDirectBase(),
            });
        }

        // 2. Fetch หน้า fixture (รองรับ dooballlaos.com / dooball99.top และมิเรอร์)
        // Reject ถ้า URL ชี้กลับเข้า resolve endpoint ตัวเอง (กัน recursion)
        let resolvedTargetUrl = targetUrl;
        if (resolvedTargetUrl.includes('/api/stream/resolve')) {
            return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
        }
        // ปรับ fixture id: รองรับทั้ง /fixtures/{id} และรูปแบบเก่า dooballlaos.com/top:fixtures/{id}
        const idMatch = resolvedTargetUrl.match(/[/ :]fixtures\/(\d+)/);
        const fixtureId = idMatch ? idMatch[1] : '';

        const FIXTURE_HEADERS: Record<string, string> = {
            'User-Agent': UA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://dooball99.top/',
        };

        let html = '';
        let fetchTrace = '';

        // 2a. dooball99.top บล็อก egress IP ของ Vercel (403) → วนลองเฉพาะมิเรอร์ที่ยังไม่บล็อก
        //     (เป็นเว็บเดียวกันทั้ง 3 โดเมน: ข้างหน้าเผลอเดียวกัน id หน้า fixture ใช้ร่วมกัน, มี var POOL แบบเดียวกัน)
        const relayHosts = fixtureId
            ? ['dooball99.top', 'dooball66-hd.com', 'dooballonline.live']
            : [];
        const candidateUrls = fixtureId
            ? relayHosts.map((host) => `https://${host}/fixtures/${fixtureId}`)
            : [resolvedTargetUrl];

        for (const candidateUrl of candidateUrls) {
            try {
                const response = await fetchWithGuard(candidateUrl, { headers: FIXTURE_HEADERS }, { timeoutMs: 8000 });
                if (response.ok) {
                    const text = await response.text();
                    if (text.includes('var POOL') || text.includes('.m3u8')) {
                        resolvedTargetUrl = candidateUrl;
                        html = text;
                        break;
                    }
                    fetchTrace += ` ${new URL(candidateUrl).hostname}:no_stream`;
                } else {
                    fetchTrace += ` ${new URL(candidateUrl).hostname}:${response.status}`;
                }
            } catch (e: unknown) {
                fetchTrace += ` ${new URL(candidateUrl).hostname}:${e instanceof Error ? 'err' : 'err'}`;
            }
        }

        // 2b. Fallback: ถ้า HTML ว่างหรือไม่มี POOL/m3u8 (โดนบล็อก/Cloudflare challenge) → ผ่าน HTML proxy
        if (!html.includes('var POOL') && !html.includes('.m3u8')) {
            const proxyList = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(resolvedTargetUrl)}`,
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(resolvedTargetUrl)}`,
            ];
            for (const proxyUrl of proxyList) {
                try {
                    const fbRes = await fetchWithGuard(proxyUrl, {
                        headers: { 'User-Agent': UA, 'Accept': 'text/html,*/*' },
                    }, { timeoutMs: 12000 });
                    if (fbRes.ok) {
                        const fbHtml = await fbRes.text();
                        if (fbHtml.includes('var POOL') || fbHtml.includes('.m3u8')) {
                            html = fbHtml;
                            fetchTrace += ` →via:${new URL(proxyUrl).hostname}`;
                            break;
                        }
                        fetchTrace += ` ${new URL(proxyUrl).hostname}:no_stream`;
                    } else {
                        fetchTrace += ` ${new URL(proxyUrl).hostname}:${fbRes.status}`;
                    }
                } catch (e: unknown) {
                    fetchTrace += ` ${new URL(proxyUrl).hostname}ERR`;
                }
            }
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
                error: html
                    ? 'No live stream (.m3u8) found on this page. Match might not have started yet.'
                    : `Failed to fetch fixture page (${fetchTrace.trim() || 'unknown'})`,
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

        // Save to cache for 5 minutes (ข้ามถ้าเรียกแบบ noCache)
        if (!noCache) {
            putCache(targetUrl, {
                m3u8Url: rawM3u8Url,
                expiresAt: now + 5 * 60 * 1000,
            });
        }

        // Automatically wrap with relay/proxy for the referer the upstream expects
        const streamUrl = buildStreamUrl(rawM3u8Url);

        return NextResponse.json({
            success: true,
            source: 'live_resolved',
            rawM3u8Url,
            streamUrl,
            relayDirect: relayDirectBase(),
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
