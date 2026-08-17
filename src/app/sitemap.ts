import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008';

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

    // Dynamic match watch pages from Firebase with 3s Timeout Guard
    try {
        const fetchPromise = adminDb.ref('matches').once('value');
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firebase sitemap timeout')), 3000)
        );

        const snapshot = (await Promise.race([fetchPromise, timeoutPromise])) as any;
        const rawData = snapshot ? snapshot.val() : null;

        if (rawData) {
            const matches = Array.isArray(rawData)
                ? rawData
                : Object.keys(rawData).map((key) => ({ id: key, ...rawData[key] }));

            matches.forEach((m) => {
                if (m && (m.slug || m.id)) {
                    routes.push({
                        url: `${baseUrl}/watch/${m.slug || m.id}`,
                        lastModified: new Date(),
                        changeFrequency: 'always',
                        priority: 0.95,
                    });
                }
            });
        }
    } catch (err) {
        console.warn('Notice: Using static routes for sitemap (Firebase fallback):', err);
    }

    return routes;
}
