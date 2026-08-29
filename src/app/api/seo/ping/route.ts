import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
    const ip = req?.headers?.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, 10, 60000); // Max 10 pings per minute
    if (!rateCheck.allowed) {
        return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008';
    const sitemapUrl = `${baseUrl}/sitemap.xml`;

    const results = {
        google: 'pending',
        bing: 'pending',
        timestamp: new Date().toISOString(),
    };

    try {
        // Ping Google
        const googleRes = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
        results.google = googleRes.status === 200 ? 'success (200)' : `status (${googleRes.status})`;
    } catch (err: any) {
        results.google = `error: ${err.message}`;
    }

    try {
        // Ping Bing
        const bingRes = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
        results.bing = bingRes.status === 200 ? 'success (200)' : `status (${bingRes.status})`;
    } catch (err: any) {
        results.bing = `error: ${err.message}`;
    }

    return NextResponse.json({
        success: true,
        message: 'Instant Search Engine Indexing Notification sent!',
        results,
    });
}
