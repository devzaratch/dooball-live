import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { checkStreamHealth } from '@/lib/streamHealth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const streamUrl = searchParams.get('url');

        // Extract client IP
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        // Apply Rate Limiting Guard (Max 30 health pings / minute)
        const rateCheck = checkRateLimit(ip, 30, 60000);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded. Please try again later.' },
                { status: 429 }
            );
        }

        if (!streamUrl) {
            return NextResponse.json(
                { success: false, error: 'Missing stream URL parameter' },
                { status: 400 }
            );
        }

        const health = await checkStreamHealth(streamUrl);

        return NextResponse.json({
            success: true,
            url: streamUrl,
            healthy: health.healthy,
            status: health.status,
            latencyMs: health.latency,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
