import { Metadata } from 'next';
import HighlightsClient from './HighlightsClient';

export const metadata: Metadata = {
    title: '🎬 ไฮไลท์ฟุตบอลย้อนหลัง HD ทุกคู่ทุกลีก | Dooball Live Official',
    description: 'รวมคลิปไฮไลท์ฟุตบอลย้อนหลัง พรีเมียร์ลีก ยูฟ่า แชมเปียนส์ลีก คมชัดระดับ HD จากช่องทางการ Official (ໄຮໄລ້ບານເຕະຍ້ອນຫຼັງ)',
    keywords: ['ไฮไลท์บอล', 'ไฮไลท์ฟุตบอลย้อนหลัง', 'ไฮไลท์พรีเมียร์ลีก', 'คลิปไฮไลท์บอล', 'ໄຮໄລ້ບານເຕະຍ້ອນຫຼັງ'],
    openGraph: {
        title: '🎬 ไฮไลท์ฟุตบอลย้อนหลัง HD ทุกคู่ทุกลีก',
        description: 'ชมคลิปไฮไลท์ฟุตบอลย้อนหลัง พรีเมียร์ลีก ยูฟ่า แชมเปียนส์ลีก คมชัดระดับ HD',
        images: [{ url: '/api/og?home=ไฮไลท์บอล&away=ย้อนหลังHD&league=DooballLive', width: 1200, height: 630 }],
    },
};

export default function HighlightsPage() {
    return <HighlightsClient />;
}
