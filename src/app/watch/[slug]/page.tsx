import { Metadata } from 'next';
import WatchClient from './WatchClient'; // แยก Client ส่วนที่เหลือออกมา

import { adminDb } from '@/lib/firebaseAdmin';

// Fetch match data from server-side using Firebase Admin SDK
async function getMatch(slug: string) {
    try {
        const snapshot = await adminDb.ref('matches').once('value');
        const rawData = snapshot.val();
        
        if (!rawData) return null;
        
        // Parse array or object
        const rawArray = Array.isArray(rawData) 
            ? rawData 
            : Object.keys(rawData).map(key => ({ id: key, ...rawData[key] }));
            
        // Find the match that matches the slug or id
        const match = rawArray.find(
            (m) => m && (String(m.slug) === slug || String(m.id) === slug)
        );
        
        return match || null;
    } catch (error) {
        console.error("Error fetching match for metadata:", error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const match = await getMatch(slug);
    
    if (match) {
        const homeName = match.homeTeam?.name || match.home || 'ทีมเหย้า';
        const awayName = match.awayTeam?.name || match.away || 'ทีมเยือน';
        const leagueName = match.league?.name || match.league || 'ฟุตบอลสด';
        const timeStr = match.kickoffTime || 'ถ่ายทอดสด';
        
        const ogImageUrl = `/api/og?home=${encodeURIComponent(homeName)}&away=${encodeURIComponent(awayName)}&league=${encodeURIComponent(leagueName)}&time=${encodeURIComponent(timeStr)}`;

        return {
            title: `🔴 ดูบอลสด: ${homeName} VS ${awayName} (${leagueName}) | Dooball Live`,
            description: `ถ่ายทอดสดฟุตบอล ${leagueName} ระหว่าง ${homeName} พบ ${awayName} เวลา ${timeStr} น. คมชัดระดับ HD ไม่กระตุก ฟรี ไม่ต้องสมัครสมาชิก`,
            keywords: [`ดูบอลสด ${homeName}`, `ดูบอลสด ${awayName}`, `ถ่ายทอดสด ${homeName} ${awayName}`, leagueName, 'ดูบอลฟรี'],
            openGraph: {
                title: `🔴 ดูบอลสด: ${homeName} VS ${awayName}`,
                description: `ถ่ายทอดสดฟุตบอล ${leagueName} ระหว่าง ${homeName} พบ ${awayName} เวลา ${timeStr} น. คมชัด HD ฟรี`,
                siteName: 'Dooball Live',
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: `${homeName} VS ${awayName} ${leagueName}`
                    }
                ],
                locale: 'th_TH',
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: `🔴 ดูบอลสด: ${homeName} VS ${awayName}`,
                description: `ถ่ายทอดสด ${leagueName} คมชัด HD ไม่กระตุก ฟรี`,
                images: [ogImageUrl],
            }
        };
    }

    // Fallback if match not found
    const fallbackOgUrl = `/api/og?home=คู่แข่งขัน&away=ถ่ายทอดสด&league=DooballLive`;
    return {
        title: `🔴 ดูบอลสด: ${slug.replace(/-/g, ' ')} | Dooball Live`,
        description: "รวมลิงก์ถ่ายทอดสดฟุตบอลคุณภาพสูงแบบเรียลไทม์ คมชัดระดับ HD ไม่กระตุก",
        openGraph: {
            title: `ดูบอลสดออนไลน์ | Dooball Live`,
            description: `รวมลิงก์ถ่ายทอดสดฟุตบอลคุณภาพสูงแบบเรียลไทม์`,
            images: [{ url: fallbackOgUrl, width: 1200, height: 630 }]
        }
    };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return <WatchClient slug={slug} />;
}