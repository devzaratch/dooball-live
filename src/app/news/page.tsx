import { Metadata } from 'next';
import NewsClient from './NewsClient';

export const metadata: Metadata = {
    title: '📰 ข่าวฟุตบอลล่าสุด สรุปผลบอล ข่าวซื้อขายนักเตะ | Dooball Live',
    description: 'อัปเดตข่าวสารฟุตบอลเด็ดประจำวัน สรุปผลหลังเกม ข่าวซื้อขายนักเตะพรีเมียร์ลีก ลาลีกา ยูฟ่าแชมเปียนส์ลีก (ຂ່າວບານເຕະ)',
    keywords: ['ข่าวบอล', 'ข่าวฟุตบอลล่าสุด', 'ข่าวซื้อขายนักเตะ', 'สรุปผลบอล', 'ข่าวกีฬา', 'ຂ່າວບານເຕະ'],
    openGraph: {
        title: '📰 ข่าวฟุตบอลล่าสุด สรุปผลบอล ข่าวซื้อขายนักเตะ',
        description: 'อัปเดตข่าวสารฟุตบอลเด็ดประจำวัน ข่าวซื้อขายนักเตะทุกลีกดัง',
        images: [{ url: '/api/og?home=ข่าวฟุตบอล&away=ล่าสุดประจำวัน&league=DooballLive', width: 1200, height: 630 }],
    },
};

export default function NewsPage() {
    return <NewsClient />;
}
