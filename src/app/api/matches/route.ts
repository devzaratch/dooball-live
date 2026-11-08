import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';
import { Match } from '@/types/football';

// In-Memory Cache on Next.js Server Instance
let cachedMatches: Match[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 3000; // 3 seconds server cache (fast live updates without overloading DB)
let isFetching = false;

function formatRawMatches(rawData: Record<string, unknown> | unknown[]): Match[] {
    if (!rawData) return [];

    const rawArray = Array.isArray(rawData)
        ? rawData
        : Object.keys(rawData as Record<string, unknown>).map((key) => ({ id: key, ...(rawData as Record<string, Record<string, unknown>>)[key] }));

    return rawArray
        .filter((item) => item !== null)
        .map((item, index) => {
            const raw = item as Record<string, unknown>;
            const rawStreamLinks = raw.streamLinks && Array.isArray(raw.streamLinks) 
                ? (raw.streamLinks as Array<Record<string, unknown>>)
                    .filter((s) => s && s.url && s.url !== '#' && String(s.url).trim() !== '') 
                    .map((s, idx) => ({
                        id: String(s.id || `stream-${index}-${idx}`),
                        label: String(s.label || `ลิงก์สำรอง ${idx + 1}`),
                        url: String(s.url),
                        quality: s.quality ? String(s.quality) : undefined,
                    }))
                : [];

            const streamLinks = [...rawStreamLinks];

            // ตรวจสอบลิงก์หลัก: หาก embed_url เป็น '#' หรือว่าง ให้สลับไปใช้ item.link จากฐานข้อมูลทันที
            const validEmbedUrl = raw.embed_url && String(raw.embed_url).trim() !== '#' ? String(raw.embed_url).trim() : '';
            const validLink = raw.link && String(raw.link).trim() !== '#' ? String(raw.link).trim() : '';
            const mainStreamUrl = validEmbedUrl || validLink;

            if (mainStreamUrl && !streamLinks.some((s) => s.url === mainStreamUrl)) {
                streamLinks.unshift({
                    id: `stream-main-${index}`,
                    label: 'ลิงก์ถ่ายทอดสดหลัก (HD)',
                    url: mainStreamUrl,
                    quality: '1080p',
                });
            }

            const matchDate = raw.date_string || raw.date || raw.date_str || raw.match_date || raw.day || '';
            const rawStatus = String(raw.status || '').trim();
            const statusLower = rawStatus.toLowerCase();

            const isLiveMatch = raw.is_live === true || rawStatus === 'LIVE' || statusLower === 'live';
            const isFinishedMatch =
                rawStatus === 'FINISHED' ||
                rawStatus === 'จบการแข่งขัน' ||
                statusLower === 'ft' ||
                statusLower === 'finished' ||
                statusLower === 'ended' ||
                statusLower === 'full-time' ||
                statusLower === 'aet' ||
                statusLower === 'pen' ||
                (raw.is_live === false &&
                    (raw.time === '00:00' || rawStatus === 'จบการแข่งขัน') &&
                    raw.home_score !== undefined &&
                    raw.home_score !== '-' &&
                    raw.home_score !== '?');

            const finalStatus = isLiveMatch ? 'LIVE' : (isFinishedMatch ? 'FINISHED' : 'UPCOMING');
            const kickoffTime = isFinishedMatch
                ? 'จบการแข่งขัน'
                : (raw.time && raw.time !== '00:00' && raw.time !== 'จบการแข่งขัน'
                    ? raw.time
                    : (raw.kickoffTime || '00:00'));

            const homeTeam = raw.homeTeam as Record<string, unknown> | undefined;
            const awayTeam = raw.awayTeam as Record<string, unknown> | undefined;
            const league = raw.league as Record<string, unknown> | string | undefined;

            return {
                id: String(raw.id ?? index),
                slug:
                    String(raw.slug || `${(String(raw.home || 'home')).toLowerCase().replace(/\s+/g, '-')}-vs-${(String(raw.away || 'away')).toLowerCase().replace(/\s+/g, '-')}`),
                date: String(matchDate),
                dateOrder: (raw.date_order as number) ?? index,
                homeTeam: {
                    name: String(raw.home || homeTeam?.name || 'ทีมเหย้า'),
                    score: (raw.home_score !== undefined && raw.home_score !== null && raw.home_score !== '?') 
                        ? (typeof raw.home_score === 'number' || typeof raw.home_score === 'string' ? raw.home_score : String(raw.home_score)) 
                        : (typeof homeTeam?.score === 'number' || typeof homeTeam?.score === 'string' ? homeTeam.score : '-'),
                    logo: String(raw.home_logo || homeTeam?.logo || ''),
                },
                awayTeam: {
                    name: String(raw.away || awayTeam?.name || 'ทีมเยือน'),
                    score: (raw.away_score !== undefined && raw.away_score !== null && raw.away_score !== '?') 
                        ? (typeof raw.away_score === 'number' || typeof raw.away_score === 'string' ? raw.away_score : String(raw.away_score)) 
                        : (typeof awayTeam?.score === 'number' || typeof awayTeam?.score === 'string' ? awayTeam.score : '-'),
                    logo: String(raw.away_logo || awayTeam?.logo || ''),
                },
                league: {
                    name: typeof league === 'string' ? league : (String(league?.name || 'ทั่วไป')),
                    logo: String(raw.league_logo || (typeof league !== 'string' && league?.logo) || ''),
                },
                kickoffTime: String(kickoffTime),
                status: finalStatus,
                currentMinute: String(raw.currentMinute || raw.status || '0'),
                link: String(validLink || raw.link || ''),
                streamLinks: streamLinks,
            };
        });
}

async function fetchFromFirebase(): Promise<Match[] | null> {
    const databaseURL =
        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
        'https://football-888-b9a7e-default-rtdb.asia-southeast1.firebasedatabase.app';

    // 1. Direct REST fetch (ultra-fast, bypasses websocket peak connection limits)
    try {
        const restRes = await fetch(`${databaseURL}/matches.json`, {
            cache: 'no-store',
            headers: { 'Accept': 'application/json' },
        });

        if (restRes.ok) {
            const restData = await restRes.json();
            if (restData) {
                return formatRawMatches(restData);
            }
        }
    } catch (restErr) {
        console.warn('Firebase REST fetch notice:', (restErr as Error)?.message || restErr);
    }

    // 2. Fallback: Firebase Admin SDK using .once('value')
    try {
        if (adminDb) {
            const snapshot = await adminDb.ref('matches').once('value');
            if (snapshot.exists()) {
                const data = snapshot.val() as Record<string, unknown>;
                return formatRawMatches(data);
            }
        }
    } catch (err) {
        console.warn('Firebase Admin fetch notice:', (err as Error)?.message || err);
    }

    return null;
}

export async function GET(req?: NextRequest) {
    // Rate limit 60 req/min/ต่อ IP (เว็บ poll 4-15 วินาที = ~15 req/min ต่อคน ปลอดภัย)
    const ip = req?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`matches_${ip}`, 60, 60 * 1000);
    if (!rateCheck.allowed) {
        return NextResponse.json(
            { success: false, error: 'Too many requests', matches: [] },
            { status: 429, headers: { 'Retry-After': '60' } }
        );
    }

    const now = Date.now();

    // Check if we have fresh in-memory cache
    if (cachedMatches && now - lastFetchTime < CACHE_TTL_MS) {
        return NextResponse.json(
            {
                success: true,
                source: 'server_cache',
                count: cachedMatches.length,
                matches: cachedMatches,
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=10',
                },
            }
        );
    }

    // Refresh cache from Firebase (single-flight execution)
    if (!isFetching) {
        isFetching = true;
        try {
            const freshMatches = await fetchFromFirebase();
            if (freshMatches && freshMatches.length > 0) {
                cachedMatches = freshMatches;
                lastFetchTime = Date.now();
            }
        } catch (e) {
            console.error('Error refreshing matches cache:', e);
        } finally {
            isFetching = false;
        }
    }

    // If cache is present (even if slightly stale), return it immediately
    if (cachedMatches) {
        return NextResponse.json(
            {
                success: true,
                source: 'server_proxy',
                count: cachedMatches.length,
                matches: cachedMatches,
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=10',
                },
            }
        );
    }

    // Fallback if no data could be fetched at all
    return NextResponse.json(
        {
            success: false,
            error: 'No match data available',
            matches: [],
        },
        { status: 200 }
    );
}
