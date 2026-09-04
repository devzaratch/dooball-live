import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Match } from '@/types/football';

// In-Memory Cache on Next.js Server Instance
let cachedMatches: Match[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 3000; // 3 seconds server cache (fast live updates without overloading DB)
let isFetching = false;

function formatRawMatches(rawData: any): Match[] {
    if (!rawData) return [];

    const rawArray = Array.isArray(rawData)
        ? rawData
        : Object.keys(rawData).map((key) => ({ id: key, ...rawData[key] }));

    return rawArray
        .filter((item) => item !== null)
        .map((item, index) => {
            const streamLinks = item.streamLinks && Array.isArray(item.streamLinks) ? [...item.streamLinks] : [];
            if (item.embed_url && !streamLinks.some((s: any) => s.url === item.embed_url)) {
                streamLinks.unshift({
                    id: `stream-main-${index}`,
                    label: 'ลิงก์ถ่ายทอดสดหลัก (HD)',
                    url: item.embed_url,
                    quality: '1080p',
                });
            }

            const matchDate = item.date_string || item.date || item.date_str || item.match_date || item.day || '';
            const rawStatus = String(item.status || '').trim();
            const statusLower = rawStatus.toLowerCase();

            const isLiveMatch = item.is_live === true || rawStatus === 'LIVE' || statusLower === 'live';
            const isFinishedMatch =
                rawStatus === 'FINISHED' ||
                rawStatus === 'จบการแข่งขัน' ||
                statusLower === 'ft' ||
                statusLower === 'finished' ||
                statusLower === 'ended' ||
                statusLower === 'full-time' ||
                statusLower === 'aet' ||
                statusLower === 'pen' ||
                (item.is_live === false &&
                    (item.time === '00:00' || rawStatus === 'จบการแข่งขัน') &&
                    item.home_score !== undefined &&
                    item.home_score !== '-' &&
                    item.home_score !== '?');

            const finalStatus = isLiveMatch ? 'LIVE' : (isFinishedMatch ? 'FINISHED' : 'UPCOMING');
            const kickoffTime = isFinishedMatch
                ? 'จบการแข่งขัน'
                : (item.time && item.time !== '00:00' && item.time !== 'จบการแข่งขัน'
                    ? item.time
                    : (item.kickoffTime || '00:00'));

            return {
                id: String(item.id ?? index),
                slug:
                    item.slug ||
                    `${(item.home || 'home').toLowerCase().replace(/\s+/g, '-')}-vs-${(item.away || 'away').toLowerCase().replace(/\s+/g, '-')}`,
                date: matchDate,
                dateOrder: item.date_order ?? index,
                homeTeam: {
                    name: item.home || item.homeTeam?.name || 'ทีมเหย้า',
                    score: item.home_score !== undefined && item.home_score !== '?' ? item.home_score : (item.homeTeam?.score ?? '-'),
                    logo: item.home_logo || item.homeTeam?.logo,
                },
                awayTeam: {
                    name: item.away || item.awayTeam?.name || 'ทีมเยือน',
                    score: item.away_score !== undefined && item.away_score !== '?' ? item.away_score : (item.awayTeam?.score ?? '-'),
                    logo: item.away_logo || item.awayTeam?.logo,
                },
                league: {
                    name: item.league?.name || item.league || 'ทั่วไป',
                    logo: item.league_logo || item.league?.logo,
                },
                kickoffTime: kickoffTime,
                status: finalStatus,
                currentMinute: item.currentMinute || item.status || '0',
                streamLinks: streamLinks,
            };
        });
}

async function fetchFromFirebase(): Promise<Match[] | null> {
    try {
        // 1. Try Firebase Admin SDK
        if (adminDb) {
            const snapshot = await adminDb.ref('matches').get();
            if (snapshot.exists()) {
                const data = snapshot.val();
                return formatRawMatches(data);
            }
        }
    } catch (err: any) {
        console.warn('Firebase Admin fetch notice:', err?.message || err);
    }

    try {
        // 2. Direct REST fallback with low latency
        const databaseURL =
            process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
            'https://football-888-b9a7e-default-rtdb.asia-southeast1.firebasedatabase.app';
        const restRes = await fetch(`${databaseURL}/matches.json`, {
            cache: 'no-store',
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 0 },
        });

        if (restRes.ok) {
            const restData = await restRes.json();
            if (restData) {
                return formatRawMatches(restData);
            }
        }
    } catch (restErr: any) {
        console.warn('Firebase REST fetch notice:', restErr?.message || restErr);
    }

    return null;
}

export async function GET() {
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
