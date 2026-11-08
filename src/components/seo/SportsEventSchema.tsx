import { Match } from '@/types/football';

// 🏆 SportsEvent JSON-LD Schema — เป็น Server Component (render ติดใน HTML จริง)
// วัตถุประสงค์: ให้ Google ประกาศคู่แข่งขันในผลการค้นหา + เข้าใจบริบทหน้า watch มากขึ้น
// NOTE: ต้อง render จาก Server Component เท่านั้น (JSON-LD จาก component แบบ ssr:false จะไม่ปรากฏใน HTML ที่ Google เก็บ)

interface SportsEventSchemaProps {
    match: Match;
    slug: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dooballlaos.com';

function buildStartDate(kickoffTime: string): string | undefined {
    // เวลาเตะอาจเป็น ISO string หรือ "20:00" — พยายามทั้งสองแบบ, ไม่ถูกต้องก็ไม่ใส่ฟิลด์นี้
    try {
        // 1) เป็น ISO อยู่แล้ว
        const iso = new Date(kickoffTime);
        if (!isNaN(iso.getTime())) return iso.toISOString();

        // 2) เป็น "20:00" ลองกับวันที่ที่มี (date_string เป็นภาษาไทย แปลไม่ได้ — ตีเป็น "วันที่อัปเดตล่าสุด" ของข้อมูล)
        if (/^\d{1,2}:?\d{2}$/.test(kickoffTime)) {
            const hhmm = kickoffTime.includes(':') ? kickoffTime : `${kickoffTime}:00`;
            return `${new Date().toISOString().slice(0, 10)}T${hhmm}:00+07:00`;
        }
    } catch {
        /* ละทิ้ง schema startDate ที่เป็นกากไว้ก่อน */
    }
    return undefined;
}

export default function SportsEventSchema({ match, slug }: SportsEventSchemaProps) {
    const homeName = match.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match.awayTeam?.name || 'ทีมเยือน';
    const leagueName = match.league?.name || 'ฟุตบอลสด';
    const eventUrl = `${SITE_URL}/watch/${match.slug || slug}`;

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: `${homeName} พบ ${awayName} — ${leagueName}`,
        sport: 'Football',
        description: `ถ่ายทอดสดฟุตบอล ${leagueName} ระหว่าง ${homeName} พบ ${awayName} ฟรี คมชัดระดับ HD`,
        url: eventUrl,
        ...(match.kickoffTime ? { startDate: buildStartDate(match.kickoffTime) } : {}),
        eventStatus: match.status === 'UPCOMING' || match.status === 'LIVE'
            ? 'https://schema.org/EventScheduled'
            : 'https://schema.org/EventScheduled',
        location: {
            '@type': 'Place',
            name: `${homeName} Arena`,
        },
        competitor: [
            {
                '@type': 'SportsTeam',
                name: homeName,
                ...(match.homeTeam?.logo ? { logo: match.homeTeam.logo } : {}),
            },
            {
                '@type': 'SportsTeam',
                name: awayName,
                ...(match.awayTeam?.logo ? { logo: match.awayTeam.logo } : {}),
            },
        ],
        broadcastEvent: {
            '@type': 'BroadcastEvent',
            name: `ถ่ายทอดสด ${homeName} vs ${awayName}`,
            isLiveOnly: match.status === 'LIVE',
            broadcastOfEvent: eventUrl,
            potentialAction: {
                '@type': 'WatchAction',
                target: eventUrl,
            },
        },
        provider: {
            '@type': 'Organization',
            name: 'Dooball Live',
            url: SITE_URL,
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
