import { Match } from '@/types/football';
import { Trophy, Shield, Calendar, Tv, ChevronRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';

// 📄 Contextual Content — Server Component (ติดใน HTML จริงแน่นอน)
// แก้ Thin Content รุนแรงของหน้า watch: component ฝั่ง client ที่อยู่ก่อนหน้านี้ใช้ ssr:false
// ทำให้ Google ไม่เห็นข้อความเลย ส่วนนี้เป็นบทความที่ถูกแนบใน HTML ที่ bot เก็บได้ทันที
// วัตถุประสงค์: เพิ่มความหนาแน่น keyword + FAQ ที่มีจุดค้นหาจริง + ลิงก์ภายใน

interface MatchSeoContentProps {
    match: Match;
    slug: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dooball-live-p6mk.vercel.app';

export default function MatchSeoContent({ match, slug }: MatchSeoContentProps) {
    const homeName = match.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match.awayTeam?.name || 'ทีมเยือน';
    const leagueName = match.league?.name || 'ฟุตบอลสด';
    const kickoffTime = match.kickoffTime || '20:00';
    const dateStr = match.date_string || match.date || 'วันนี้';
    const matchUrl = `${SITE_URL}/watch/${match.slug || slug}`;

    // H2H จากข้อมูลจริง (ถ้ามี) — ห้ามแต่งคะแนนขึ้นมาเพื่อ SEO
    const h2h = Array.isArray(match.h2h)
        ? match.h2h.filter((item): item is string => typeof item === 'string')
        : [];

    const statusText =
        match.status === 'LIVE' ? 'กำลังแข่งขันสดอยู่ตอนนี้' :
        match.status === 'FINISHED' ? 'จบการแข่งขันแล้ว' :
        'ยังไม่เริ่มแข่งขัน';

    // 📋 FAQ — ข้อความต้องตรงกับ FAQPage JSON-LD ด้านล่าง (Google เช็คความสอดคล้อง)
    const faqs = [
        {
            question: `ดูบอลสด ${homeName} พบ ${awayName} ต้องจ่ายเงินไหม?`,
            answer: `ดูฟรี 100% ไม่ต้องสมัครสมาชิก เพียงเข้าหน้า ${matchUrl} ก่อนเวลาแข่งขันจะมีลิงก์ถ่ายทอดสด${leagueName}ให้เลือกหลายลิงก์`,
        },
        {
            question: `${homeName} vs ${awayName} แข่งเมื่อไหร่ เวลาเท่าไหร่?`,
            answer: `แข่งวัน${dateStr} เวลา ${kickoffTime} น. (เวลาไทย) ตามเวลาที่แจ้งในหน้าถ่ายทอดสด หากเวลาเปลี่ยน ระบบจะอัปเดตให้ใหม่ทันทีในหน้าเดียวกัน`,
        },
        {
            question: `ถ่ายทอดสด ${homeName} พบ ${awayName} ชมได้บนอุปกรณ์ไหนบ้าง?`,
            answer: 'ชมได้ทั้งมือถือ (iOS / Android) แท็บเล็ต และคอมพิวเตอร์ โดยเปิดผ่านเบราว์เซอร์ได้เลย ไม่ต้องติดตั้งแอปเพิ่ม',
        },
        {
            question: `ลิงก์ดู ${leagueName} คู่นี้ยังเข้าไม่ได้ต้องทำยังไง?`,
            answer: 'ลิงก์จะพร้อมก่อนแข่งประมาณ 30 นาที หากลิงก์สตรีมขัดข้องสามารถกดสลับไปช่องสำรองอื่นได้ทันที หรือกดรีเฟรชหน้าเว็บเพื่อดึงลิงก์ใหม่',
        },
    ];

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
    };

    return (
        <section className="mt-6 flex flex-col gap-4 font-sans">
            {/* FAQPage JSON-LD — ตรงกับ FAQ ในหน้านี้โดยตรง */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <article className="p-6 rounded-2xl bg-[#0B0F17]/90 border border-white/10 text-sm text-slate-300 leading-relaxed backdrop-blur-xl shadow-xl">
                {/* หัวข้อหลักที่มีคีย์เวิร์ดจริงผู้คนค้น */}
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-[#E5B842]" />
                    ดูบอลสด {homeName} พบ {awayName} ({leagueName}) คมชัด HD ฟรี
                </h2>

                <p className="mb-3">
                    ถ่ายทอดสดฟุตบอล <strong className="text-white">{leagueName}</strong> คู่{' '}
                    <strong className="text-[#E5B842]">{homeName}</strong> พบ{' '}
                    <strong className="text-[#E5B842]">{awayName}</strong> วัน{dateStr} เวลา{' '}
                    <strong className="text-amber-400">{kickoffTime} น.</strong> เวลาไทย — สถานะ: {statusText}{' '}
                    ระบบรวมลิงก์ถ่ายทอดสดหลายลิงก์ไว้ในหน้าเดียว สลับช่องดูได้ทันทีหากลิงก์ไหนขัดข้อง
                    ไม่ต้องสมัครสมาชิก ไม่มีค่าใช้จ่าย
                </p>

                <p className="mb-3">
                    ทีมเหย้า <strong className="text-white">{homeName}</strong> เปิดบ้านต้อนรับทีมเยือน{' '}
                    <strong className="text-white">{awayName}</strong> แฟนบอลสามารถติดตามสถิติการเล่น ฟอร์มรายนัด
                    และนาทีสำคัญของเกมได้แบบเรียลไทม์ในกล่องสถิติใต้เครื่องเล่นวิดีโอ พร้อมแต้มสะสม
                    ประตูที่ยิงได้ในแต่ละครึ่ง และตารางผลการแข่งขันย้อนหลังของทั้งสองทีม
                </p>

                {/* บล็อก H2H ข้อความ — แสดงเฉพาะข้อมูลจริงเท่านั้น */}
                {h2h.length > 0 && (
                    <div className="my-4 p-4 rounded-xl bg-black/40 border border-white/5">
                        <h3 className="text-xs font-black text-white flex items-center gap-1.5 mb-2">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            ผลการแข่งขันย้อนหลัง {homeName} พบ {awayName}
                        </h3>
                        <ul className="text-xs text-slate-300 space-y-1">
                            {h2h.slice(0, 5).map((line, i) => (
                                <li key={i}>• {line}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ลิงก์ภายใน + นำทางผู้เล่นเชื่อมหน้าอื่น (Internal Linking) */}
                <div className="my-4 flex flex-wrap items-center gap-2 text-xs">
                    <Link href="/" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-colors">
                        ดูบอลสดวันนี้
                    </Link>
                    <Link href="/table" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-colors">
                        ตาราง {leagueName}
                    </Link>
                    <Link href="/highlights" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-colors">
                        ไฮไลท์บอลย้อนหลัง
                    </Link>
                    <Link href="/news" className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-colors">
                        ข่าวฟุตบอล
                    </Link>
                </div>

                {/* ==== FAQ ที่มีคีย์เวิร์ดจริงๆ มนุษย์ค้น === */}
                <div className="mt-4 pt-4 border-t border-white/5">
                    <h3 className="text-sm font-black text-white flex items-center gap-2 mb-3">
                        <HelpCircle className="w-4 h-4 text-[#E5B842]" />
                        คำถามที่พบบ่อยเกี่ยวกับการถ่ายทอดสดคู่นี้
                    </h3>
                    <div className="flex flex-col gap-3">
                        {faqs.map((f, i) => (
                            <div key={i} className="p-3 rounded-xl bg-black/30 border border-white/5">
                                <h4 className="text-xs font-bold text-slate-100 mb-1">{f.question}</h4>
                                <p className="text-xs text-slate-400">{f.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ลิงก์ canonical ที่เห็นใน block หลังเนื้อหา */}
                <p className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    ข้อมูลล่าสุดจากระบบ Dooball Live — <span className="text-slate-400">{matchUrl}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="flex items-center gap-1"><Tv className="w-3 h-3" /> {leagueName}</span>
                </p>
            </article>
        </section>
    );
}
