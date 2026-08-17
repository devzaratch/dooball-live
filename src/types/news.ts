export interface NewsArticle {
    id: string;
    slug: string;
    title: string;
    summary: string;
    content: string[];
    category: 'ข่าวพรีเมียร์ลีก' | 'ข่าวซื้อขาย' | 'สรุปผลบอล' | 'ยูฟ่าแชมเปียนส์ลีก' | 'ลาลีกา';
    team?: string;
    image: string;
    author: string;
    date: string;
    views: number;
    readTime: string;
    link?: string;
    isFeatured?: boolean;
}
