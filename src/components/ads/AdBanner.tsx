import React from 'react';

export interface BannerItem {
    id: string;
    url: string;
    image: string;
    alt: string;
}

export const bannerData: BannerItem[] = [
    {
        id: 'ad-1',
        url: 'https://ufasbosclub.com/register',
        image: 'https://boengnang.com/wp-content/uploads/2025/12/UFA.gif',
        alt: 'UFASBO CLUB 8%',
    },
    {
        id: 'ad-2',
        url: 'https://sing777-auto.com/register',
        image: 'https://boengnang.com/wp-content/uploads/2025/12/SING.gif',
        alt: 'SING777 VIP ZONE',
    },
    {
        id: 'ad-3',
        url: 'https://hauychokd-auto.com/register',
        image: 'https://boengnang.com/wp-content/uploads/2025/12/Huay.gif',
        alt: 'HAUYCHOKD 1,000 / 100',
    },
    {
        id: 'ad-4',
        url: 'https://laospros.com/register',
        image: 'https://boengnang.com/wp-content/uploads/2025/12/PRO.gif',
        alt: 'LAOSPRO 100%',
    },
    {
        id: 'ad-5',
        url: 'https://legends-auto.com/register',
        image: 'https://boengnang.com/wp-content/uploads/2025/12/LEG.gif',
        alt: 'LEGEND 100%',
    },
    {
        id: 'ad-6',
        url: 'https://laosvegas888-auto.com/register',
        image: 'https://boengnang.com/wp-content/uploads/2025/12/VEGAS.gif',
        alt: 'LAOS VEGAS 888 100%',
    },
];

interface AdBannerProps {
    position?: 'top_leaderboard' | 'side_banner' | 'under_player';
    customBanners?: BannerItem[];
}

export default function AdBanner({ position = 'top_leaderboard', customBanners }: AdBannerProps) {
    const banners = customBanners || bannerData;

    if (position === 'side_banner') {
        return (
            <div className="flex flex-col gap-2.5 my-2">
                {banners.map((ad) => (
                    <a
                        key={ad.id}
                        href={ad.url}
                        target="_blank"
                        rel="noopener nofollow"
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 p-0.5 transition-all duration-300 hover:border-[#E5B842]/60 hover:shadow-[0_0_15px_rgba(229,184,66,0.3)] hover:scale-[1.02] cursor-pointer block"
                    >
                        <img
                            src={ad.image}
                            alt={ad.alt}
                            className="w-full h-auto max-h-[85px] object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    </a>
                ))}
            </div>
        );
    }

    return (
        <div className="my-3 w-full max-w-6xl mx-auto">
            {/* 2-Column Animated GIF Banner Grid (ปรับขนาดกระชับ 600x105px พร้อมขยับดุ๊กดิ๊กเรียลไทม์) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {banners.map((ad) => (
                    <a
                        key={ad.id}
                        href={ad.url}
                        target="_blank"
                        rel="noopener nofollow"
                        className="group relative flex items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-slate-950 p-0.5 backdrop-blur-md transition-all duration-300 hover:border-[#E5B842] hover:shadow-[0_0_15px_rgba(229,184,66,0.35)] hover:scale-[1.015] active:scale-95 cursor-pointer"
                    >
                        <img
                            src={ad.image}
                            alt={ad.alt}
                            className="w-full h-auto max-h-[75px] sm:max-h-[85px] md:max-h-[95px] object-cover rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
                            loading="lazy"
                        />
                    </a>
                ))}
            </div>
        </div>
    );
}