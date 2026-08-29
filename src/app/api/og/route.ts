import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
    const ip = req?.headers?.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, 60, 60000);
    if (!rateCheck.allowed) {
        return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const home = searchParams.get('home') || 'ทีมเหย้า';
    const away = searchParams.get('away') || 'ทีมเยือน';
    const league = searchParams.get('league') || 'ฟุตบอลสด';
    const time = searchParams.get('time') || 'ถ่ายทอดสด';

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F17"/>
      <stop offset="50%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0B0F17"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#E5B842"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Glowing Orbs -->
  <circle cx="200" cy="150" r="250" fill="#F59E0B" opacity="0.08" filter="url(#glow)"/>
  <circle cx="1000" cy="450" r="300" fill="#EF4444" opacity="0.08" filter="url(#glow)"/>

  <!-- Border Ring -->
  <rect x="20" y="20" width="1160" height="590" rx="32" fill="none" stroke="url(#gold)" stroke-width="3" stroke-opacity="0.3"/>

  <!-- Header Bar -->
  <rect x="60" y="60" width="140" height="44" rx="10" fill="#E5B842"/>
  <text x="130" y="90" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="900" font-size="20" fill="#000000" text-anchor="middle">DOOBALL</text>
  <text x="220" y="90" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="900" font-size="20" fill="#FFFFFF">LIVE</text>

  <rect x="920" y="60" width="220" height="44" rx="22" fill="#EF4444" fill-opacity="0.2" stroke="#EF4444" stroke-opacity="0.5" stroke-width="2"/>
  <text x="1030" y="88" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="800" font-size="16" fill="#FCA5A5" text-anchor="middle">🔴 LIVE STREAMING HD</text>

  <!-- Match Box Center -->
  <rect x="60" y="150" width="1080" height="340" rx="28" fill="#0F172A" fill-opacity="0.8" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>

  <!-- League Badge -->
  <rect x="470" y="180" width="260" height="40" rx="20" fill="#F59E0B" fill-opacity="0.15" stroke="#F59E0B" stroke-opacity="0.4" stroke-width="1.5"/>
  <text x="600" y="206" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="700" font-size="18" fill="#F59E0B" text-anchor="middle">${escapeXml(league)} • ${escapeXml(time)}</text>

  <!-- Teams vs Center -->
  <!-- Home Team -->
  <text x="440" y="330" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="end">${escapeXml(home)}</text>
  
  <!-- VS Badge -->
  <rect x="540" y="275" width="120" height="70" rx="20" fill="#1E293B" stroke="#F59E0B" stroke-width="3"/>
  <text x="600" y="322" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="900" font-size="32" fill="#F59E0B" text-anchor="middle">VS</text>

  <!-- Away Team -->
  <text x="760" y="330" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="start">${escapeXml(away)}</text>

  <text x="600" y="420" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="600" font-size="18" fill="#94A3B8" text-anchor="middle">กดลิงก์นี้เพื่อรับชมถ่ายทอดสดฟุตบอลคู่นี้ฟรี ไม่ต้องสมัครสมาชิก</text>

  <!-- Footer Bar -->
  <line x1="60" y1="530" x2="1140" y2="530" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  <text x="60" y="568" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="500" font-size="16" fill="#64748B">รวมลิงก์ดูบอลสด ถ่ายทอดสดฟุตบอลครบทุกลีก คมชัดระดับ HD ไม่กระตุก</text>
  <text x="1140" y="568" font-family="'Noto Sans Thai', sans-serif, Arial" font-weight="800" font-size="18" fill="#F59E0B" text-anchor="end">dooball-live.com</text>
</svg>`;

    return new NextResponse(svgContent, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
    });
}

function escapeXml(unsafe: string) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
