'use client';

import { useState, useEffect } from 'react';
import { NewsArticle } from '@/types/news';
import { Newspaper, Flame, Calendar, Eye, Clock, Share2, Sparkles, ChevronRight, X, User, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import SocialShareBar from '@/components/common/SocialShareBar';

const MOCK_ARTICLES: NewsArticle[] = [
    {
        id: 'news-1',
        slug: 'liverpool-sign-top-striker',
        title: 'เด็ดขาด! ลิเวอร์พูล บรรลุข้อตกลงปิดดีลสโมสร ลุยศึกฤดูกาลใหม่เสริมคมแดนหน้า',
        summary: 'บอร์ดบริหารหงส์แดงเดินหน้าเต็มสูบ บรรลุข้อตกลงสัญญาคว้าตัวดาวยิงความเร็วสูง ร่วมทัพเสริมความเฉียบคมเรียบร้อยแล้ว',
        content: [
            'สโมสรฟุตบอลลิเวอร์พูล ทีมยักษ์ใหญ่แห่งศึกพรีเมียร์ลีก อังกฤษ ขยับตัวในตลาดซื้อขายนักเตะอย่างฮือฮา หลังบรรลุข้อตกลงส่วนตัวและสัญญาค่าตัวกับต้นสังกัดเดิมในการคว้าตัวกองหน้าตัวเก่งเข้ามาร่วมทีมเป็นที่เรียบร้อย',
            'การเสริมทัพในครั้งนี้ ถือเป็นการตอบโจทย์กุนซือใหญ่ที่ต้องการเพิ่มมิติในเกมรุกและความเด็ดขาดในการจบสกอร์ โดยนักเตะจะเดินทางมารับการตรวจร่างกายและเปิดตัวอย่างเป็นทางการในสัปดาห์นี้',
            'แฟนบอลหงส์แดงต่างแสดงความตื่นเต้นอย่างมากบนโลกโซเชียล โดยคาดว่าจะได้เห็นดาวเตะป้ายแดงรายนี้ลงสนามเปิดตัวนัดแรกในเกมอุ่นเครื่องปรีซีซั่นที่กำลังจะถึงนี้'
        ],
        category: 'ข่าวซื้อขาย',
        team: 'ลิเวอร์พูล',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
        author: 'ทีมข่าว Dooball Live',
        date: '16 ส.ค. 2026',
        views: 14500,
        readTime: '3 นาที',
        isFeatured: true,
    },
    {
        id: 'news-2',
        slug: 'man-utd-midfield-target',
        title: 'จัดหนัก! แมนฯ ยูไนเต็ด ยื่นข้อเสนอหลักสถิติสโมสร ล่าตัวมิดฟิลด์ดีกรีทีมชาติ',
        summary: 'ปีศาจแดงเร่งเครื่องหนัก เตรียมยื่นข้อเสนอทำลายสถิติคว้าตัวมิดฟิลด์ไดนาโมเข้าสู่นกถิ่นโอลด์ แทรฟฟอร์ด',
        content: [
            'แมนเชสเตอร์ ยูไนเต็ด ตกเป็นข่าวเตรียมยื่นข้อเสนอฉบับใหม่มูลค่ามหาศาล เพื่อขอซื้อตัวจอมทัพมิดฟิลด์ดีกรีทีมชาติเข้ามาร่วมทีมในตลาดนักเตะรอบนี้',
            'รายงานระบุว่า บอร์ดบริหารของปีศาจแดงมองว่ามิดฟิลด์รายนี้คือจิ๊กซอว์ชิ้นสำคัญที่จะเข้ามายกระดับแดนกลางและแก้ปัญหาการครองบอลในเกมใหญ่ได้อย่างลงตัว',
            'คาดว่าการเจรจาจะหาข้อสรุปได้ภายในไม่กี่วันข้างหน้า ท่ามกลางความสนใจจากหลายสโมสรชั้นนำในยุโรปเช่นกัน'
        ],
        category: 'ข่าวซื้อขาย',
        team: 'แมนฯ ยูไนเต็ด',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbb6b69288?w=800&auto=format&fit=crop&q=80',
        author: 'สายสืบตลาดนักเตะ',
        date: '16 ส.ค. 2026',
        views: 9800,
        readTime: '4 นาที',
    },
    {
        id: 'news-3',
        slug: 'arsenal-derby-victory',
        title: 'วิเคราะห์เจาะลึก 5 ประเด็นร้อนหลังเกม! อาร์เซน่อล เฉือนชนะ เชลซี คาดาร์บี้แมตช์',
        summary: 'เจาะลึกทุกแท็กติกและจังหวะสำคัญในศึกลอนดอนดาร์บี้แมตช์ ปืนใหญ่โชว์ฟอร์มสุดแกร่งเก็บ 3 แต้มสำคัญรั้งจ่าฝูง',
        content: [
            'จบลงไปอย่างดุเดือดสำหรับศึกลอนดอนดาร์บี้แมตช์ โดยเป็น อาร์เซน่อล ที่สามารถเปิดรังเอมิเรตส์ สเตเดี้ยม เฉือนชนะ เชลซี ไปได้อย่างสนุก 2-1',
            'เกมนี้ ปืนใหญ่ แสดงให้เห็นถึงวินัยในเกมรับและการเปลี่ยนจากรับเป็นรุกที่รวดเร็ว ขณะที่ เชลซี พยายามเปิดเกมบุกสู้แต่ต้านความเด็ดขาดของเจ้าถิ่นไม่ไหว',
            'ชัยชนะนัดนี้ส่งผลให้ อาร์เซน่อล ยังคงครองตำแหน่งจ่าฝูงพรีเมียร์ลีกต่อไปอย่างเหนียวแน่น พร้อมเดินหน้าล่าแชมป์เต็มตัว'
        ],
        category: 'ข่าวพรีเมียร์ลีก',
        team: 'อาร์เซนอล',
        image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80',
        author: 'คอลัมนิสต์ลูกหนัง',
        date: '15 ส.ค. 2026',
        views: 18200,
        readTime: '5 นาที',
    },
    {
        id: 'news-4',
        slug: 'real-madrid-ucl-comeback',
        title: 'คัมแบ็กสุดดราม่า! เรอัล มาดริด ยิง 2 ประตูรวดพลิกชนะ บาเยิร์น ลิ่วรอบชิง UCL',
        summary: 'ราชันชุดขาวโชว์ดีเอ็นเอเจ้าแห่งยุโรป โดนนำก่อนแต่พลิกแซงชนะ เสือใต้ ในช่วงทดเจ็บสุดระทึก',
        content: [
            'เรอัล มาดริด สร้างปาฏิหาริย์ในศึกยูฟ่า แชมเปียนส์ลีก อีกครั้ง หลังเปิดสนามซานติอาโก้ เบอร์นาเบว พลิกสถานการณ์จากตามหลัง 0-1 กลับมารับชัยชนะ 2-1 ในช่วงท้ายเกม',
            'ฮีโร่ในเกมนี้คือกองหน้าสำรองที่ลงมาเหมาคนเดียวสองประตูในช่วงนาทีที่ 88 และ 91 พาทีมทะยานเข้าสู่รอบชิงชนะเลิศได้อย่างยิ่งใหญ่',
            'ราชันชุดขาวจะเข้าไปพบกับคู่แข่งในรอบชิงชนะเลิศ ซึ่งถือเป็นการลุ้นถ้วยบิ๊กหูใบที่ 15 ของสโมสร'
        ],
        category: 'ยูฟ่าแชมเปียนส์ลีก',
        team: 'เรอัล มาดริด',
        image: 'https://images.unsplash.com/photo-1518605368461-1e1e38ce8058?w=800&auto=format&fit=crop&q=80',
        author: 'บรรณาธิการต่างประเทศ',
        date: '15 ส.ค. 2026',
        views: 22100,
        readTime: '4 นาที',
    },
    {
        id: 'news-5',
        slug: 'premier-league-recap',
        title: 'สรุปผลบอลพรีเมียร์ลีกเมื่อคืน หงส์แดงเฮชัย ปืนใหญ่รั้งจ่าฝูง เรือใบไล่จี้ติด',
        summary: 'สรุปผลการแข่งขันและตารางคะแนนพรีเมียร์ลีกหลังจบแมตช์เดย์ ลุ้นแชมป์สุดสูสี 3 ทีมบิ๊กเนม',
        content: [
            'สรุปผลการแข่งขันฟุตบอลพรีเมียร์ลีก อังกฤษ เมื่อคืนที่ผ่านมา ครบทุกคู่ทุกลีก โดยบรรดาแมตช์บิ๊กเนมต่างเก็บชัยชนะกันได้อย่างพร้อมหน้า',
            'อาร์เซน่อล ยังคงนำเป็นจ่าฝูงด้วยคะแนนนำ แมนเชสเตอร์ ซิตี้ เพียง 1 คะแนน ขณะที่ ลิเวอร์พูล เดินหน้าเก็บชัยชนะต่อเนื่องขึ้นมารั้งอันดับ 3',
            'การลุ้นพื้นที่ท็อปโฟร์และโซนตกชั้นเริ่มทวีความเข้มข้น แฟนบอลสามารถติดตามโปรแกรมถ่ายทอดสดนัดถัดไปได้ทาง Dooball Live'
        ],
        category: 'สรุปผลบอล',
        image: 'https://images.unsplash.com/photo-1508344928928-7137b29de216?w=800&auto=format&fit=crop&q=80',
        author: 'ทีมข่าว Dooball Live',
        date: '14 ส.ค. 2026',
        views: 11200,
        readTime: '3 นาที',
    },
    {
        id: 'news-6',
        slug: 'barcelona-laliga-preview',
        title: 'ปรีวิวลาลีกา! บาร์เซโลนา จัดทัพใหญ่ต้อนรับ บิลเบา คืนนี้ 02:00 น.',
        summary: 'เช็กความพร้อมล่าสุด รายชื่อ 11 ตัวจริงที่คาดว่าจะลงสนาม และสถิติ H2H ก่อนเกมลาลีกาสเปนคืนนี้',
        content: [
            'บาร์เซโลนา เตรียมเปิดสนามคัมป์ นู ต้อนรับการมาเยือนของ แอธเลติก บิลเบา ในศึกฟุตบอลลาลีกา สเปน คืนนี้ เวลา 02:00 น.',
            'เจ้าถิ่นไร้ปัญหาผู้เล่นบาดเจ็บเพิ่มเติม พร้อมส่ง 3 ประสานแนวรุกเต็มสูบ หวังเก็บ 3 คะแนนเต็มเพื่อไล่จี้จ่าฝูง',
            'ติดตามชมถ่ายทอดสดและเชียร์ไปพร้อมกันได้ทาง Dooball Live คมชัดระดับ HD'
        ],
        category: 'ลาลีกา',
        team: 'บาร์เซโลนา',
        image: 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&auto=format&fit=crop&q=80',
        author: 'เซียนบอลสเปน',
        date: '14 ส.ค. 2026',
        views: 8400,
        readTime: '3 นาที',
    },
];

const CATEGORIES = ['ทั้งหมด', 'ข่าวพรีเมียร์ลีก', 'ข่าวซื้อขาย', 'สรุปผลบอล', 'ยูฟ่าแชมเปียนส์ลีก', 'ลาลีกา'];

export default function NewsClient() {
    const { t } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
    const [articles, setArticles] = useState<NewsArticle[]>(MOCK_ARTICLES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        fetch('/api/news')
            .then((res) => res.json())
            .then((data) => {
                if (isMounted && data && data.success && Array.isArray(data.articles) && data.articles.length > 0) {
                    setArticles(data.articles);
                }
                if (isMounted) setLoading(false);
            })
            .catch((err) => {
                console.warn('Fetch live news error, using fallback:', err);
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const featuredArticle = articles.find((a) => a.isFeatured) || articles[0];

    const filteredArticles = articles.filter((article) => {
        if (selectedCategory === 'ทั้งหมด') return true;
        return article.category === selectedCategory;
    });

    return (
        <div className="flex flex-col gap-6 md:gap-8 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 max-w-[1600px] mx-auto min-h-screen font-sans animate-[fadeIn_0.5s_ease-out]">
            
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-[#0B0F17] border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 blur-[80px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#E5B842] to-[#b88c22] p-[1px] shadow-[0_0_20px_rgba(229,184,66,0.3)] shrink-0">
                            <div className="w-full h-full bg-black/80 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                                <Newspaper className="w-7 h-7 sm:w-8 sm:h-8 text-[#E5B842]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide mb-1">
                                {t('news_hub_title')}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-400">
                                {t('news_hub_subtitle')}
                            </p>
                        </div>
                    </div>
                    
                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap justify-center gap-1.5 p-1.5 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    selectedCategory === cat
                                        ? 'bg-[#E5B842] text-black shadow-[0_0_15px_rgba(229,184,66,0.3)]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featured Hero News Banner (ถ้าเลือกหมวดทั้งหมด) */}
            {selectedCategory === 'ทั้งหมด' && featuredArticle && (
                <div 
                    onClick={() => setSelectedArticle(featuredArticle)}
                    className="group relative overflow-hidden rounded-3xl bg-[#0B0F17] border border-white/10 hover:border-amber-500/50 shadow-2xl transition-all duration-300 cursor-pointer grid grid-cols-1 lg:grid-cols-12 min-h-[380px]"
                >
                    {/* Image Left */}
                    <div className="lg:col-span-7 relative overflow-hidden min-h-[260px] lg:min-h-[380px] bg-slate-900">
                        <img 
                            src={featuredArticle.image} 
                            alt={featuredArticle.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0B0F17] via-black/30 to-transparent opacity-80" />
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black tracking-wider shadow-lg flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 animate-pulse" /> ข่าวเด็ดประจำวัน
                        </span>
                    </div>

                    {/* Content Right */}
                    <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-br from-[#0B0F17] to-slate-950">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
                                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                                    {featuredArticle.category}
                                </span>
                                {featuredArticle.team && (
                                    <span className="text-slate-400">• {featuredArticle.team}</span>
                                )}
                            </div>

                            <h2 className="text-lg md:text-2xl font-black text-white group-hover:text-amber-400 transition-colors leading-snug">
                                {featuredArticle.title}
                            </h2>

                            <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                                {featuredArticle.summary}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6 text-xs text-slate-400">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-slate-500" /> {featuredArticle.author}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> {featuredArticle.date}
                                </span>
                            </div>
                            <span className="text-amber-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                อ่านต่อ <ArrowUpRight className="w-4 h-4" />
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* News Articles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                    <div 
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="group flex flex-col bg-[#0B0F17]/80 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(229,184,66,0.15)] transition-all duration-300 cursor-pointer backdrop-blur-xl"
                    >
                        {/* Article Image */}
                        <div className="relative aspect-video overflow-hidden bg-slate-950">
                            <img 
                                src={article.image} 
                                alt={article.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                            />
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 text-amber-400 text-[10px] font-extrabold backdrop-blur-md border border-white/10">
                                {article.category}
                            </div>
                        </div>

                        {/* Article Body */}
                        <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1 justify-between">
                            <div className="flex flex-col gap-2">
                                <h3 className="font-bold text-slate-100 text-sm sm:text-base line-clamp-2 group-hover:text-amber-400 transition-colors leading-snug">
                                    {article.title}
                                </h3>
                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                    {article.summary}
                                </p>
                            </div>

                            {/* Footer Stats */}
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/5 mt-2">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" /> {article.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> {article.readTime}
                                    </span>
                                </div>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" /> {article.views.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ================= FULL ARTICLE READING MODAL ================= */}
            {selectedArticle && (
                <div 
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-[fadeIn_0.3s_ease-out]"
                    onClick={() => setSelectedArticle(null)}
                >
                    <div 
                        className="relative w-full max-w-3xl bg-[#0B0F17] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header Image */}
                        <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-950 shrink-0">
                            <img 
                                src={selectedArticle.image} 
                                alt={selectedArticle.title} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-black/30 to-transparent" />
                            
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer border border-white/20 shadow-lg z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="absolute bottom-4 left-6 flex items-center gap-2 text-xs text-amber-400 font-bold">
                                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 backdrop-blur-md">
                                    {selectedArticle.category}
                                </span>
                                {selectedArticle.team && (
                                    <span className="text-slate-300 font-semibold">• {selectedArticle.team}</span>
                                )}
                            </div>
                        </div>

                        {/* Article Text Content */}
                        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                            <h2 className="text-xl md:text-2xl font-black text-white leading-snug">
                                {selectedArticle.title}
                            </h2>

                            <div className="flex items-center gap-4 text-xs text-slate-400 pb-4 border-b border-white/10">
                                <span>เขียนโดย: <strong className="text-slate-200">{selectedArticle.author}</strong></span>
                                <span>• {selectedArticle.date}</span>
                                <span>• อ่าน {selectedArticle.readTime}</span>
                                <span className="ml-auto flex items-center gap-1 text-slate-500">
                                    <Eye className="w-3.5 h-3.5" /> {selectedArticle.views.toLocaleString()} ครั้ง
                                </span>
                            </div>

                            <div className="flex flex-col gap-4 text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                                {selectedArticle.content.map((paragraph, idx) => (
                                    <p key={idx} className="indent-4">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>

                            {/* 1-Click Social Share Bar */}
                            <SocialShareBar 
                                title={selectedArticle.title} 
                                className="my-4" 
                            />
                        </div>

                        {/* Modal Footer Share */}
                        <div className="p-4 px-6 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
                            <span className="text-slate-500">ที่มา: {selectedArticle.author}</span>
                            <div className="flex items-center gap-2">
                                {selectedArticle.link && (
                                    <a
                                        href={selectedArticle.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold transition-all cursor-pointer shadow-md"
                                    >
                                        <span>อ่านข่าวเต็มจากสำนักข่าว</span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </a>
                                )}
                                <button 
                                    onClick={() => {
                                        if (navigator.clipboard) {
                                            navigator.clipboard.writeText(selectedArticle.link || window.location.href);
                                            alert('คัดลอกลิงก์ข่าวเรียบร้อยแล้ว!');
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 font-bold transition-colors cursor-pointer border border-white/10"
                                >
                                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                                    แชร์ข่าว
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
