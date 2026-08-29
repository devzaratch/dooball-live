import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export interface ApiHighlightVideo {
    id: string;
    videoId: string;
    title: string;
    league: string;
    channelName: string;
    thumbnail: string;
    date: string;
    publishedAt: number;
    views?: string;
    duration?: string;
}

const CHANNELS = [
    { name: 'beIN SPORTS Thailand', id: 'UCjKaVLLwalH_DSCHaricw3w', defaultLeague: 'ยูฟ่า แชมเปียนส์ลีก' },
    { name: 'TrueVisions Official', id: 'UCLFem49cKUGGzpZSUu9RhxQ', defaultLeague: 'พรีเมียร์ลีก' },
    { name: 'ช้างศึก - ฟุตบอลทีมชาติไทย', id: 'UCux9LfrpZSYClHFBbPbnniA', defaultLeague: 'ทีมชาติไทย / บอลไทย' },
];

function formatThaiRelativeTime(publishedDate: string): { label: string; timestamp: number } {
    try {
        const date = new Date(publishedDate);
        const now = Date.now();
        const diffMs = now - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return { label: 'เมื่อไม่กี่นาทีที่แล้ว', timestamp: date.getTime() };
        if (diffHours < 24) return { label: `เมื่อ ${diffHours} ชั่วโมงที่แล้ว`, timestamp: date.getTime() };
        if (diffDays === 1) return { label: 'เมื่อวานนี้', timestamp: date.getTime() };
        if (diffDays < 7) return { label: `${diffDays} วันที่แล้ว`, timestamp: date.getTime() };
        const weeks = Math.floor(diffDays / 7);
        return { label: `${weeks} สัปดาห์ที่แล้ว`, timestamp: date.getTime() };
    } catch {
        return { label: 'ล่าสุด', timestamp: Date.now() };
    }
}

function detectLeague(title: string, defaultLeague: string): string {
    const t = title.toLowerCase();
    if (t.includes('champions league') || t.includes('ucl') || t.includes('ยูฟ่า') || t.includes('แชมเปียนส์') || t.includes('แชมเปี้ยนส์')) {
        return 'ยูฟ่า แชมเปียนส์ลีก';
    }
    if (t.includes('premier league') || t.includes('epl') || t.includes('พรีเมียร์') || t.includes('พรีเมียร์ลีก')) {
        return 'พรีเมียร์ลีก';
    }
    if (t.includes('laliga') || t.includes('la liga') || t.includes('ลาลีกา') || t.includes('เรอัล มาดริด') || t.includes('บาร์เซโลน่า') || t.includes('เบติส')) {
        return 'ลาลีกา';
    }
    if (t.includes('serie a') || t.includes('เซเรียอา') || t.includes('เซเรีย อา') || t.includes('ยูเวนตุส') || t.includes('มิลาน') || t.includes('อินเตอร์')) {
        return 'เซเรียอา';
    }
    if (t.includes('bundesliga') || t.includes('บุนเดสลีกา') || t.includes('บาเยิร์น') || t.includes('ดอร์ทมุนด์')) {
        return 'บุนเดสลีกา';
    }
    if (t.includes('ช้างศึก') || t.includes('ทีมชาติไทย') || t.includes('ไทยลีก') || t.includes('ชิงแชมป์อาเซียน') || t.includes('fa thailand') || t.includes('เวียดนาม-ไทย')) {
        return 'ทีมชาติไทย / บอลไทย';
    }
    return defaultLeague;
}

export async function GET(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`highlights_${ip}`, 60, 60000);
    if (!rateCheck.allowed) {
        return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    try {
        const fetchPromises = CHANNELS.map(async (channel) => {
            const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
            const res = await fetch(feedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                },
                next: { revalidate: 1800 }, // Cache 30 นาทีบนเซิร์ฟเวอร์
            });

            if (!res.ok) return [];

            const xml = await res.text();
            const rawEntries = xml.split('<entry>');
            const channelVideos: ApiHighlightVideo[] = [];

            for (let i = 1; i < rawEntries.length; i++) {
                const entry = rawEntries[i];
                const videoIdMatch = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
                const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
                const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/);

                if (!videoIdMatch || !titleMatch) continue;

                const videoId = videoIdMatch[1].trim();
                const rawTitle = titleMatch[1].trim();
                const titleLower = rawTitle.toLowerCase();

                // กรองเฉพาะคลิปที่เป็นไฮไลท์, ประตู หรือแมตช์ฟุตบอล
                const isHighlight = 
                    titleLower.includes('ไฮไลต์') || 
                    titleLower.includes('ไฮไลท์') || 
                    titleLower.includes('highlight') || 
                    titleLower.includes('golazo') ||
                    titleLower.includes('full match') || 
                    titleLower.includes('vs') || 
                    titleLower.includes('พบ') ||
                    titleLower.includes('ชนะ') ||
                    titleLower.includes('ถล่ม') ||
                    titleLower.includes('ประตู');

                if (!isHighlight) continue;

                const { label: dateLabel, timestamp } = formatThaiRelativeTime(publishedMatch ? publishedMatch[1] : new Date().toISOString());
                const league = detectLeague(rawTitle, channel.defaultLeague);

                channelVideos.push({
                    id: `yt-${videoId}`,
                    videoId,
                    title: rawTitle,
                    league,
                    channelName: channel.name,
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    date: dateLabel,
                    publishedAt: timestamp,
                    views: 'Official HD',
                    duration: 'Full HD',
                });
            }

            return channelVideos;
        });

        const results = await Promise.allSettled(fetchPromises);
        let allVideos: ApiHighlightVideo[] = [];

        results.forEach((r) => {
            if (r.status === 'fulfilled') {
                allVideos = allVideos.concat(r.value);
            }
        });

        // เรียงลำดับจากวิดีโอที่เผยแพร่ใหม่ที่สุดไปหาเก่า
        allVideos.sort((a, b) => b.publishedAt - a.publishedAt);

        // Fallback หากช่อง YouTube ปิดการเชื่อมต่อชั่วคราว ให้มีคลิปคุณภาพแสดงผลเสมอ
        if (allVideos.length === 0) {
            allVideos = [
                {
                    id: 'hl-fallback-1',
                    videoId: 'ud6YGDqqak4',
                    title: 'บาเลนเซีย 0-1 เรอัล เบติส | ลาลีกา ไฮไลต์ LaLiga',
                    league: 'ลาลีกา',
                    channelName: 'beIN SPORTS Thailand',
                    thumbnail: 'https://i.ytimg.com/vi/ud6YGDqqak4/hqdefault.jpg',
                    date: 'วันนี้',
                    publishedAt: Date.now() - 3600000,
                    views: 'Official HD',
                    duration: 'Full HD',
                },
                {
                    id: 'hl-fallback-2',
                    videoId: 'ZmjMPYCBuvA',
                    title: 'ซาบาห์ 5-2 ฮาโปเอล เบียร์ เชว่า | ยูฟ่า แชมเปียนส์ ลีก ไฮไลต์',
                    league: 'ยูฟ่า แชมเปียนส์ลีก',
                    channelName: 'beIN SPORTS Thailand',
                    thumbnail: 'https://i.ytimg.com/vi/ZmjMPYCBuvA/hqdefault.jpg',
                    date: 'เมื่อวานนี้',
                    publishedAt: Date.now() - 86400000,
                    views: 'Official HD',
                    duration: 'Full HD',
                },
            ];
        }

        return NextResponse.json(
            {
                success: true,
                count: allVideos.length,
                updatedAt: new Date().toISOString(),
                highlights: allVideos,
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
                },
            }
        );
    } catch (err: any) {
        console.error('API /api/highlights error:', err);
        return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
    }
}
