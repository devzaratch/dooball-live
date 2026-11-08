import Link from 'next/link';
import { Radio, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6">
                <div className="relative inline-flex items-center justify-center">
                    <span className="text-8xl font-black text-white/5 font-mono select-none">404</span>
                    <div className="absolute p-4 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842]">
                        <Radio className="w-10 h-10 animate-pulse" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight">ไม่พบหน้าที่คุณต้องการ (404)</h1>
                    <p className="text-sm text-slate-400">
                        หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบออก หรือไม่มีอยู่ในระบบ กรุณาตรวจสอบลิงก์อีกครั้ง
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link
                        href="/"
                        className="flex-1 py-3 px-4 rounded-xl bg-[#E5B842] hover:bg-[#d4a733] text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E5B842]/20 active:scale-95"
                    >
                        <Home className="w-4 h-4" />
                        กลับสู่หน้าหลัก
                    </Link>
                </div>
            </div>
        </div>
    );
}
