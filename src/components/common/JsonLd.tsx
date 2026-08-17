import React from 'react';

interface JsonLdProps {
    type?: 'website' | 'event' | 'faq';
    data?: any;
}

export default function JsonLd({ type = 'website', data }: JsonLdProps) {
    let schemaData: any = null;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008';

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
        schemaData = {
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: `${data.homeTeam?.name || data.home || 'ทีมเหย้า'} vs ${data.awayTeam?.name || data.away || 'ทีมเยือน'}`,
            description: `ถ่ายทอดสดฟุตบอล ${data.league?.name || data.league || ''} ระหว่าง ${data.homeTeam?.name || data.home} พบ ${data.awayTeam?.name || data.away}`,
            startDate: new Date().toISOString(),
            competitor: [
                {
                    '@type': 'SportsTeam',
                    name: data.homeTeam?.name || data.home || 'Home Team',
                },
                {
                    '@type': 'SportsTeam',
                    name: data.awayTeam?.name || data.away || 'Away Team',
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
