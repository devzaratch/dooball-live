import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { getMatchRoomKey } from '@/lib/utils';
import { isUrlAllowed } from '@/lib/safeFetch';
import type { PlayerStat } from '@/components/table/TopScorersTable';

interface SaveScorersBody {
    action: 'save_scorers';
    leagueId: string;
    scorers: PlayerStat[];
}

function isValidHttpUrl(raw: unknown, maxLen = 2000): boolean {
    if (typeof raw !== 'string') return false;
    const t = raw.trim();
    if (!t || t.length > maxLen) return false;
    return isUrlAllowed(t);
}

function cleanText(raw: unknown, maxLen: number): string | null {
    if (typeof raw !== 'string') return null;
    const t = raw.trim();
    if (!t || t.length > maxLen) return null;
    return t;
}

function isAuthorized(req: NextRequest): boolean {
    const secret = process.env.ADMIN_SECRET_KEY;
    const password = process.env.ADMIN_PASSWORD;
    if (!secret || !password) return false;
    const sessionCookie = req.cookies.get('admin_session')?.value;
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
                if (!isValidHttpUrl(newUrl)) {
                    return NextResponse.json({ success: false, error: 'ลิงก์สตรีมไม่ถูกต้อง (ต้องเป็น http/https)' }, { status: 400 });
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

            case 'save_backup_stream': {
                if (!roomKey) {
                    return NextResponse.json({ success: false, error: 'Missing matchId' }, { status: 400 });
                }
                const backupRef = adminDb.ref(`backup_streams/${roomKey}`);
                const trimmedUrl = String(newUrl || '').trim();

                if (!trimmedUrl) {
                    await backupRef.remove();
                    return NextResponse.json({ success: true, message: 'ลบลิงก์ช่องสำรองเรียบร้อย' });
                }
                if (!isValidHttpUrl(trimmedUrl)) {
                    return NextResponse.json({ success: false, error: 'ลิงก์ช่องสำรองไม่ถูกต้อง (ต้องเป็น http/https)' }, { status: 400 });
                }

                await backupRef.set({
                    id: 'server-backup-kqt',
                    label: body.label || 'ช่องสำรอง 2',
                    url: trimmedUrl,
                    quality: body.quality || '1080p',
                    updatedAt: Date.now(),
                });

                return NextResponse.json({ success: true, message: 'บันทึกลิงก์ช่องสำรองสำเร็จ' });
            }

            case 'delete_backup_stream': {
                if (!roomKey) {
                    return NextResponse.json({ success: false, error: 'Missing matchId' }, { status: 400 });
                }
                const backupRef = adminDb.ref(`backup_streams/${roomKey}`);
                await backupRef.remove();
                return NextResponse.json({ success: true, message: 'ลบลิงก์ช่องสำรองเรียบร้อย' });
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
                const cleanNotice = cleanText(noticeText, 500);
                if (!cleanNotice) {
                    return NextResponse.json({ success: false, error: 'ข้อความประกาศยาวเกินไป (สูงสุด 500 ตัวอักษร)' }, { status: 400 });
                }
                const noticeRef = adminDb.ref(`chat_notices/${roomKey}`);
                await noticeRef.set({
                    text: cleanNotice,
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
                const cleanBroadcast = cleanText(broadcastText, 1000);
                if (!cleanBroadcast) {
                    return NextResponse.json({ success: false, error: 'ข้อความยาวเกินไป (สูงสุด 1000 ตัวอักษร)' }, { status: 400 });
                }
                const chatRef = adminDb.ref(`chats/${roomKey}`);
                await chatRef.push({
                    user: 'แอดมินทีมงาน',
                    text: cleanBroadcast,
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
                if (!isValidHttpUrl(banner.url) || !isValidHttpUrl(banner.image)) {
                    return NextResponse.json({ success: false, error: 'ลิงก์แบนเนอร์ไม่ถูกต้อง (ต้องเป็น http/https)' }, { status: 400 });
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

            case 'check_stream_health': {
                const { url: checkUrl } = body;
                if (!checkUrl) {
                    return NextResponse.json({ success: false, error: 'Missing stream URL' }, { status: 400 });
                }
                const target = String(checkUrl).trim();
                if (!isUrlAllowed(target)) {
                    return NextResponse.json({ success: false, error: 'URL ไม่ถูกต้องหรือไม่ได้รับอนุญาต' }, { status: 400 });
                }
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const testRes = await fetch(target, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        },
                        signal: controller.signal,
                        cache: 'no-store',
                    });
                    clearTimeout(timeoutId);

                    const isOnline = testRes.ok || testRes.status === 200 || testRes.status === 206;
                    return NextResponse.json({
                        success: true,
                        isOnline,
                        status: testRes.status,
                        statusText: testRes.statusText,
                    });
                } catch (err: unknown) {
                    const errorMsg = err instanceof Error ? err.message : 'Connection timeout or CORS/Network error';
                    return NextResponse.json({
                        success: true,
                        isOnline: false,
                        error: errorMsg,
                    });
                }
            }

            case 'save_scorers': {
                const { leagueId, scorers } = body as SaveScorersBody;
                if (!leagueId) {
                    return NextResponse.json({ success: false, error: 'Missing leagueId' }, { status: 400 });
                }
                if (!Array.isArray(scorers)) {
                    return NextResponse.json({ success: false, error: 'scorers must be an array' }, { status: 400 });
                }
                // Validate leagueId format
                if (!/^[0-9]{3,6}$/.test(leagueId)) {
                    return NextResponse.json({ success: false, error: 'Invalid leagueId format' }, { status: 400 });
                }
                // Validate scorers data - use PlayerStat interface
                const cleanedScorers: PlayerStat[] = scorers.map((s) => ({
                    rank: Number(s.rank) || 0,
                    name: String(s.name || '').trim() || `ผู้เล่นอันดับ ${s.rank}`,
                    nameTh: String(s.nameTh || '').trim() || String(s.name || ''),
                    team: String(s.team || '').trim() || 'ไม่ระบุทีม',
                    goals: Number(s.goals) || 0,
                    assists: Number(s.assists) || 0,
                    penalties: Number(s.penalties) || 0,
                    matches: Number(s.matches) || 0,
                    photoUrl: String(s.photoUrl || '').trim() || undefined,
                }));
                const scorerRef = adminDb.ref(`top_scorers/${leagueId}`);
                await scorerRef.set({ scorers: cleanedScorers, updatedAt: Date.now() });
                return NextResponse.json({ success: true, message: 'บันทุดอันดับดาวซัลโวสำเร็จ', leagueId, count: cleanedScorers.length });
            }

            default:
                return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
        }
    } catch (err: unknown) {
        console.error('API admin action error:', err);
        return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
    }
}
