import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
    try {
        const ip = req?.headers?.get('x-forwarded-for') || '127.0.0.1';
        const rateCheck = checkRateLimit(ip, 60, 60000);
        if (!rateCheck.allowed) {
            return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
        }

        const { searchParams } = new URL(req.url);
        const leagueId = searchParams.get('l') || '4328';
        const season = searchParams.get('s') || '2024-2025';

        const externalUrl = `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${encodeURIComponent(leagueId)}&s=${encodeURIComponent(season)}`;

        // Server-Side Fetch with Next.js Cache (revalidate every 5 minutes / 300s)
        const res = await fetch(externalUrl, {
            next: { revalidate: 300 },
        });

        if (!res.ok) {
            return NextResponse.json({ success: false, error: 'External API response error' }, { status: res.status });
        }

        const data = await res.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
