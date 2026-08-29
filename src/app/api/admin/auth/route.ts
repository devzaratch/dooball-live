import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rateLimit';

function getExpectedSessionToken(): string {
    const secret = process.env.ADMIN_SECRET_KEY || 'dooball_fallback_secret_key_2026';
    const password = process.env.ADMIN_PASSWORD || 'admin888!';
    return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

export async function GET(req: NextRequest) {
    const sessionCookie = req.cookies.get('admin_session')?.value;
    const expected = getExpectedSessionToken();

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

        const adminPassword = process.env.ADMIN_PASSWORD || 'admin888!';

        if (!password || password !== adminPassword) {
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
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
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
