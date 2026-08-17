'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-12 h-12" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-100 tracking-tight">เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
                    <p className="text-sm text-slate-400">
                        ขออภัย ระบบไม่สามารถดำเนินการตามคำขอได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือกลับสู่หน้าหลัก
                    </p>
                </div>

                {error?.digest && (
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-slate-500 font-mono">
                        Error Ref: {error.digest}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                        onClick={() => reset()}
                        className="flex-1 py-3 px-4 rounded-xl bg-[#E5B842] hover:bg-[#d4a733] text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E5B842]/20 active:scale-95 cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ลองใหม่อีกครั้ง
                    </button>
                    <Link
                        href="/"
                        className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Home className="w-4 h-4 text-slate-300" />
                        กลับหน้าหลัก
                    </Link>
                </div>
            </div>
        </div>
    );
}
