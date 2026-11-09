import React from 'react';

interface JsonLdProps {
    type?: 'website' | 'event' | 'faq';
    data?: Record<string, unknown>;
}

export default function JsonLd({ type = 'website', data }: JsonLdProps) {
    let schemaData: Record<string, unknown> | null = null;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dooball-laos.vercel.app';

    if (type === 'website') {
        schemaData = {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Dooball Live',
            alternateName: ['ดูบอลสด', 'ເບິ່ງບານສົດ', 'Dooball Live TH LA'],
            url: baseUrl,
            description: 'รวมลิงก์ดูบอลสด ถ่ายทอดสดฟุตบอลครบทุกลีก คมชัดระดับ 4K HD ไม่กระตุก รองรับการรับชมในไทยและลาว',
            potentialAction: {
                '@type': 'SearchAction',
                target: `${baseUrl}/?search={search_term_string}`,
                'query-input': 'required name=search_term_string',
            },
            inLanguage: ['th-TH', 'lo-LA'],
        };
    } else if (type === 'event' && data) {
        const homeName = String((data.homeTeam as Record<string, unknown> | undefined)?.name || data.home || 'ทีมเหย้า');
        const awayName = String((data.awayTeam as Record<string, unknown> | undefined)?.name || data.away || 'ทีมเยือน');
        const leagueName = String((data.league as Record<string, unknown> | undefined)?.name || data.league || '');

        schemaData = {
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: `${homeName} vs ${awayName}`,
            description: `ถ่ายทอดสดฟุตบอล ${leagueName} ระหว่าง ${homeName} พบ ${awayName}`,
            startDate: new Date().toISOString(),
            competitor: [
                {
                    '@type': 'SportsTeam',
                    name: homeName,
                },
                {
                    '@type': 'SportsTeam',
                    name: awayName,
                },
            ],
            location: {
                '@type': 'Place',
                name: 'Dooball Live Stadium Stream',
            },
        };
    } else if (type === 'faq') {
        schemaData = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
                {
                    '@type': 'Question',
                    name: 'ดูบอลสดฟรีผ่าน Dooball Live ต้องเสียค่าบริการไหม?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'รับชมฟรี 100% ไม่เสียค่าบริการ ไม่ต้องสมัครสมาชิก รองรับทั้งในประเทศไทยและประเทศลาว',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'สามารถดูบอลสดผ่านมือถือ iPhone และ Android ได้ไหม?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'สามารถรับชมผ่านมือถือ สมาร์ตทีวี และแท็บเล็ตได้ทุกรุ่น คมชัดระดับ Full HD ไม่กระตุก พร้อมปุ่มติดตั้ง PWA App',
                    },
                },
                {
                    '@type': 'Question',
                    name: 'มีลิงก์ถ่ายทอดสดฟุตบอลลีกอะไรบ้าง?',
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'มีถ่ายทอดสดพรีเมียร์ลีก อังกฤษ, ยูฟ่า แชมเปียนส์ลีก, ลาลีกา สเปน, บุนเดสลีกา เยอรมนี, เซเรียอา อิตาลี และบอลไทย',
                    },
                },
            ],
        };
    }

    if (!schemaData) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
    );
}
