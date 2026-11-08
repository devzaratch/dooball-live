import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';
import { getMatchRoomKey } from '@/lib/utils';

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate Limit: 10 reports per minute per IP
    const rateCheck = checkRateLimit(`stream_report_${ip}`, 10, 60 * 1000);
    if (!rateCheck.allowed) {
        return NextResponse.json(
            { success: false, error: 'คุณส่งรายงานบ่อยเกินไป กรุณารอสักครู่' },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const { matchId, matchName, streamId, streamLabel, streamUrl, reasonId, reasonLabel, note } = body;

        if (!matchId || !streamId) {
            return NextResponse.json(
                { success: false, error: 'Missing required matchId or streamId' },
                { status: 400 }
            );
        }

        const roomKey = getMatchRoomKey(matchId);
        const cleanStreamId = String(streamId).replace(/[.$#[\]/]/g, '_').trim();
        const timestamp = Date.now();

        // 1. Transaction to increment count on stream_reports
        const countRef = adminDb.ref(`stream_reports/${roomKey}/${cleanStreamId}/count`);
        await countRef.transaction((current) => (current || 0) + 1);

        // 2. Set summary details
        const summaryRef = adminDb.ref(`stream_reports/${roomKey}/${cleanStreamId}/summary`);
        await summaryRef.set({
            matchName: matchName || roomKey,
            streamLabel: streamLabel || 'ลิงก์ถ่ายทอดสด',
            streamUrl: streamUrl || '',
            lastReportedAt: timestamp,
        });

        // 3. Log detail entry
        const logsRef = adminDb.ref('stream_reports_logs');
        await logsRef.push({
            matchId: roomKey,
            matchName: matchName || roomKey,
            streamId: cleanStreamId,
            streamLabel: streamLabel || 'ลิงก์ถ่ายทอดสด',
            streamUrl: streamUrl || '',
            reasonId: reasonId || 'broken_link',
            reasonLabel: reasonLabel || 'แจ้งลิงก์เสีย',
            note: (note || '').trim(),
            timestamp,
        });

        return NextResponse.json({
            success: true,
            message: 'บันทึกรายงานสัญญาณเสียสำเร็จ',
        });
    } catch (err) {
        console.error('API report-stream error:', err);
        return NextResponse.json(
            { success: false, error: 'Internal error' },
            { status: 500 }
        );
    }
}
