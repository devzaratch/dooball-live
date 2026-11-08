'use client';

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export interface BannerItem {
    id: string;
    url: string;
    image: string;
    alt?: string;
    title?: string;
    position?: 'top_leaderboard' | 'side_banner' | 'under_player';
    isActive?: boolean;
    order?: number;
}

export const bannerData: BannerItem[] = [
    {
        id: 'ad-1',
        url: 'https://ufasbosclub.com/register',
        image: '/ads/banner_1.png',
        alt: 'UFASBO CLUB 8%',
        title: 'UFASBO CLUB 8%',
        position: 'top_leaderboard',
        isActive: true,
        order: 1,
    },
    {
        id: 'ad-2',
        url: 'https://sing777-auto.com/register',
        image: '/ads/banner_2.png',
        alt: 'SING777 VIP ZONE',
        title: 'SING777 VIP ZONE',
        position: 'top_leaderboard',
        isActive: true,
        order: 2,
    },
    {
        id: 'ad-3',
        url: 'https://hauychokd-auto.com/register',
        image: '/ads/banner_3.png',
        alt: 'HAUYCHOKD 1,000 / 100',
        title: 'HAUYCHOKD 1,000 / 100',
        position: 'top_leaderboard',
        isActive: true,
        order: 3,
    },
    {
        id: 'ad-4',
        url: 'https://laospros.com/register',
        image: '/ads/banner_4.png',
        alt: 'LAOSPRO 100%',
        title: 'LAOSPRO 100%',
        position: 'top_leaderboard',
        isActive: true,
        order: 4,
    },
    {
        id: 'ad-5',
        url: 'https://legends-auto.com/register',
        image: '/ads/banner_5.png',
        alt: 'LEGEND 100%',
        title: 'LEGEND 100%',
        position: 'top_leaderboard',
        isActive: true,
        order: 5,
    },
    {
        id: 'ad-6',
        url: 'https://laosvegas888-auto.com/register',
        image: '/ads/banner_6.png',
        alt: 'LAOS VEGAS 888 100%',
        title: 'LAOS VEGAS 888 100%',
        position: 'top_leaderboard',
        isActive: true,
        order: 6,
    },
];

// 🖼️ แผนที่แบรนด์ → ไฟล์รูปในโปรเจค (ทุกไฟล์อยู่ public/ads/banner_N.png แล้ว)
// ใช้แก้ปัญหาแบนเนอร์ที่เก็บใน Firebase/ค่าเดิมแล้วชี้ไปอาจกูรูปนอกที่ตายไป (เช่น boengnang.com)
const LOCAL_BANNER_MAP: Array<{ test: RegExp; path: string }> = [
    { test: /ufasbo|UFA\.gif/i, path: '/ads/banner_1.png' },
    { test: /sing777|SING\.gif/i, path: '/ads/banner_2.png' },
    { test: /hauychokd|Huay\.gif/i, path: '/ads/banner_3.png' },
    { test: /laospro|PRO\.gif/i, path: '/ads/banner_4.png' },
    { test: /legend|LEG\.gif/i, path: '/ads/banner_5.png' },
    { test: /laos\s*vegas|VEGAS\.gif/i, path: '/ads/banner_6.png' },
];

/** แปลง URL รูปแบนเนอร์: ชี้เว็บนอกที่ตาย → ใช้ไฟล์ในโปรเจคแทนทันที (ถ้าจับคู่แบรนด์ได้) */
function resolveBannerImage(ad: { image?: string; alt?: string; title?: string }): string | undefined {
    const hay = `${ad.alt || ''} ${ad.title || ''}`;
    const looksDeadUrl = !ad.image || /boengnang\.com/i.test(ad.image) || /:\/\/boxlink\./.test(ad.image);
    if (!looksDeadUrl && /^https?:\/\//.test(ad.image!)) return ad.image; // URL ปกติ — ใช้ตามที่แอดมินตั้ง
    for (const { test, path } of LOCAL_BANNER_MAP) {
        if (test.test(hay)) return path;
    }
    // โครงสร้างพาธเดิมแบบเต็ม — ไม่รู้จักแบรนด์ → แสดงกล่องแทน
    return looksDeadUrl && !/^https?:\/\//.test(ad.image || '') ? ad.image : undefined;
}

export function BannerVisual({ ad, className }: { ad: { image?: string; alt?: string; title?: string }; className?: string }) {
    const [failed, setFailed] = useState(false);
    const src = failed ? undefined : resolveBannerImage(ad);
    if (!src) {
        // กล่องแทนรูป: ไล่สีดำ-ทองตามธีมเว็บ + ชื่อสปอนเซอร์
        return (
            <div
                className="h-full flex items-center justify-center bg-gradient-to-r from-slate-950 via-yellow-900/40 to-slate-950"
                role="img"
                aria-label={ad.alt || ad.title || 'แบนเนอร์สปอนเซอร์'}
            >
                <span className="text-sm font-bold tracking-wide text-[#E5B842] uppercase text-center px-3 py-2">
                    {ad.alt || ad.title || 'สปอนเซอร์'}
                </span>
            </div>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={ad.alt || ad.title || 'แบนเนอร์สปอนเซอร์'}
            onError={() => setFailed(true)}
            className={`w-full h-auto object-cover ${className || ''}`}
            loading="lazy"
        />
    );
}

interface AdBannerProps {
    position?: 'top_leaderboard' | 'side_banner' | 'under_player';
    customBanners?: BannerItem[];
}

export default function AdBanner({ position = 'top_leaderboard', customBanners }: AdBannerProps) {
    const [dynamicBanners, setDynamicBanners] = useState<BannerItem[] | null>(null);

    useEffect(() => {
        if (customBanners) return;

        const bannersRef = ref(db, 'site_banners');
        const unsubscribe = onValue(bannersRef, (snapshot) => {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                const list: BannerItem[] = Object.keys(data).map((k) => ({
                    id: k,
                    ...data[k],
                }));
                setDynamicBanners(list);
            } else {
                setDynamicBanners(null);
            }
        });

        return () => unsubscribe();
    }, [customBanners]);

    // เลือกว่าจะแสดงแบนเนอร์ใด
    const resolvedList = customBanners || dynamicBanners || bannerData;

    // กรองเฉพาะแบนเนอร์ที่เปิดใช้งาน และตรงกับตำแหน่งที่กำหนด
    const activeBanners = resolvedList
        .filter((b) => b.isActive !== false && (!b.position || b.position === position))
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    // หากตำแหน่งนี้ไม่มีแบนเนอร์ที่ตรงกัน ให้ใช้ fallback ตาม default
    const bannersToRender = activeBanners.length > 0 
        ? activeBanners 
        : bannerData.filter((b) => !b.position || b.position === position || position === 'top_leaderboard');

    if (bannersToRender.length === 0) return null;

    if (position === 'side_banner') {
        return (
            <div className="flex flex-col gap-2.5 my-2">
                {bannersToRender.map((ad) => (
                    <a
                        key={ad.id}
                        href={ad.url}
                        target="_blank"
                        rel="noopener nofollow"
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 p-0.5 transition-all duration-300 hover:border-[#E5B842]/60 hover:shadow-[0_0_15px_rgba(229,184,66,0.3)] hover:scale-[1.02] cursor-pointer block"
                    >
                        <BannerVisual
                            ad={ad}
                            className="w-full h-auto max-h-[85px] object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                        />
                    </a>
                ))}
            </div>
        );
    }

    return (
        <div className="my-3 w-full max-w-6xl mx-auto">
            {/* 2-Column Animated GIF Banner Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {bannersToRender.map((ad) => (
                    <a
                        key={ad.id}
                        href={ad.url}
                        target="_blank"
                        rel="noopener nofollow"
                        className="group relative flex items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-slate-950 p-0.5 backdrop-blur-md transition-all duration-300 hover:border-[#E5B842] hover:shadow-[0_0_15px_rgba(229,184,66,0.35)] hover:scale-[1.015] active:scale-95 cursor-pointer"
                    >
                        <BannerVisual
                            ad={ad}
                            className="w-full h-auto max-h-[75px] sm:max-h-[85px] md:max-h-[95px] object-cover rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                    </a>
                ))}
            </div>
        </div>
    );
}