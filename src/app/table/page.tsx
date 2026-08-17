import { Metadata } from 'next';
import TableClient from './TableClient';

export const metadata: Metadata = {
    title: '🏆 ตารางคะแนนพรีเมียร์ลีก และ 5 ลีกใหญ่ยุโรป อัปเดตล่าสุด | Dooball Live',
    description: 'อัปเดตตารางคะแนนฟุตบอลเรียลไทม์ 5 ลีกใหญ่ยุโรป พรีเมียร์ลีก ลาลีกา เซเรียอา บุนเดสลีกา ลีกเอิง (ຕາຕະລາງຄະແນນບານເຕະ)',
    keywords: ['ตารางคะแนนพรีเมียร์ลีก', 'ตารางคะแนนฟุตบอล', 'อันดับพรีเมียร์ลีก', 'ตารางคะแนนล่าสุด', 'ຕາຕະລາງຄະແນນບານເຕະ'],
    openGraph: {
        title: '🏆 ตารางคะแนนพรีเมียร์ลีก และ 5 ลีกใหญ่ยุโรป อัปเดตล่าสุด',
        description: 'เช็กอันดับตารางคะแนนฟุตบอลเรียลไทม์ พรีเมียร์ลีก ลาลีกา เซเรียอา บุนเดสลีกา',
        images: [{ url: '/api/og?home=ตารางคะแนน&away=5ลีกใหญ่ยุโรป&league=DooballLive', width: 1200, height: 630 }],
    },
};

export default function TablePage() {
    return <TableClient />;
}
