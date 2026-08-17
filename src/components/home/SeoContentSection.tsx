'use client';

import { useState } from 'react';
import { ShieldCheck, Tv, Zap, Globe, ChevronDown, Sparkles } from 'lucide-react';
import JsonLd from '@/components/common/JsonLd';

export default function SeoContentSection() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const faqs = [
        {
            q: 'ดูบอลสดฟรีผ่านเว็บ Dooball Live มีค่าใช้จ่ายไหม?',
            a: 'รับชมฟรี 100% ครบทุกลีก ไม่มีค่าบริการแอบแฝง ไม่ต้องสมัครสมาชิก สามารถเปิดเว็บแล้วเลือกคู่ที่ต้องการดูบอลสดได้ทันที ทั้งในประเทศไทย (TH) และประเทศลาว (LA)',
        },
        {
            q: 'รองรับการดูบอลผ่านมือถือ iOS / Android และ Smart TV หรือไม่?',
            a: 'รองรับอุปกรณ์ทุกรูปแบบทั้งสมาร์ตโฟน (iPhone, Samsung, Xiaomi), แท็บเล็ต, iPad, คอมพิวเตอร์ และ Smart TV คมชัดระดับ 4K HD พร้อมระบบติดตั้งแอป PWA ลงหน้าจอมือถือ',
        },
        {
            q: 'มีถ่ายทอดสดฟุตบอลลีกไหนบ้าง?',
            a: 'ถ่ายทอดสดพรีเมียร์ลีก อังกฤษ (Premier League), ยูฟ่า แชมเปียนส์ลีก (UCL), ลาลีกา สเปน (La Liga), เซเรียอา อิตาลี, บุนเดสลีกา เยอรมนี, ไทยลีก และบอล cup ทุกลีกทั่วโลก',
        },
        {
            q: 'หากสัญญาณกระตุกหรือจอดับ มีวิธีแก้ไขอย่างไร?',
            a: 'เว็บไซต์มีระบบสลับ Server สำรอง (Server 1 / Server 2 / Server 3) ให้อัตโนมัติ สามารถกดสลับช่องสัญญาณสำรองใต้เล่นวิดีโอเพื่อรับชมภาพไหลลื่นที่สุดได้ตลอด 24 ชั่วโมง',
        },
    ];

    return (
        <section className="mt-12 pt-10 border-t border-white/10 flex flex-col gap-10 font-sans">
            <JsonLd type="faq" />

            {/* SEO Key Value Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Tv className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white">ดูบอลสดคมชัด 4K HD</h4>
                        <p className="text-[11px] text-slate-400">ภาพคมชัด ลิงก์เสถียร ไม่กระตุก</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white">ดูบอลฟรี 100%</h4>
                        <p className="text-[11px] text-slate-400">ไม่ต้องสมัคร ไม่เสียเงินสักบาท</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white">รองรับไทย & ลาว 🇹🇭🇱🇦</h4>
                        <p className="text-[11px] text-slate-400">ເບິ່ງບານສົດ ຖ່າຍທອດສົດ HD</p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white">อัปเดตลิงก์เร็วที่สุด</h4>
                        <p className="text-[11px] text-slate-400">มีเซิร์ฟเวอร์สำรองอัตโนมัติ</p>
                    </div>
                </div>
            </div>

            {/* SEO Content Text Article */}
            <div className="p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col gap-4 text-xs text-slate-300 leading-relaxed backdrop-blur-xl">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    ดูบอลสดออนไลน์ฟรี พรีเมียร์ลีก ยูฟ่า ลา ลีกา ถ่ายทอดสดฟุตบอลวันนี้ ( Dooball Live )
                </h2>

                <p>
                    ยินดีต้อนรับสู่ <strong className="text-amber-400">Dooball Live</strong> ศูนย์รวม <strong className="text-white">ลิงก์ดูบอลสด</strong> และถ่ายทอดสดฟุตบอลออนไลน์ฟรีที่ดีที่สุด รวบรวมสัญญาณการถ่ายทอดสดฟุตบอลครบทุกลีกดังทั่วโลก ไม่ว่าจะเป็น <em>พรีเมียร์ลีก อังกฤษ (Premier League), ยูฟ่า แชมเปียนส์ลีก (UCL), ลาลีกา สเปน, เซเรียอา อิตาลี, บุนเดสลีกา เยอรมนี, ไทยลีก</em> รวมถึงฟุตบอลทีมชาติและโปรแกรมอุ่นเครื่องปรีซีซั่น
                </p>

                <p>
                    รองรับผู้รับชมทั้งใน <strong className="text-white">ประเทศไทย 🇹🇭</strong> และ <strong className="text-white">ประเทศลาว 🇱🇦 (ເບິ່ງບານສົດ ຟຣີ)</strong> สามารถรับชมผ่านสมาร์ตโฟนมือถือ iPhone, Android, แท็บเล็ต iPad และ Smart TV ภาพคมชัดระดับ Full HD ลื่นไหลไม่มีกระตุก พร้อมอัปเดต <a href="/table" className="text-amber-400 hover:underline">ตารางคะแนนพรีเมียร์ลีก</a>, <a href="/highlights" className="text-amber-400 hover:underline">ไฮไลท์บอลย้อนหลัง</a> และ <a href="/news" className="text-amber-400 hover:underline">ข่าวฟุตบอลล่าสุด</a> ตลอด 24 ชั่วโมง
                </p>
            </div>

            {/* SEO FAQ Section */}
            <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-200 tracking-wide">
                    ❓ คำถามที่พบบ่อยเกี่ยวกับการดูบอลสด (FAQ)
                </h3>

                <div className="flex flex-col gap-3">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden transition-all"
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-200 hover:text-amber-400 transition-colors cursor-pointer"
                            >
                                <span>{faq.q}</span>
                                <ChevronDown
                                    className={`w-4 h-4 text-slate-400 transition-transform ${
                                        openFaq === idx ? 'rotate-180 text-amber-400' : ''
                                    }`}
                                />
                            </button>

                            {openFaq === idx && (
                                <div className="px-4 pb-4 text-xs text-slate-400 border-t border-white/5 pt-3 leading-relaxed">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
