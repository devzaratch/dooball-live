import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

// 🔴 force-dynamic: สำคัญมาก — sitemap ต้องเป็น Route แบบ ƒ (dynamic),
// ไม่ใช่ ○ (static) ที่ถูกตอกติดตอน build เพราะหน้าแมตช์ใหม่ต้องให้ Google เจอเร็วก่อนเวลาแข่ง
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dooballlaos.com';

    // Static pages
    const routes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/table`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/highlights`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/news`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
    ];

    // Dynamic match watch pages from Firebase with 5s Timeout Guard
    try {
        const fetchPromise = adminDb.ref('matches').once('value');
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firebase sitemap timeout')), 5000)
        );

        const snapshot = (await Promise.race([fetchPromise, timeoutPromise])) as
            | { val: () => Record<string, unknown> | Array<Record<string, unknown> | null> | null }
            | null;
        const rawData = snapshot ? snapshot.val() : null;

        if (rawData) {
            // ⚠️ ข้อมูลดิบใน Firebase มาในรูปแบบ TheSportsDB (snake_case: home/away/embed_url)
            // จึงต้องแปลง slug ด้วยสูตรเดียวกับ /api/matches เพื่อให้ URL ตรงกับหน้าจริง
            const entries: Array<Record<string, unknown> | null> = Array.isArray(rawData)
                ? rawData
                : Object.entries(rawData).map(([key, value]) => ({ id: key, ...(value as object) }));

            entries.forEach((raw, index) => {
                if (!raw || typeof raw !== 'object') return;

                const rawHomeTeam = raw.homeTeam as { name?: string } | undefined;
                const rawAwayTeam = raw.awayTeam as { name?: string } | undefined;
                const homeSlug = String(raw.home || rawHomeTeam?.name || 'home').replace(/\s+/g, '-');
                const awaySlug = String(raw.away || rawAwayTeam?.name || 'away').replace(/\s+/g, '-');
                const slug = String(raw.slug || `${homeSlug.toLowerCase()}-vs-${awaySlug.toLowerCase()}`);
                const fallbackId = String(raw.id ?? index);

                // สถานะจบแบบย่อตามข้อมูลจริงของ TheSportsDB + ไทย
                const statusRaw = String(raw.status || '').trim().toLowerCase();
                const finished =
                    statusRaw === 'finished' || statusRaw === 'ft' || statusRaw === 'ended' ||
                    statusRaw === 'aet' || statusRaw === 'pen' || statusRaw === 'full-time' ||
                    String(raw.status || '').trim() === 'จบการแข่งขัน';

                routes.push({
                    url: `${baseUrl}/watch/${slug || fallbackId}`,
                    lastModified: new Date(),
                    changeFrequency: finished ? 'daily' : 'always',
                    priority: finished ? 0.6 : 0.95,
                });
            });
        }
    } catch (err) {
        console.warn('Notice: Using static routes for sitemap (Firebase fallback):', err);
    }

    return routes;
}
