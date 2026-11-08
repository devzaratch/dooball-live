import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';

// ตารางดาวซัลโว: ดึงจาก Firebase (แอดมินอัปเดตได้) ถ้าไม่มีให้ client ใช้ข้อมูลตัวอย่างแทน
export async function GET(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
        const rateCheck = checkRateLimit(`scorers_${ip}`, 60, 60_000);
        if (!rateCheck.allowed) {
            return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
        }

        const leagueId = new URL(req.url).searchParams.get('l') || '4328';
        if (!/^[0-9]{3,6}$/.test(leagueId)) {
            return NextResponse.json({ success: false, error: 'Invalid league id' }, { status: 400 });
        }

        const snap = await adminDb.ref(`top_scorers/${leagueId}`).once('value');
        const data = snap.val();

        if (data && Array.isArray(data.scorers) && data.scorers.length > 0) {
            return NextResponse.json(
                { success: true, source: 'live', scorers: data.scorers, assists: Array.isArray(data.assists) ? data.assists : [] },
                { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
            );
        }

        return NextResponse.json({ success: true, source: 'sample', scorers: [], assists: [] }, {
            headers: { 'Cache-Control': 'public, s-maxage=300' },
        });
    } catch (err) {
        console.error('Scorers API error:', err);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}
