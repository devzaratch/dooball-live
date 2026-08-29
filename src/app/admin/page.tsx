import { Metadata } from 'next';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
    title: 'ศูนย์ควบคุมผู้ดูแลระบบ | Dooball-Live Operations Room',
    description: 'ระบบรับแจ้งลิงก์เสีย ตรวจสอบแชทสด และประกาศทางการ Dooball-Live',
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminPage() {
    return <AdminClient />;
}
