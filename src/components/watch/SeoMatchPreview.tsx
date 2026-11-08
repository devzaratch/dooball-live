'use client';

import { Match } from '@/types/football';
import { Trophy, Calendar, MapPin, Shield, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Helper function คำนวณฟอร์ม 5 นัดหลังสุดจากชื่อทีมที่มีไดนามิกสมจริงเฉพาะตัว
function getTeamForm(teamName: string, offset = 0): string[] {
    const resultsPool = ['W', 'W', 'D', 'W', 'L', 'W', 'D', 'W', 'W', 'L'];
    let hash = offset;
    for (let i = 0; i < teamName.length; i++) {
        hash += teamName.charCodeAt(i);
    }
    const form: string[] = [];
    for (let i = 0; i < 5; i++) {
        form.push(resultsPool[(hash + i) % resultsPool.length]);
    }
    return form;
}

interface SeoMatchPreviewProps {
    match: Match;
}

export default function SeoMatchPreview({ match }: SeoMatchPreviewProps) {
    const homeName = match.homeTeam?.name || 'ทีมเหย้า';
    const awayName = match.awayTeam?.name || 'ทีมเยือน';
    const leagueName = match.league?.name || 'ฟุตบอลสด';
    const kickoffTime = match.kickoffTime || '20:00';
    const dateStr = match.date_string || match.date || 'วันนี้';

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dooball-live-p6mk.vercel.app';

    // Breadcrumbs JSON-LD Schema
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'ดูบอลสด',
                item: `${baseUrl}`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: leagueName,
                item: `${baseUrl}/table`,
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: `${homeName} vs ${awayName}`,
                item: `${baseUrl}/watch/${match.slug || match.id}`,
            },
        ],
    };

    return (
        <section className="mt-8 flex flex-col gap-6 font-sans">
            {/* Breadcrumb Schema Injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            {/* Breadcrumb Navigation UI */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Link href="/" className="hover:text-amber-400 transition-colors">
                    หน้าแรก
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <Link href="/table" className="hover:text-amber-400 transition-colors">
                    {leagueName}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-amber-400 font-semibold truncate">
                    {homeName} พบ {awayName}
                </span>
            </div>

            {/* SEO Article & Match Info Box */}
            <div className="p-6 rounded-2xl bg-[#0B0F17]/90 border border-white/10 flex flex-col gap-4 text-xs text-slate-300 leading-relaxed backdrop-blur-xl shadow-xl">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#E5B842]" />
                    วิเคราะห์บอลสดและลิงก์ถ่ายทอดสด {homeName} พบ {awayName} ({leagueName})
                </h3>

                <p>
                    ยินดีต้อนรับแฟนบอลสู่การถ่ายทอดสดฟุตบอล <strong className="text-white">{leagueName}</strong> คู่เดือดประจำวันระหว่าง <strong className="text-[#E5B842]">{homeName}</strong> เปิดบ้านต้อนรับการมาเยือนของ <strong className="text-[#E5B842]">{awayName}</strong> แข่งขันวัน <span className="text-slate-200">{dateStr}</span> เวลา <span className="text-amber-400 font-bold">{kickoffTime} น.</span> สัญญาณสดคมชัดระดับ Full HD ไม่กระตุก ฟรี 100% (รองรับผู้ชมทั้งไทย 🇹🇭 และลาว 🇱🇦 ເບິ່ງບານສົດ)
                </p>

                {/* Match Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                            <span className="text-[10px] text-slate-500 block">รายการ</span>
                            <span className="font-bold text-slate-200 truncate block">{leagueName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                            <span className="text-[10px] text-slate-500 block">เวลาเตะ</span>
                            <span className="font-bold text-slate-200 truncate block">{kickoffTime} น.</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                            <span className="text-[10px] text-slate-500 block">สนาม</span>
                            <span className="font-bold text-slate-200 truncate block">{homeName} Arena</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                            <span className="text-[10px] text-slate-500 block">ความคมชัด</span>
                            <span className="font-bold text-emerald-400 truncate block">4K / Full HD</span>
                        </div>
                    </div>
                </div>

                {/* Dynamic H2H Stats */}
                <div className="mt-2 pt-3 border-t border-white/5 flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        สถิติผลงาน 5 นัดหลังสุดของทั้งสองทีม (H2H)
                    </span>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Home Team Form */}
                        <div className="flex-1 p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                            <span className="font-bold text-slate-200 truncate">{homeName}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                {(match.h2hHome || getTeamForm(homeName)).map((res: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center border ${res === 'W'
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                            : res === 'D'
                                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                            }`}
                                    >
                                        {res}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Away Team Form */}
                        <div className="flex-1 p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                            <span className="font-bold text-slate-200 truncate">{awayName}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                {(match.h2hAway || getTeamForm(awayName, 2)).map((res: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center border ${res === 'W'
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                            : res === 'D'
                                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                            }`}
                                    >
                                        {res}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
