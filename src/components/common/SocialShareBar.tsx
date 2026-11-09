'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconProps = React.SVGProps<SVGSVGElement>;

interface SocialShareBarProps {
    title?: string;
    url?: string;
    description?: string;
    className?: string;
}

export default function SocialShareBar({
    title = 'ดูบอลสดฟรี คมชัด HD | DoBallLaos',
    url,
    description = 'รวมลิงก์ดูบอลสด ถ่ายทอดสดฟุตบอลครบทุกลีก คมชัด ไม่กระตุก',
    className,
}: SocialShareBarProps) {
    const [copied, setCopied] = useState(false);

    // Get current URL if not provided
    const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : (url || 'https://dooball-laos.vercel.app');
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const shareLinks = [
        {
            name: 'LINE',
            icon: (props: IconProps) => (
                <svg className={props.className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349.0.63.285.63.631.0.345-.281.63-.63.63h-2.425v1.125h2.425c.349.0.63.285.63.631.0.345-.281.63-.63.63h-3.055c-.349.0-.63-.285-.63-.631V8.406c0-.345.281-.63.63-.63h3.055c.349.0.63.285.63.63s-.281.63-.63.63h-2.425v1.125h2.425zm-6.046-2.087c-.349.0-.63.285-.63.63v4.613c0 .345.281.63.63.63s.63-.285.63-.63V8.406c0-.345-.281-.63-.63-.63zm-2.425.0c-.349.0-.63.285-.63.63v2.859l-2.05-2.977c-.126-.183-.332-.295-.555-.295h-.01c-.349.0-.63.285-.63.631v4.613c0 .345.281.63.63.63s.63-.285.63-.63v-2.859l2.05 2.977c.126.183.332.295.555.295h.01c.349.0.63-.285.63-.631V8.406c0-.345-.281-.63-.63-.63zm-6.685.0c-.349.0-.63.285-.63.63v4.613c0 .345.281.63.63.63h3.055c.349.0.63-.285.63-.631.0-.345-.281-.63-.63-.63H4.839V8.406c0-.345-.281-.63-.63-.63zM12 2C6.477 2 2 5.86 2 10.62c0 4.256 3.559 7.822 8.36 8.498.326.071.769.215.881.493.101.251.066.643.033.897-.058.441-.269 1.722-.297 2.091-.039.52.241.57.506.376.265-.195 2.87-1.69 3.918-2.311.536-.318 1.139-.474 1.758-.474 5.523.0 10-3.86 10-8.62C22 5.86 17.523 2 12 2z" />
                </svg>
            ),
            color: 'bg-[#00B900] hover:bg-[#009900] text-white shadow-[0_0_12px_rgba(0,185,0,0.3)]',
            href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
        },
        {
            name: 'Facebook',
            icon: (props: IconProps) => (
                <svg className={props.className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
            color: 'bg-[#1877F2] hover:bg-[#0d65d9] text-white shadow-[0_0_12px_rgba(24,119,242,0.3)]',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        },
        {
            name: 'Messenger',
            icon: (props: IconProps) => (
                <svg className={props.className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.45 5.51 3.72 7.18v3.562l3.418-1.877c.905.251 1.868.387 2.862.387 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.18 12.285l-2.6-2.77-5.07 2.77 5.57-5.91 2.64 2.77 5.03-2.77-5.57 5.91z" />
                </svg>
            ),
            color: 'bg-gradient-to-r from-[#0084FF] to-[#00C6FF] hover:opacity-90 text-white shadow-[0_0_12px_rgba(0,132,255,0.3)]',
            href: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`,
        },
        {
            name: 'X (Twitter)',
            icon: (props: IconProps) => (
                <svg className={props.className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ),
            color: 'bg-black hover:bg-slate-900 border border-white/20 text-white shadow-sm',
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        },
    ];

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={cn("p-4 rounded-2xl bg-[#0B0F17]/90 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl font-sans", className)}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Share2 className="w-4 h-4" />
                </div>
                <span>แชร์คู่นี้ให้เพื่อนดูด้วยกัน (1-Click Share):</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {shareLinks.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <a
                            key={item.name}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer",
                                item.color
                            )}
                            title={`แชร์ไปยัง ${item.name}`}
                        >
                            <IconComponent className="w-3.5 h-3.5" />
                            <span>{item.name}</span>
                        </a>
                    );
                })}

                <button
                    onClick={handleCopy}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer border",
                        copied
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                    )}
                    title="คัดลอกลิงก์"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>คัดลอกแล้ว!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>คัดลอกลิงก์</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
