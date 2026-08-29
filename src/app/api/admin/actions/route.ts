import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { getMatchRoomKey } from '@/lib/utils';

function isAuthorized(req: NextRequest): boolean {
    const sessionCookie = req.cookies.get('admin_session')?.value;
    const secret = process.env.ADMIN_SECRET_KEY || 'dooball_fallback_secret_key_2026';
    const password = process.env.ADMIN_PASSWORD || 'admin888!';
    const expected = crypto.createHmac('sha256', secret).update(password).digest('hex');
    return Boolean(sessionCookie && sessionCookie === expected);
}

export async function POST(req: NextRequest) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { action, matchId, streamId, newUrl, messageId, noticeText, broadcastText } = body;
        const roomKey = getMatchRoomKey(matchId);

        switch (action) {
            case 'resolve_report': {
                if (!roomKey || !streamId) {
                    return NextResponse.json({ success: false, error: 'Missing matchId or streamId' }, { status: 400 });
                }
                const targetRef = adminDb.ref(`stream_reports/${roomKey}/${streamId}`);
                await targetRef.remove();
                return NextResponse.json({ success: true, message: 'เคลียร์รายงานสำเร็จ' });
            }

            case 'replace_stream': {
                if (!roomKey || !streamId || !newUrl) {
                    return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
                }
                const trimmedUrl = String(newUrl).trim();
                // 1. Update stream_overrides
                const overrideRef = adminDb.ref(`stream_overrides/${roomKey}/${streamId}`);
                await overrideRef.set({
                    url: trimmedUrl,
                    updatedAt: Date.now(),
                });
                // 2. Update stream_reports summary
                const summaryRef = adminDb.ref(`stream_reports/${roomKey}/${streamId}/summary/streamUrl`);
                await summaryRef.set(trimmedUrl);

                return NextResponse.json({ success: true, message: 'เปลี่ยนลิงก์สตรีมด่วนสำเร็จ' });
            }

            case 'delete_chat': {
                if (!roomKey || !messageId) {
                    return NextResponse.json({ success: false, error: 'Missing matchId or messageId' }, { status: 400 });
                }
                const msgRef = adminDb.ref(`chats/${roomKey}/${messageId}`);
                await msgRef.remove();
                return NextResponse.json({ success: true, message: 'ลบข้อความสำเร็จ' });
            }

            case 'clear_chat_room': {
                if (!roomKey) {
                    return NextResponse.json({ success: false, error: 'Missing matchId' }, { status: 400 });
                }
                const chatRef = adminDb.ref(`chats/${roomKey}`);
                await chatRef.remove();
                return NextResponse.json({ success: true, message: 'ล้างห้องแชทสำเร็จ' });
            }

            case 'set_notice': {
                if (!roomKey || !noticeText) {
                    return NextResponse.json({ success: false, error: 'Missing matchId or noticeText' }, { status: 400 });
                }
                const noticeRef = adminDb.ref(`chat_notices/${roomKey}`);
                await noticeRef.set({
                    text: String(noticeText).trim(),
                    updatedAt: Date.now(),
                });
                return NextResponse.json({ success: true, message: 'ปักหมุดประกาศสำเร็จ' });
            }

            case 'delete_notice': {
                if (!roomKey) {
                    return NextResponse.json({ success: false, error: 'Missing matchId' }, { status: 400 });
                }
                const noticeRef = adminDb.ref(`chat_notices/${roomKey}`);
                await noticeRef.remove();
                return NextResponse.json({ success: true, message: 'ปลดหมุดประกาศสำเร็จ' });
            }

            case 'send_broadcast': {
                if (!roomKey || !broadcastText) {
                    return NextResponse.json({ success: false, error: 'Missing matchId or broadcastText' }, { status: 400 });
                }
                const chatRef = adminDb.ref(`chats/${roomKey}`);
                await chatRef.push({
                    user: 'แอดมินทีมงาน',
                    text: String(broadcastText).trim(),
                    timestamp: Date.now(),
                    isAdmin: true,
                    role: 'admin',
                });
                return NextResponse.json({ success: true, message: 'ส่งข้อความแอดมินสำเร็จ' });
            }

            case 'save_banner': {
                const { banner } = body;
                if (!banner || !banner.id || !banner.image || !banner.url) {
                    return NextResponse.json({ success: false, error: 'Missing banner fields (id, image, url)' }, { status: 400 });
                }
                const bannerId = String(banner.id).replace(/[.$#[\]/]/g, '_').trim();
                const bannerRef = adminDb.ref(`site_banners/${bannerId}`);
                await bannerRef.set({
                    id: bannerId,
                    title: banner.title || 'สปอนเซอร์',
                    url: banner.url.trim(),
                    image: banner.image.trim(),
                    position: banner.position || 'top_leaderboard',
                    isActive: banner.isActive !== false,
                    order: Number(banner.order) || 0,
                    updatedAt: Date.now(),
                });
                return NextResponse.json({ success: true, message: 'บันทึกแบนเนอร์สำเร็จ' });
            }

            case 'delete_banner': {
                const { bannerId } = body;
                if (!bannerId) {
                    return NextResponse.json({ success: false, error: 'Missing bannerId' }, { status: 400 });
                }
                const cleanId = String(bannerId).replace(/[.$#[\]/]/g, '_').trim();
                await adminDb.ref(`site_banners/${cleanId}`).remove();
                return NextResponse.json({ success: true, message: 'ลบแบนเนอร์สำเร็จ' });
            }

            case 'toggle_banner': {
                const { bannerId, isActive } = body;
                if (!bannerId) {
                    return NextResponse.json({ success: false, error: 'Missing bannerId' }, { status: 400 });
                }
                const cleanId = String(bannerId).replace(/[.$#[\]/]/g, '_').trim();
                await adminDb.ref(`site_banners/${cleanId}`).update({
                    isActive: Boolean(isActive),
                    updatedAt: Date.now(),
                });
                return NextResponse.json({ success: true, message: 'อัปเดตสถานะแบนเนอร์สำเร็จ' });
            }

            case 'ban_user': {
                const { userId, userName, durationMinutes, reason } = body;
                if (!userId) {
                    return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
                }
                const cleanUserId = String(userId).replace(/[.$#[\]/]/g, '_').trim();
                const duration = Number(durationMinutes) || 60;
                const bannedUntil = duration === -1 ? -1 : Date.now() + duration * 60 * 1000;
                
                await adminDb.ref(`banned_users/${cleanUserId}`).set({
                    userId: cleanUserId,
                    userName: userName || 'ผู้ใช้',
                    bannedUntil,
                    reason: reason || 'ทำผิดกฎกติกาการสนทนา',
                    bannedAt: Date.now(),
                });
                return NextResponse.json({ success: true, message: `ระงับการแชทผู้ใช้ ${userName || cleanUserId} สำเร็จ` });
            }

            case 'unban_user': {
                const { userId } = body;
                if (!userId) {
                    return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
                }
                const cleanUserId = String(userId).replace(/[.$#[\]/]/g, '_').trim();
                await adminDb.ref(`banned_users/${cleanUserId}`).remove();
                return NextResponse.json({ success: true, message: 'ปลดแบนผู้ใช้สำเร็จ' });
            }

            default:
                return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
        }
    } catch (err: any) {
        console.error('API admin action error:', err);
        return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
    }
}
