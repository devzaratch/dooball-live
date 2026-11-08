import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rateLimit';

function getAdminCredentials(): { secret: string; password: string } | null {
    const secret = process.env.ADMIN_SECRET_KEY;
    const password = process.env.ADMIN_PASSWORD;
    if (!secret || !password) return null;
    return { secret, password };
}

function getExpectedSessionToken(): string | null {
    const creds = getAdminCredentials();
    if (!creds) return null;
    return crypto.createHmac('sha256', creds.secret).update(creds.password).digest('hex');
}

export async function GET(req: NextRequest) {
    const expected = getExpectedSessionToken();
    if (!expected) {
        return NextResponse.json({ authenticated: false });
    }
    const sessionCookie = req.cookies.get('admin_session')?.value;

    const isAuthenticated = Boolean(sessionCookie && sessionCookie === expected);

    return NextResponse.json({ authenticated: isAuthenticated });
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Anti-Brute Force: Max 5 failed attempts per 15 minutes (900,000 ms)
    const rateCheck = checkRateLimit(`admin_login_${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
        return NextResponse.json(
            {
                success: false,
                error: 'พยายามกรอกรหัสผ่านผิดเกินกำหนด ระบบระงับการเข้าสู่ระบบชั่วคราว 15 นาทีเพื่อความปลอดภัย',
            },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const { password } = body;

        const adminCreds = getAdminCredentials();
        if (!adminCreds) {
            return NextResponse.json(
                { success: false, error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่ารหัสแอดมิน' },
                { status: 500 }
            );
        }

        if (!password || password !== adminCreds.password) {
            return NextResponse.json(
                {
                    success: false,
                    error: `รหัสผ่านไม่ถูกต้อง (เหลือโอกาสลองอีก ${rateCheck.remaining} ครั้ง)`,
                },
                { status: 401 }
            );
        }

        // Generate encrypted session token
        const sessionToken = getExpectedSessionToken();
        if (!sessionToken) {
            return NextResponse.json(
                { success: false, error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่ารหัสแอดมิน' },
                { status: 500 }
            );
        }

        const response = NextResponse.json({
            success: true,
            message: 'ยืนยันตัวตนแอดมินสำเร็จ',
        });

        // Set HttpOnly, SameSite=Strict cookie
        response.cookies.set('admin_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 4, // 4 hours
        });

        return response;
    } catch {
        return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({
        success: true,
        message: 'ออกจากระบบแอดมินเรียบร้อยแล้ว',
    });

    response.cookies.set('admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0,
    });

    return response;
}
