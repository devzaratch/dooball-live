import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request: Request) {
    try {
        const ip = request?.headers?.get('x-forwarded-for') || '127.0.0.1';
        const rateCheck = checkRateLimit(ip, 60, 60000);
        if (!rateCheck.allowed) {
            return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
        }
        const automatedMatches = [
            {
                id: 'auto_1',
                slug: 'ado-den-haag-vs-fc-groningen',
                home: 'เอดีโอ เดน ฮาก',
                away: 'เอฟซี โกรนิงเงิน',
                home_score: 2,
                away_score: 1,
                is_live: true,
                status: 'LIVE',
                currentMinute: '68',
                league: 'Netherlands | Eredivisie',
                league_logo: 'https://cdn.sportmonks.com/images/soccer/leagues/72.png',
                time: '17:15',
                date_string: '16 ส.ค 2569',
                date_order: 1,
                embed_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                streamLinks: [
                    { id: 's1', label: 'Server 1 (อัตโนมัติ Full HD)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', quality: '1080p' },
                    { id: 's2', label: 'Server 2 (อัตโนมัติ 720p)', url: 'https://test-streams.mux.dev/issue664_0/prog_index.m3u8', quality: '720p' },
                ],
            },
            {
                id: 'auto_2',
                slug: 'liverpool-vs-como',
                home: 'ลิเวอร์พูล',
                away: 'โคโม่',
                home_score: 3,
                away_score: 0,
                is_live: true,
                status: 'LIVE',
                currentMinute: '84',
                league: 'England | Premier League',
                league_logo: 'https://cdn.sportmonks.com/images/soccer/leagues/8.png',
                time: '20:00',
                date_string: '16 ส.ค 2569',
                date_order: 1,
                embed_url: 'https://test-streams.mux.dev/issue664_0/prog_index.m3u8',
                streamLinks: [
                    { id: 's1', label: 'Server 1 (อัตโนมัติ Full HD)', url: 'https://test-streams.mux.dev/issue664_0/prog_index.m3u8', quality: '1080p' },
                    { id: 's2', label: 'Server 2 (อัตโนมัติ 720p)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', quality: '720p' },
                ],
            },
            {
                id: 'auto_3',
                slug: 'real-madrid-vs-manchester-city',
                home: 'เรอัล มาดริด',
                away: 'แมนเชสเตอร์ ซิตี้',
                home_score: 0,
                away_score: 0,
                is_live: false,
                status: 'UPCOMING',
                currentMinute: '0',
                league: 'UEFA Champions League',
                league_logo: 'https://cdn.sportmonks.com/images/soccer/leagues/2.png',
                time: '02:00',
                date_string: '17 ส.ค 2569',
                date_order: 2,
                embed_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                streamLinks: [
                    { id: 's1', label: 'Server 1 (อัตโนมัติ Full HD)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', quality: '1080p' },
                ],
            },
            {
                id: 'auto_4',
                slug: 'barcelona-vs-bayern-munich',
                home: 'บาร์เซโลน่า',
                away: 'บาเยิร์น มิวนิค',
                home_score: 4,
                away_score: 2,
                is_live: false,
                status: 'FINISHED',
                currentMinute: 'FT',
                league: 'UEFA Champions League',
                league_logo: 'https://cdn.sportmonks.com/images/soccer/leagues/2.png',
                time: '23:00',
                date_string: '16 ส.ค 2569',
                date_order: 1,
                embed_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                streamLinks: [],
            },
        ];

        return NextResponse.json({
            success: true,
            message: 'Automated Live Match & Score Feed active',
            timestamp: new Date().toISOString(),
            matches: automatedMatches,
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
