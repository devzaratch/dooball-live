import { ImageResponse } from 'next/og';

export const alt = 'Dooball Live - ดูบอลสดออนไลน์ คมชัด HD';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TwitterImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
                    color: '#f8fafc',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', fontSize: 92, fontWeight: 900, color: '#E5B842' }}>
                    Dooball Live
                </div>
                <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, marginTop: 18 }}>
                    ดูบอลสด HD ไม่กระตุก • ฟรี
                </div>
                <div style={{ display: 'flex', fontSize: 30, color: '#94a3b8', marginTop: 16 }}>
                    ⚽ ครบทุกลีก ไทย-ลาว
                </div>
            </div>
        ),
        { ...size }
    );
}
