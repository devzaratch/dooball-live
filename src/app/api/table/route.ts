import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
    try {
        const ip = req?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
        const rateCheck = checkRateLimit(`table_${ip}`, 60, 60000);
        if (!rateCheck.allowed) {
            return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
        }

        const { searchParams } = new URL(req.url);
        // รองรับทั้งพารามิเตอร์ l (หน้า /table) และ league (หน้าแรก) + whitelist ให้เป็นตัวเลข 3-6 หลัก
        const rawLeague = searchParams.get('l') || searchParams.get('league') || '4328';
        const rawSeason = searchParams.get('s') || searchParams.get('season') || '2026-2027';
        const leagueId = /^[0-9]{3,6}$/.test(rawLeague) ? rawLeague : '4328';
        const season = /^\d{4}-\d{4}$/.test(rawSeason) ? rawSeason : '2026-2027';

        // หมายเหตุ: TheSportsDB รับพารามิเตอร์ season (ไม่ใช่ s) และ l (ไม่ใช่ id)
        // 🔄 พ.ย. 2569: TheSportsDB ปิด key ฟรีเดิม ('3') ถาวร — ต้องใช้ key '123' ตัวใหม่
        const externalUrl = `https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l=${encodeURIComponent(leagueId)}&season=${encodeURIComponent(season)}`;

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
    } catch (err: unknown) {
        console.error('Table API error:', err);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}
