import { NextResponse } from 'next/server';

export interface ApiNewsArticle {
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
    link: string;
    isFeatured?: boolean;
}

export async function GET() {
    const feeds = [
        { name: 'ข่าวสด กีฬา', url: 'https://www.khaosod.co.th/sports/feed' },
        { name: 'มติชน กีฬา', url: 'https://www.matichon.co.th/sport/feed' },
    ];

    const footballKeywords = [
        'ฟุตบอล', 'พรีเมียร์ลีก', 'แมนยู', 'ลิเวอร์พูล', 'อาร์เซนอล', 'แมนซิตี้', 'เชลซี', 
        'สเปอร์ส', 'ยูฟ่า', 'เรอัล มาดริด', 'บาร์เซโลนา', 'บอล', 'ย้ายทีม', 'ผลบอล', 
        'ชิงแชมป์', 'คอมมิวนิตี', 'ลีก', 'สโมสร', 'กุนซือ', 'นักเตะ', 'ลาลีกา', 'เซเรียอา',
        'บุนเดสลีกา', 'ทีมชาติ'
    ];

    const articles: ApiNewsArticle[] = [];

    for (const f of feeds) {
        try {
            const res = await fetch(f.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                next: { revalidate: 1800 } // Cache 30 นาที
            });

            if (!res.ok) continue;

            const xml = await res.text();
            const items = xml.split('<item>');

            for (let i = 1; i < items.length; i++) {
                const raw = items[i];
                const titleMatch = raw.match(/<title>([\s\S]*?)<\/title>/);
                const linkMatch = raw.match(/<link>([\s\S]*?)<\/link>/);
                const dateMatch = raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
                const descMatch = raw.match(/<description>([\s\S]*?)<\/description>/);
                const imgMatch = raw.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i) || raw.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);

                let title = titleMatch 
                    ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&#8211;/g, '-').replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/&#8217;/g, "'").trim() 
                    : '';
                let link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
                let dateStr = dateMatch ? dateMatch[1].trim() : '';
                let desc = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim() : '';
                let img = imgMatch ? imgMatch[1] : '';

                // คัดกรองข่าวที่เป็นฟุตบอลเท่านั้น
                const isFootball = footballKeywords.some((kw) => title.includes(kw) || desc.includes(kw));

                if (isFootball && title && link) {
                    let category: ApiNewsArticle['category'] = 'ข่าวพรีเมียร์ลีก';
                    if (title.includes('ย้าย') || title.includes('ซื้อขาย') || title.includes('ล่าตัว') || title.includes('สัญญา')) category = 'ข่าวซื้อขาย';
                    else if (title.includes('ยูฟ่า') || title.includes('แชมเปียนส์')) category = 'ยูฟ่าแชมเปียนส์ลีก';
                    else if (title.includes('ผล') || title.includes('สรุป')) category = 'สรุปผลบอล';
                    else if (title.includes('สเปน') || title.includes('ลาลีกา') || title.includes('มาดริด') || title.includes('บาร์ซ่า')) category = 'ลาลีกา';

                    let formattedDate = 'เมื่อวานนี้';
                    if (dateStr) {
                        try {
                            const d = new Date(dateStr);
                            formattedDate = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                        } catch {}
                    }

                    articles.push({
                        id: 'live-' + Math.random().toString(36).substring(2, 9),
                        slug: link,
                        title,
                        summary: desc.length > 180 ? desc.substring(0, 180) + '...' : desc || title,
                        content: [
                            desc,
                            'รายงานข่าวสารฟุตบอลอัปเดตเรียลไทม์จากสำนักข่าวชั้นนำของประเทศไทย สามารถติดตามรายละเอียดเพิ่มเติมได้ทางเว็บไซต์ต้นฉบับ'
                        ],
                        category,
                        image: img || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
                        author: f.name,
                        date: formattedDate,
                        views: Math.floor(Math.random() * 8000) + 1500,
                        readTime: '3 นาที',
                        link,
                        isFeatured: articles.length === 0,
                    });
                }
            }
        } catch (err) {
            console.error('API News fetch error:', err);
        }
    }

    return NextResponse.json({
        success: true,
        count: articles.length,
        articles: articles.slice(0, 24),
    });
}
