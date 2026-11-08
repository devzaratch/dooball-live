'use client';

import { useState, useEffect } from 'react';
import { 
    Shield, Lock, LogOut, Radio, Flag, MessageSquare, Megaphone, 
    Trash2, RefreshCw, CheckCircle2, AlertTriangle, Send, Pin, 
    Search, Loader2, X, Image as ImageIcon, Plus, Edit2, Ban, Eye, EyeOff, ShieldCheck, UserX,
    ExternalLink, Copy, Check, Tv, Trophy
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useRealtimeMatches } from '@/hooks/useRealtimeMatches';
import { getMatchRoomKey } from '@/lib/utils';
import { bannerData as defaultBanners, BannerItem } from '@/components/ads/AdBanner';
import { CLUB_BADGES } from '@/components/chat/LiveChat';

interface StreamReportItem {
    matchId: string;
    streamId: string;
    count: number;
    matchName: string;
    streamLabel: string;
    streamUrl: string;
    lastReportedAt?: number;
}

interface ScorerItem {
    rank: number;
    name: string;
    nameTh?: string;
    team: string;
    goals: number;
    assists: number;
    penalties?: number;
    matches: number;
    photoUrl?: string;
}

interface ChatLogMessage {
    id: string;
    userId?: string;
    user: string;
    clubBadge?: string;
    text: string;
    timestamp?: number;
    isAdmin?: boolean;
}

interface BannedUserItem {
    userId: string;
    userName: string;
    bannedUntil: number;
    reason: string;
    bannedAt: number;
}

export default function AdminClient() {
    // 🔐 Auth State
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // 📱 Navigation State
    const [activeTab, setActiveTab] = useState<'reports' | 'chat' | 'broadcast' | 'banners' | 'backups' | 'scorers'>('reports');

    // 🚨 Stream Reports State
    const [reports, setReports] = useState<StreamReportItem[]>([]);
    const [editingStream, setEditingStream] = useState<{ matchId: string; streamId: string; currentUrl: string } | null>(null);
    const [newStreamUrl, setNewStreamUrl] = useState('');
    const [reportActionStatus, setReportActionStatus] = useState<string | null>(null);

    // 💬 Chat Moderation State
    const { matches = [] } = useRealtimeMatches([]);
    const [selectedMatchId, setSelectedMatchId] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<ChatLogMessage[]>([]);
    const [searchChat, setSearchChat] = useState('');
    const [pinnedNotice, setPinnedNotice] = useState<string | null>(null);

    // 🚫 Ban Users State
    const [bannedUsers, setBannedUsers] = useState<BannedUserItem[]>([]);
    const [banningTarget, setBanningTarget] = useState<{ userId: string; userName: string } | null>(null);
    const [banDuration, setBanDuration] = useState<number>(60); // 60 mins, 1440 mins, -1 (perm)
    const [banReasonInput, setBanReasonInput] = useState<string>('สแปมข้อความ / ใช้คำไม่สุภาพ');

    // 🖼️ Ad Banners State
    const [banners, setBanners] = useState<BannerItem[]>([]);
    const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

    // 📢 Broadcast State
    const [broadcastText, setBroadcastText] = useState('');
    const [broadcastMode, setBroadcastMode] = useState<'chat' | 'pin'>('chat');
    const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

    // 🏆 Top Scorers Management State
    const [manageScorersLeagueId, setManageScorersLeagueId] = useState<string>('');
    const [scorersForm, setScorersForm] = useState<ScorerItem[]>([]);
    const [scorersStatus, setScorersStatus] = useState<string | null>(null);

    // 🎬 Backup Streams State (จัดการช่องสำรองเฉพาะกิจ)
    const [backupStreams, setBackupStreams] = useState<Record<string, { id?: string; label?: string; url: string; quality?: string; updatedAt?: number }>>({});
    const [editingBackupMatch, setEditingBackupMatch] = useState<{ matchKey: string; matchName: string; currentUrl: string } | null>(null);
    const [backupUrlInput, setBackupUrlInput] = useState<string>('');
    const [backupSearchQuery, setBackupSearchQuery] = useState<string>('');
    const [backupStatusFilter, setBackupStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'HAS_BACKUP'>('ALL');
    const [isSavingBackup, setIsSavingBackup] = useState<boolean>(false);
    const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null);

    // 🩺 Stream Health Check State
    const [streamHealthMap, setStreamHealthMap] = useState<Record<string, { isOnline?: boolean; status?: number; checking?: boolean; error?: string }>>({});

    const handleCheckStreamHealth = async (url: string) => {
        if (!url) return;
        setStreamHealthMap((prev) => ({ ...prev, [url]: { checking: true } }));
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check_stream_health', url }),
            });
            const data = await res.json();
            setStreamHealthMap((prev) => ({
                ...prev,
                [url]: {
                    checking: false,
                    isOnline: Boolean(data.isOnline),
                    status: data.status,
                    error: data.error,
                },
            }));
        } catch {
            setStreamHealthMap((prev) => ({
                ...prev,
                [url]: { checking: false, isOnline: false, error: 'Network error' },
            }));
        }
    };

    // 1. ตรวจสอบสถานะการเข้าสู่ระบบเริ่มต้น
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const res = await fetch('/api/admin/auth');
                const data = await res.json();
                setIsAuthenticated(Boolean(data?.authenticated));
            } catch {
                setIsAuthenticated(false);
            }
        };
        verifyAuth();
    }, []);

    // 2. จัดการ Login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAuthenticating(true);
        setAuthError(null);

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordInput }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setIsAuthenticated(true);
                setPasswordInput('');
            } else {
                setAuthError(data.error || 'รหัสผ่านไม่ถูกต้อง');
            }
        } catch {
            setAuthError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        } finally {
            setIsAuthenticating(false);
        }
    };

    // 3. จัดการ Logout
    const handleLogout = async () => {
        try {
            await fetch('/api/admin/auth', { method: 'DELETE' });
            setIsAuthenticated(false);
        } catch {
            setIsAuthenticated(false);
        }
    };

    // 4. โหลดข้อมูลรายงานลิงก์เสีย Realtime จาก Firebase
    useEffect(() => {
        if (!isAuthenticated) return;

        const reportsRef = ref(db, 'stream_reports');
        const unsubscribe = onValue(reportsRef, (snapshot) => {
            const val = snapshot.val();
            if (!val) {
                setReports([]);
                return;
            }

            const items: StreamReportItem[] = [];
            Object.keys(val).forEach((matchKey) => {
                const streamGroup = val[matchKey];
                if (streamGroup) {
                    Object.keys(streamGroup).forEach((streamKey) => {
                        const streamData = streamGroup[streamKey];
                        if (streamData) {
                            items.push({
                                matchId: matchKey,
                                streamId: streamKey,
                                count: streamData.count || 0,
                                matchName: streamData.summary?.matchName || matchKey,
                                streamLabel: streamData.summary?.streamLabel || streamKey,
                                streamUrl: streamData.summary?.streamUrl || '',
                                lastReportedAt: streamData.summary?.lastReportedAt,
                            });
                        }
                    });
                }
            });

            items.sort((a, b) => b.count - a.count);
            setReports(items);
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // 5. โหลดข้อมูลแบนเนอร์โฆษณา Realtime จาก Firebase
    useEffect(() => {
        if (!isAuthenticated) return;

        const bannersRef = ref(db, 'site_banners');
        const unsubscribe = onValue(bannersRef, (snapshot) => {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                const list: BannerItem[] = Object.keys(data).map((k) => ({
                    id: k,
                    ...data[k],
                }));
                list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
                setBanners(list);
            } else {
                setBanners([]);
            }
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // 6. โหลดรายชื่อผู้ใช้ที่ถูกแบน
    useEffect(() => {
        if (!isAuthenticated) return;

        const banRef = ref(db, 'banned_users');
        const unsubscribe = onValue(banRef, (snapshot) => {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                const list: BannedUserItem[] = Object.keys(data).map((k) => ({
                    userId: k,
                    ...data[k],
                }));
                setBannedUsers(list);
            } else {
                setBannedUsers([]);
            }
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // 6.1 โหลดข้อมูลช่องสำรอง Realtime จาก Firebase
    useEffect(() => {
        if (!isAuthenticated) return;

        const backupRef = ref(db, 'backup_streams');
        const unsubscribe = onValue(backupRef, (snapshot) => {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                setBackupStreams(data);
            } else {
                setBackupStreams({});
            }
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // 7. ตั้งค่าคู่แมตช์เริ่มต้นสำหรับแท็บแชท
    useEffect(() => {
        if (matches.length > 0 && !selectedMatchId) {
            const firstMatch = matches.find((m) => m.status === 'LIVE') || matches[0];
            const cleanId = firstMatch ? getMatchRoomKey(firstMatch) : '';
            queueMicrotask(() => setSelectedMatchId(cleanId));
        }
    }, [matches, selectedMatchId]);

    // 8. ดึงข้อความแชทสดและประกาศของแมตช์ที่เลือก
    useEffect(() => {
        if (!isAuthenticated || !selectedMatchId) return;

        const matchRoomKey = getMatchRoomKey(selectedMatchId);
        const chatRef = ref(db, `chats/${matchRoomKey}`);
        const noticeRef = ref(db, `chat_notices/${matchRoomKey}`);

        const unsubChat = onValue(chatRef, (snapshot) => {
            const val = snapshot.val();
            if (!val) {
                setChatMessages([]);
                return;
            }

            const msgs: ChatLogMessage[] = Object.keys(val).map((key) => ({
                id: key,
                userId: val[key].userId,
                user: val[key].user || 'Anonymous',
                clubBadge: val[key].clubBadge,
                text: val[key].text || '',
                timestamp: val[key].timestamp,
                isAdmin: val[key].isAdmin || val[key].role === 'admin',
            }));

            msgs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setChatMessages(msgs);
        });

        const unsubNotice = onValue(noticeRef, (snapshot) => {
            const val = snapshot.val();
            setPinnedNotice(val?.text || null);
        });

        return () => {
            unsubChat();
            unsubNotice();
        };
    }, [isAuthenticated, selectedMatchId]);

    // 🛠️ Action: เคลียร์รายงานลิงก์เสีย
    const handleClearReport = async (matchId: string, streamId: string) => {
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resolve_report', matchId, streamId }),
            });
            const data = await res.json();
            if (data.success) {
                setReportActionStatus('เคลียร์สถานะรายงานเรียบร้อยแล้ว');
                setTimeout(() => setReportActionStatus(null), 3000);
            }
        } catch (err) {
            console.error('Failed to resolve report:', err);
        }
    };

    // 🛠️ Action: เปลี่ยนลิงก์สตรีมด่วน
    const handleSaveNewStreamUrl = async () => {
        if (!editingStream || !newStreamUrl.trim()) return;

        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'replace_stream',
                    matchId: editingStream.matchId,
                    streamId: editingStream.streamId,
                    newUrl: newStreamUrl.trim(),
                }),
            });
            const data = await res.json();

            if (data.success) {
                setReportActionStatus('อัปเดตลิงก์สตรีมใหม่สำเร็จ และส่งไปยังคนดูทันที!');
                setEditingStream(null);
                setNewStreamUrl('');
                setTimeout(() => setReportActionStatus(null), 3000);
            }
        } catch (err) {
            console.error('Failed to replace stream URL:', err);
        }
    };

    // 🛠️ Action: ลบข้อความแชทเดี่ยว
    const handleDeleteMessage = async (msgId: string) => {
        if (!selectedMatchId || !msgId) return;

        try {
            await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_chat', matchId: selectedMatchId, messageId: msgId }),
            });
        } catch (err) {
            console.error('Failed to delete chat message:', err);
        }
    };

    // 🛠️ Action: ล้างแชททั้งห้อง
    const handleClearAllRoomChat = async () => {
        if (!selectedMatchId) return;
        if (confirm('⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบข้อความแชททั้งหมดในคู่นี้?')) {
            try {
                await fetch('/api/admin/actions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'clear_chat_room', matchId: selectedMatchId }),
                });
            } catch (err) {
                console.error('Failed to clear room chat:', err);
            }
        }
    };

    // 🛠️ Action: แบนผู้ใช้
    const handleConfirmBanUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!banningTarget) return;

        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ban_user',
                    userId: banningTarget.userId,
                    userName: banningTarget.userName,
                    durationMinutes: banDuration,
                    reason: banReasonInput.trim(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setReportActionStatus(data.message);
                setBanningTarget(null);
                setTimeout(() => setReportActionStatus(null), 3000);
            }
        } catch (err) {
            console.error('Failed to ban user:', err);
        }
    };

    // 🛠️ Action: ปลดแบนผู้ใช้
    const handleUnbanUser = async (userId: string) => {
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'unban_user', userId }),
            });
            const data = await res.json();
            if (data.success) {
                setReportActionStatus(data.message);
                setTimeout(() => setReportActionStatus(null), 3000);
            }
        } catch (err) {
            console.error('Failed to unban user:', err);
        }
    };

    // 🛠️ Action: บันทึกแบนเนอร์โฆษณา
    const handleSaveBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBanner) return;

        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_banner',
                    banner: editingBanner,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setReportActionStatus('บันทึกข้อมูลแบนเนอร์สำเร็จ');
                setIsBannerModalOpen(false);
                setEditingBanner(null);
                setTimeout(() => setReportActionStatus(null), 3000);
            }
        } catch (err) {
            console.error('Failed to save banner:', err);
        }
    };

    // 🛠️ Action: ลบแบนเนอร์
    const handleDeleteBanner = async (bannerId: string) => {
        if (!confirm('คุณต้องการลบแบนเนอร์นี้ใช่หรือไม่?')) return;
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_banner', bannerId }),
            });
            const data = await res.json();
            if (data.success) {
                setReportActionStatus('ลบแบนเนอร์สำเร็จ');
                setTimeout(() => setReportActionStatus(null), 3000);
            }
        } catch (err) {
            console.error('Failed to delete banner:', err);
        }
    };

    // 🛠️ Action: สลับเปิด/ปิดแบนเนอร์
    const handleToggleBanner = async (bannerId: string, currentActive: boolean) => {
        try {
            await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle_banner',
                    bannerId,
                    isActive: !currentActive,
                }),
            });
        } catch (err) {
            console.error('Failed to toggle banner:', err);
        }
    };

    // 🛠️ Action: คัดลอกแบนเนอร์เริ่มต้นเข้าสู่ฐานข้อมูล
    const handleSeedDefaultBanners = async () => {
        for (const b of defaultBanners) {
            await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_banner',
                    banner: b,
                }),
            });
        }
        setReportActionStatus('นำเข้าแบนเนอร์เริ่มต้นสำเร็จแล้ว!');
        setTimeout(() => setReportActionStatus(null), 3000);
    };

    // 🛠️ Action: ส่งข้อความ / ปักหมุดในฐานะแอดมิน
    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMatchId || !broadcastText.trim()) return;

        try {
            if (broadcastMode === 'chat') {
                const res = await fetch('/api/admin/actions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'send_broadcast',
                        matchId: selectedMatchId,
                        broadcastText: broadcastText.trim(),
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setBroadcastStatus('ส่งข้อความแอดมินเข้าห้องแชทเรียบร้อยแล้ว!');
                }
            } else {
                const res = await fetch('/api/admin/actions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'set_notice',
                        matchId: selectedMatchId,
                        noticeText: broadcastText.trim(),
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setBroadcastStatus('ปักหมุดประกาศบนหัวห้องแชทเรียบร้อยแล้ว!');
                }
            }

            setBroadcastText('');
            setTimeout(() => setBroadcastStatus(null), 3000);
        } catch (err) {
            console.error('Broadcast failed:', err);
        }
    };

    // 🛠️ Action: ปลดหมุดประกาศ
    const handleRemovePinnedNotice = async () => {
        if (!selectedMatchId) return;
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_notice', matchId: selectedMatchId }),
            });
            const data = await res.json();
            if (data.success) {
                setBroadcastStatus('ปลดหมุดประกาศเรียบร้อยแล้ว');
                setTimeout(() => setBroadcastStatus(null), 3000);
            }
        } catch (err) {
            console.error('Failed to remove notice:', err);
        }
    };

    // 🛠️ Action: บันทึกลิงก์ช่องสำรองสด
    const handleSaveBackupStream = async (matchKey: string, url: string) => {
        if (!matchKey) return;
        setIsSavingBackup(true);
        try {
            const res = await fetch('/api/admin/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_backup_stream',
                    matchId: matchKey,
                    newUrl: url.trim(),
                    label: 'ช่องสำรอง 2',
                    quality: '1080p',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setReportActionStatus(url.trim() ? '✅ บันทึกลิงก์ช่องสำรองสำเร็จ และซิงค์สดไปยังคนดูทันที!' : '🗑️ ลบช่องสำรองเรียบร้อย');
                setEditingBackupMatch(null);
                setBackupUrlInput('');
                setTimeout(() => setReportActionStatus(null), 3500);
            }
        } catch (err) {
            console.error('Failed to save backup stream:', err);
        } finally {
            setIsSavingBackup(false);
        }
    };

    const handleDeleteBackupStream = async (matchKey: string) => {
        if (!matchKey) return;
        if (confirm('⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบช่องสำรองของคู่นี้?')) {
            await handleSaveBackupStream(matchKey, '');
        }
    };

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUrlKey(key);
        setTimeout(() => setCopiedUrlKey(null), 2000);
    };

    // -------------------------------------------------------------
    // 🔒 SCREEN 1: Admin Authentication Gate
    // -------------------------------------------------------------
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-[#070A0F] flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 text-[#E5B842] animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E5B842]/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative w-full max-w-md bg-[#0B0F17]/90 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E5B842]/20 to-amber-600/10 border border-[#E5B842]/30 flex items-center justify-center text-[#E5B842] shadow-[0_0_20px_rgba(229,184,66,0.2)]">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h1 className="text-xl font-black text-slate-100 tracking-wide">
                            DOOBALL LIVE <span className="text-[#E5B842]">OPERATIONS</span>
                        </h1>
                        <p className="text-xs text-slate-400">
                            ระบบศูนย์ควบคุมการถ่ายทอดสด (สำหรับผู้ดูแลระบบเท่านั้น)
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {authError && (
                            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>{authError}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-[#E5B842]" /> รหัสผ่านผู้ดูแลระบบ
                            </label>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="กรอกรหัสผ่าน Admin Passcode"
                                required
                                autoFocus
                                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#E5B842]/60 font-mono"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isAuthenticating}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E5B842] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isAuthenticating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Lock className="w-3.5 h-3.5" />
                                    เข้าสู่ระบบควบคุม
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // 🎛️ SCREEN 2: Admin Operations Dashboard
    // -------------------------------------------------------------
    const filteredChatMessages = chatMessages.filter((m) =>
        !searchChat || m.text.toLowerCase().includes(searchChat.toLowerCase()) || m.user.toLowerCase().includes(searchChat.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#070A0F] text-slate-200 font-sans p-3 sm:p-6 pb-20">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top Control Bar */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-[#0B0F17]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E5B842]/20 to-amber-600/10 border border-[#E5B842]/30 flex items-center justify-center text-[#E5B842] shadow-[0_0_15px_rgba(229,184,66,0.2)]">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-wide">
                                    LIVE OPERATIONS <span className="text-[#E5B842]">ROOM</span>
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    ONLINE
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                ศูนย์รับแจ้งลิงก์เสีย, ควบคุมแชทสด & จัดการแบนเนอร์สปอนเซอร์
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 bg-white/[0.03] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 transition-all cursor-pointer active:scale-95"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>ออกจากระบบ</span>
                        </button>
                    </div>
                </header>

                {/* Action Feedback Notification */}
                {(reportActionStatus || broadcastStatus) && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{reportActionStatus || broadcastStatus}</span>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0B0F17] border border-white/10 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'reports'
                                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Flag className="w-3.5 h-3.5" />
                        <span>กล่องรับแจ้งลิงก์เสีย</span>
                        {reports.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-600 text-[10px] font-black">
                                {reports.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'chat'
                                ? 'bg-[#E5B842] text-black font-extrabold shadow-lg shadow-amber-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>ตรวจสอบ & ควบคุมแชทสด</span>
                        {bannedUsers.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-300 text-[10px] font-black">
                                🚫 {bannedUsers.length} แบน
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('banners')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'banners'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>จัดการแบนเนอร์โฆษณา</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-white text-[10px] font-bold">
                            {banners.length} ป้าย
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('backups')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'backups'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Radio className="w-3.5 h-3.5 text-emerald-400" />
                        <span>จัดการลิงก์สำรอง (Backup Streams)</span>
                        {Object.keys(backupStreams).length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-black border border-emerald-400/40">
                                {Object.keys(backupStreams).length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('broadcast')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'broadcast'
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>ประกาศทางการจากแอดมิน</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('scorers')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'scorers'
                                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>จัดการอันดับดาวซัลโว</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-white text-[10px] font-bold">
                            {scorersForm.length} รายการ
                        </span>
                    </button>
                </div>

                {/* ========================================================= */}
                {/* TAB 1: 🚨 กล่องรับแจ้งลิงก์เสีย (Stream Reports Inbox) */}
                {/* ========================================================= */}
                {activeTab === 'reports' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                <Flag className="w-4 h-4 text-rose-400" />
                                รายการแจ้งสัญญาณเสีย ({reports.length} รายการ)
                            </h2>
                        </div>

                        {reports.length === 0 ? (
                            <div className="py-20 rounded-3xl bg-[#0B0F17]/60 border border-white/10 text-center flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-slate-200">สัญญาณทุกช่องทำงานปกติ</h3>
                                <p className="text-xs text-slate-400">ยังไม่มีผู้ใช้กดรายงานปัญหาลิงก์เสียเข้ามาในขณะนี้</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {reports.map((item) => (
                                    <div
                                        key={`${item.matchId}-${item.streamId}`}
                                        className="p-5 rounded-3xl bg-[#0B0F17]/90 border border-rose-500/30 hover:border-rose-500/60 shadow-xl space-y-4 transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                                                    พบปัญหาในช่องนี้
                                                </span>
                                                <h3 className="text-sm font-bold text-slate-100 line-clamp-1">
                                                    {item.matchName}
                                                </h3>
                                                <p className="text-xs text-slate-400">{item.streamLabel}</p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black border border-rose-500/30 shrink-0">
                                                🚨 {item.count} แจ้งเตือน
                                            </span>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 break-all space-y-1">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase block">URL ปัจจุบัน:</span>
                                            <span className="line-clamp-2">{item.streamUrl || 'ยังไม่ได้ระบุ URL'}</span>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => {
                                                    setEditingStream({ matchId: item.matchId, streamId: item.streamId, currentUrl: item.streamUrl });
                                                    setNewStreamUrl(item.streamUrl || '');
                                                }}
                                                className="flex-1 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                                เปลี่ยนลิงก์ด่วน
                                            </button>
                                            <button
                                                onClick={() => handleClearReport(item.matchId, item.streamId)}
                                                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                                title="เคลียร์เคสนี้เมื่อแก้เสร็จแล้ว"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                แก้แล้ว
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Modal เปลี่ยนลิงก์สตรีมมิ่งด่วน */}
                        {editingStream && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                                <div className="w-full max-w-lg bg-[#0B0F17] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 text-amber-400" />
                                            วางลิงก์สตรีมมิ่งใหม่ (HLS .m3u8 หรือ Iframe)
                                        </h3>
                                        <button
                                            onClick={() => setEditingStream(null)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300">
                                            URL สัญญาณใหม่:
                                        </label>
                                        <textarea
                                            value={newStreamUrl}
                                            onChange={(e) => setNewStreamUrl(e.target.value)}
                                            placeholder="https://.../index.m3u8 หรือ <iframe src=...>"
                                            rows={3}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400/50"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingStream(null)}
                                            className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-xs font-bold border border-white/10 cursor-pointer"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveNewStreamUrl}
                                            className="flex-1 py-2.5 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 cursor-pointer"
                                        >
                                            บันทึกและส่งให้คนดูทันที
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: 💬 ตรวจสอบ & ควบคุมแชทสด (Chat Moderation & Ban) */}
                {/* ========================================================= */}
                {activeTab === 'chat' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
                        {/* Match Selector & Banned List Sidebar */}
                        <div className="space-y-4">
                            <div className="p-4 rounded-3xl bg-[#0B0F17]/90 border border-white/10 space-y-3">
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                    เลือกห้องแชทของแมตช์
                                </h3>
                                <div className="space-y-1.5 max-h-[350px] overflow-y-auto custom-scrollbar">
                                    {matches.map((m) => {
                                        const matchKey = getMatchRoomKey(m);
                                        const isSelected = selectedMatchId === matchKey;

                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => setSelectedMatchId(matchKey)}
                                                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md font-bold'
                                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between text-[11px] mb-1">
                                                    <span className="text-slate-400 truncate max-w-[160px]">{m.league?.name || 'ฟุตบอล'}</span>
                                                    {m.status === 'LIVE' ? (
                                                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold">
                                                            LIVE
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-500">{m.kickoffTime}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs truncate font-bold text-slate-100">
                                                    {m.homeTeam?.name} vs {m.awayTeam?.name}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Banned Users List */}
                            <div className="p-4 rounded-3xl bg-[#0B0F17]/90 border border-white/10 space-y-2.5">
                                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Ban className="w-3.5 h-3.5 text-rose-500" /> รายชื่อผู้ใช้ที่ถูกแบน ({bannedUsers.length})
                                    </span>
                                </h4>
                                {bannedUsers.length === 0 ? (
                                    <p className="text-[11px] text-slate-500 italic py-2 text-center">ไม่มีผู้ใช้ถูกแบนในขณะนี้</p>
                                ) : (
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                        {bannedUsers.map((b) => (
                                            <div key={b.userId} className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2 text-xs">
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-slate-200 truncate">{b.userName}</div>
                                                    <div className="text-[10px] text-slate-500 truncate">{b.reason}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnbanUser(b.userId)}
                                                    className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold shrink-0 cursor-pointer"
                                                >
                                                    ปลดแบน
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat Inspection & Delete Room */}
                        <div className="p-5 rounded-3xl bg-[#0B0F17]/90 border border-white/10 space-y-4 flex flex-col h-[650px]">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4 shrink-0">
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-[#E5B842]" />
                                        กล่องข้อความแชทสด ({filteredChatMessages.length} ข้อความ)
                                    </h3>
                                    <p className="text-xs text-slate-400 truncate max-w-sm">ห้อง: {selectedMatchId || 'ยังไม่ได้เลือกแมตช์'}</p>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-48">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text"
                                            value={searchChat}
                                            onChange={(e) => setSearchChat(e.target.value)}
                                            placeholder="ค้นหาคำหยาบ..."
                                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleClearAllRoomChat}
                                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                                        title="ล้างข้อความแชทในห้องนี้ทั้งหมด"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        ล้างทั้งห้อง
                                    </button>
                                </div>
                            </div>

                            {/* Pinned Notice Display */}
                            {pinnedNotice && (
                                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-300 flex items-center justify-between gap-2 shrink-0">
                                    <div className="flex items-center gap-2 truncate">
                                        <Pin className="w-4 h-4 text-amber-400 shrink-0" />
                                        <span className="truncate"><strong>ปักหมุดปัจจุบัน:</strong> {pinnedNotice}</span>
                                    </div>
                                    <button
                                        onClick={handleRemovePinnedNotice}
                                        className="text-[11px] font-bold text-rose-400 hover:underline shrink-0 cursor-pointer"
                                    >
                                        ปลดหมุด
                                    </button>
                                </div>
                            )}

                            {/* Message Feed List */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
                                {filteredChatMessages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                                        ไม่มีข้อความในห้องนี้ หรือไม่พบคำที่ค้นหา
                                    </div>
                                ) : (
                                    filteredChatMessages.map((msg) => {
                                        const badgeObj = CLUB_BADGES.find((b) => b.id === msg.clubBadge);

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 group transition-all ${
                                                    msg.isAdmin
                                                        ? 'bg-amber-500/10 border-amber-500/30'
                                                        : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                                                }`}
                                            >
                                                <div className="space-y-0.5 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {msg.isAdmin ? (
                                                            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black font-black text-[9px]">
                                                                ADMIN
                                                            </span>
                                                        ) : null}
                                                        {badgeObj && (
                                                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badgeObj.badgeStyle}`}>
                                                                {badgeObj.icon} {badgeObj.name}
                                                            </span>
                                                        )}
                                                        <span className="text-xs font-bold text-slate-300">{msg.user}</span>
                                                        {msg.userId && (
                                                            <span className="text-[9px] text-slate-600 font-mono">
                                                                ID: {msg.userId}
                                                            </span>
                                                        )}
                                                        {msg.timestamp && (
                                                            <span className="text-[10px] text-slate-500">
                                                                {new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-200 break-words">{msg.text}</p>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {msg.userId && !msg.isAdmin && (
                                                        <button
                                                            onClick={() => setBanningTarget({ userId: msg.userId!, userName: msg.user })}
                                                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                                            title="สั่งแบนผู้ใช้คนนี้"
                                                        >
                                                            <Ban className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                                        title="ลบข้อความนี้"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Ban User Modal */}
                        {banningTarget && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                                <div className="w-full max-w-md bg-[#0B0F17] border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <h3 className="font-extrabold text-sm text-rose-400 flex items-center gap-2">
                                            <Ban className="w-4 h-4" />
                                            สั่งระงับสิทธิ์การแชท (Ban User)
                                        </h3>
                                        <button
                                            onClick={() => setBanningTarget(null)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleConfirmBanUser} className="space-y-4">
                                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                                            <div className="text-xs text-slate-400">เป้าหมาย: <strong className="text-slate-100">{banningTarget.userName}</strong></div>
                                            <div className="text-[10px] text-slate-500 font-mono">User ID: {banningTarget.userId}</div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-300">ระยะเวลาการแบน:</label>
                                            <select
                                                value={banDuration}
                                                onChange={(e) => setBanDuration(Number(e.target.value))}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 focus:outline-none"
                                            >
                                                <option value={60}>แบนชั่วคราว 1 ชั่วโมง (60 นาที)</option>
                                                <option value={1440}>แบน 1 วัน (24 ชั่วโมง)</option>
                                                <option value={10080}>แบน 7 วัน</option>
                                                <option value={-1}>แบนถาวร (Permanent Ban)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-300">เหตุผลที่แบน:</label>
                                            <input
                                                type="text"
                                                value={banReasonInput}
                                                onChange={(e) => setBanReasonInput(e.target.value)}
                                                required
                                                placeholder="เช่น สแปมข้อความ, ใช้คำไม่สุภาพ, ชวนทะเลาะ"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-rose-500/50"
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setBanningTarget(null)}
                                                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-xs font-bold border border-white/10 cursor-pointer"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 cursor-pointer"
                                            >
                                                ยืนยันการแบน
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB: 🏆 จัดการอันดับดาวซัลโว (Top Scorers Management) */}
                {/* ========================================================= */}
                {activeTab === 'scorers' && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-3xl bg-[#0B0F17]/90 border border-white/10 space-y-3">
                            <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                จัดการอันดับดาวซัลโว
                            </h2>
                            <p className="text-xs text-slate-400">
                                อัปเดตอันดับดาวซัลโวสูงสุดสำหรับลีกที่เลือก เลือกลีกกดข้อมูลได้ทันที
                            </p>
                        </div>

                        {/* League Selector & Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* League Selector */}
                            <div>
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    เลือกลีก
                                </label>
                                <select
                                    value={manageScorersLeagueId}
                                    onChange={(e) => setManageScorersLeagueId(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-amber-400/50"
                                >
                                    <option value="">-- เลือกลีก --</option>
                                    <option value="4328">พรีเมียร์ลีก (4328)</option>
                                    <option value="4335">ลาลีกา (4335)</option>
                                    <option value="4331">บุนเดสลีกา (4331)</option>
                                    <option value="4332">เซเรียอา (4332)</option>
                                    <option value="4334">ลีกเอิง (4334)</option>
                                </select>
                            </div>

                            {/* Scorers Form */}
                            <div>
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    ป้อนข้อมูลดาวซัลโว (สูงสุด 20 อันดับ)
                                </label>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {scorersForm.map((player, idx) => (
                                        <div
                                            key={player.name}
                                            className="p-3 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3 space-x-3"
                                        >
                                            <span className="flex-1 text-xs text-slate-400">{player.rank}.</span>
                                            <input
                                                value={player.name}
                                                onChange={(e) => {
                                                    const newForm = [...scorersForm];
                                                    newForm[idx] = { ...newForm[idx], name: e.target.value };
                                                    setScorersForm(newForm);
                                                }}
                                                placeholder="ชื่อผู้เล่น"
                                                className="flex-1 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-amber-400/50"
                                                maxLength={50}
                                            />
                                            <input
                                                value={player.team}
                                                onChange={(e) => {
                                                    const newForm = [...scorersForm];
                                                    newForm[idx] = { ...newForm[idx], team: e.target.value };
                                                    setScorersForm(newForm);
                                                }}
                                                placeholder="ทีม"
                                                className="w-32 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-amber-400/50"
                                                maxLength={50}
                                            />
                                            <input
                                                value={player.goals}
                                                type="number"
                                                onChange={(e) => {
                                                    const newForm = [...scorersForm];
                                                    newForm[idx] = { ...newForm[idx], goals: Number(e.target.value) };
                                                    setScorersForm(newForm);
                                                }}
                                                min="0"
                                                className="w-24 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-400/50"
                                            />
                                            <input
                                                value={player.assists}
                                                type="number"
                                                onChange={(e) => {
                                                    const newForm = [...scorersForm];
                                                    newForm[idx] = { ...newForm[idx], assists: Number(e.target.value) };
                                                    setScorersForm(newForm);
                                                }}
                                                min="0"
                                                className="w-24 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-400/50"
                                            />
                                            <button
                                                onClick={() => setScorersForm(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-xs text-rose-400 hover:text-rose-300"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    ))}
                                    {scorersForm.length < 20 && (
                                        <button
                                            onClick={() => setScorersForm(prev => [...prev, { rank: prev.length + 1, name: '', team: '', goals: 0, assists: 0, penalties: 0, matches: 0 }])}
                                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-400 flex items-center gap-1.5 transition-all cursor-pointer hover:bg-amber-500/20"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            เพิ่มบรรทัดใหม่
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-3 border-t border-white/10">
                            <button
                                onClick={() => setScorersForm([])}
                                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-400 transition-all cursor-pointer"
                            >
                                รีเซ็ตฟอร์ม
                            </button>
                            <button
                                onClick={async () => {
                                    if (!manageScorersLeagueId || scorersForm.length === 0) {
                                        setScorersStatus('กรุณาเลือกลีกและป้อนข้อมูลดาวซัลโว');
                                        setTimeout(() => setScorersStatus(null), 3000);
                                        return;
                                    }
                                    setScorersStatus('กำลังบันทึก...');
                                    try {
                                        const res = await fetch('/api/admin/actions', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                action: 'save_scorers',
                                                leagueId: manageScorersLeagueId,
                                                scorers: scorersForm,
                                            }),
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            setScorersStatus(`บันทึกดาวซัลโว ${data.count} รายการ สำเร็จ`);
                                            setTimeout(() => setScorersStatus(null), 3000);
                                            setScorersForm([]);
                                            setManageScorersLeagueId('');
                                        } else {
                                            setScorersStatus(`ผิดพลาด: ${data.error}`);
                                            setTimeout(() => setScorersStatus(null), 3000);
                                        }
                                    } catch (err) {
                                        console.error('Save scorers failed:', err);
                                        setScorersStatus('เกิดข้อผิดพลาดในการบันทึก');
                                        setTimeout(() => setScorersStatus(null), 3000);
                                    }
                                }}
                                className="flex-1 py-2 rounded-xl bg-[#E5B842] hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 cursor-pointer"
                            >
                                บันทึกอันดับดาวซัลโว
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: 🖼️ จัดการแบนเนอร์โฆษณา (Ad Banner Management) */}
                {/* ========================================================= */}
                {activeTab === 'banners' && (
                    <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-blue-400" />
                                    จัดการป้ายแบนเนอร์สปอนเซอร์ ({banners.length} รายการ)
                                </h2>
                                <p className="text-xs text-slate-400">
                                    แก้ไขป้ายสปอนเซอร์ GIF/PNG, สลับเปิด-ปิด หรือเพิ่มแบนเนอร์ใหม่ได้ทันที
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {banners.length === 0 && (
                                    <button
                                        onClick={handleSeedDefaultBanners}
                                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        นำเข้า 6 แบนเนอร์เริ่มต้น
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setEditingBanner({
                                            id: `ad-${Date.now()}`,
                                            title: '',
                                            image: '',
                                            url: '',
                                            position: 'top_leaderboard',
                                            isActive: true,
                                            order: banners.length + 1,
                                        });
                                        setIsBannerModalOpen(true);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    เพิ่มแบนเนอร์ใหม่
                                </button>
                            </div>
                        </div>

                        {banners.length === 0 ? (
                            <div className="py-20 rounded-3xl bg-[#0B0F17]/60 border border-white/10 text-center flex flex-col items-center justify-center gap-3">
                                <ImageIcon className="w-12 h-12 text-slate-600" />
                                <h3 className="text-sm font-bold text-slate-300">ยังไม่มีข้อมูลแบนเนอร์ในฐานข้อมูล (กำลังใช้แบนเนอร์ Default)</h3>
                                <p className="text-xs text-slate-500">คลิก &ldquo;นำเข้า 6 แบนเนอร์เริ่มต้น&rdquo; หรือกด &ldquo;เพิ่มแบนเนอร์ใหม่&rdquo; เพื่อเริ่มจัดการ</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {banners.map((b) => (
                                    <div
                                        key={b.id}
                                        className={`p-4 rounded-3xl bg-[#0B0F17]/90 border transition-all space-y-3 flex flex-col justify-between ${
                                            b.isActive !== false ? 'border-white/10 hover:border-blue-500/50' : 'border-white/5 opacity-50'
                                        }`}
                                    >
                                        <div className="space-y-2">
                                            {/* Preview Thumbnail */}
                                            <div className="relative aspect-[4/1] rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
                                                {b.image ? (
                                                    <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] text-slate-600">ไม่มีรูปภาพ</span>
                                                )}
                                                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                    b.isActive !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                }`}>
                                                    {b.isActive !== false ? '● เปิดใช้งาน' : '○ ปิดการแสดง'}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold text-slate-100 truncate">{b.title || 'แบนเนอร์สปอนเซอร์'}</h4>
                                                <p className="text-[10px] text-blue-400 truncate">ตำแหน่ง: {b.position || 'top_leaderboard'}</p>
                                                <p className="text-[10px] text-slate-500 truncate font-mono">ปลายทาง: {b.url}</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => handleToggleBanner(b.id, b.isActive !== false)}
                                                className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                                                title={b.isActive !== false ? 'ปิดการแสดงผล' : 'เปิดการแสดงผล'}
                                            >
                                                {b.isActive !== false ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                                                <span>{b.isActive !== false ? 'ปิด' : 'เปิด'}</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingBanner(b);
                                                    setIsBannerModalOpen(true);
                                                }}
                                                className="flex-1 py-1.5 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border border-blue-500/30"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                แก้ไข
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBanner(b.id)}
                                                className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer border border-white/5"
                                                title="ลบแบนเนอร์นี้"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add / Edit Banner Modal */}
                        {isBannerModalOpen && editingBanner && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
                                <div className="w-full max-w-lg bg-[#0B0F17] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-blue-400" />
                                            {editingBanner.title ? 'แก้ไขป้ายแบนเนอร์' : 'เพิ่มแบนเนอร์สปอนเซอร์ใหม่'}
                                        </h3>
                                        <button
                                            onClick={() => setIsBannerModalOpen(false)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSaveBanner} className="space-y-3.5">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">ชื่อหรือข้อความสปอนเซอร์:</label>
                                            <input
                                                type="text"
                                                value={editingBanner.title || ''}
                                                onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                                                placeholder="เช่น UFASBO CLUB 8%"
                                                required
                                                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-blue-400"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">URL รูปภาพแบนเนอร์ (GIF / PNG / JPG):</label>
                                            <input
                                                type="url"
                                                value={editingBanner.image || ''}
                                                onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                                                placeholder="https://.../banner.gif"
                                                required
                                                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-blue-400 font-mono"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-300">URL ลิงก์ปลายทาง (เมื่อผู้ใช้คลิก):</label>
                                            <input
                                                type="url"
                                                value={editingBanner.url || ''}
                                                onChange={(e) => setEditingBanner({ ...editingBanner, url: e.target.value })}
                                                placeholder="https://sponsor.com/register"
                                                required
                                                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-blue-400 font-mono"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-300">ตำแหน่งแสดงผล:</label>
                                                <select
                                                    value={editingBanner.position || 'top_leaderboard'}
                                                    onChange={(e) => setEditingBanner({ ...editingBanner, position: e.target.value as any })}
                                                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 focus:outline-none"
                                                >
                                                    <option value="top_leaderboard">แถบหัวเว็บ (Top Leaderboard)</option>
                                                    <option value="side_banner">แถบด้านข้าง (Sidebar)</option>
                                                    <option value="under_player">ใต้เครื่องเล่น (Under Player)</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-300">ลำดับการแสดงผล (Order):</label>
                                                <input
                                                    type="number"
                                                    value={editingBanner.order || 1}
                                                    onChange={(e) => setEditingBanner({ ...editingBanner, order: Number(e.target.value) })}
                                                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Image Preview */}
                                        {editingBanner.image && (
                                            <div className="p-2 rounded-xl bg-black/50 border border-white/5 text-center">
                                                <span className="text-[10px] text-slate-500 block mb-1">ภาพตัวอย่าง:</span>
                                                <img
                                                    src={editingBanner.image}
                                                    alt="Preview"
                                                    className="max-h-20 mx-auto rounded-lg object-contain"
                                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsBannerModalOpen(false)}
                                                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-xs font-bold border border-white/10 cursor-pointer"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-blue-600/30 cursor-pointer"
                                            >
                                                บันทึกแบนเนอร์
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 4: 📢 ประกาศทางการจากแอดมิน (Admin Official Notice) */}
                {/* ========================================================= */}
                {activeTab === 'broadcast' && (
                    <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-[#0B0F17]/90 border border-white/10 space-y-6 shadow-2xl">
                        <div className="space-y-1 border-b border-white/10 pb-4">
                            <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-amber-400" />
                                ส่งประกาศทางการในฐานะแอดมิน (Official Broadcast)
                            </h2>
                            <p className="text-xs text-slate-400">
                                ข้อความจะแสดงป้ายยศ <strong>👑 [แอดมิน]</strong> สีทองเด่นชัดบนหน้าจอแชทของผู้ชมทุกคน
                            </p>
                        </div>

                        <form onSubmit={handleSendBroadcast} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">เลือกแมตช์เป้าหมาย:</label>
                                <select
                                    value={selectedMatchId}
                                    onChange={(e) => setSelectedMatchId(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none"
                                >
                                    {matches.map((m) => {
                                        const matchKey = getMatchRoomKey(m);
                                        return (
                                            <option key={m.id} value={matchKey}>
                                                {m.homeTeam?.name} vs {m.awayTeam?.name} ({m.status === 'LIVE' ? '🔴 LIVE' : m.kickoffTime})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">รูปแบบการส่ง:</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setBroadcastMode('chat')}
                                        className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                                            broadcastMode === 'chat'
                                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-md'
                                                : 'bg-white/[0.02] border-white/10 text-slate-400'
                                        }`}
                                    >
                                        💬 <strong>ข้อความแชทสด</strong>
                                        <p className="text-[10px] text-slate-500">ไหลไปกับแชทคนดู มีกรอบสีทอง</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setBroadcastMode('pin')}
                                        className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                                            broadcastMode === 'pin'
                                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-md'
                                                : 'bg-white/[0.02] border-white/10 text-slate-400'
                                        }`}
                                    >
                                        📌 <strong>ปักหมุดบนหัวแชท</strong>
                                        <p className="text-[10px] text-slate-500">ตรึงไว้ด้านบนสุด คนดูเห็นทุกคน</p>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-300">ข้อความประกาศ:</label>
                                <textarea
                                    value={broadcastText}
                                    onChange={(e) => setBroadcastText(e.target.value)}
                                    placeholder="เช่น ช่อง 1 กำลังสลับสัญญาณสำรอง รอสักครู่ครับ / สุภาพในช่องแชทด้วยครับ"
                                    rows={3}
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E5B842] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                            >
                                <Send className="w-3.5 h-3.5" />
                                ส่งประกาศเดี๋ยวนี้
                            </button>
                        </form>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 5: 🎬 จัดการลิงก์สำรอง (Dedicated Backup Streams)   */}
                {/* ========================================================= */}
                {activeTab === 'backups' && (
                    <div className="space-y-6">
                        {/* Header & Description */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0B0F17] to-teal-950/30 border border-emerald-500/20 backdrop-blur-xl">
                            <div className="space-y-1">
                                <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                                    <Radio className="w-5 h-5 text-emerald-400" />
                                    จัดการลิงก์ช่องสำรองเฉพาะกิจ (Backup Streams)
                                </h2>
                                <p className="text-xs text-slate-400 max-w-3xl">
                                    แอดมินสามารถเพิ่มหรือสลับลิงก์ <strong>ช่องสำรอง 2</strong> แยกเป็นรายคู่ได้ทันที (รองรับทั้ง <code className="text-emerald-300">.flv</code>, <code className="text-emerald-300">.m3u8</code>) โดยระบบมี Stream Proxy ปลดล็อกระบบกันดูดให้อัตโนมัติ และจะส่งสัญญาณใหม่ไปยังผู้ชมสดทันทีโดยไม่ต้องรีเฟรชหน้าเว็บ
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-300">
                                    เปิดใช้งานอยู่: {Object.keys(backupStreams).length} คู่
                                </span>
                            </div>
                        </div>

                        {/* Search & Status Filters */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={backupSearchQuery}
                                    onChange={(e) => setBackupSearchQuery(e.target.value)}
                                    placeholder="ค้นหาตามชื่อทีม (เหย้า/เยือน) หรือชื่อลีก..."
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                                />
                                {backupSearchQuery && (
                                    <button
                                        onClick={() => setBackupSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status Filter Buttons */}
                            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10 overflow-x-auto">
                                {(
                                    [
                                        { id: 'ALL', label: 'ทั้งหมด' },
                                        { id: 'LIVE', label: '🔴 กำลังเตะ' },
                                        { id: 'UPCOMING', label: '⏰ รอแข่ง' },
                                        { id: 'HAS_BACKUP', label: '🌟 มีช่องสำรอง' },
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setBackupStatusFilter(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                            backupStatusFilter === tab.id
                                                ? 'bg-emerald-600 text-white shadow-md'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Match List Grid */}
                        {(() => {
                            const filteredMatches = matches.filter((m) => {
                                const matchKey = getMatchRoomKey(m);
                                const hasBackup = Boolean(
                                    backupStreams[matchKey]?.url ||
                                    m.streamLinks?.some((s) => s.id?.includes('backup') || s.label?.includes('สำรอง') || s.url?.includes('channel19'))
                                );

                                if (backupStatusFilter === 'LIVE' && m.status !== 'LIVE') return false;
                                if (backupStatusFilter === 'UPCOMING' && m.status !== 'UPCOMING') return false;
                                if (backupStatusFilter === 'HAS_BACKUP' && !hasBackup) return false;

                                if (backupSearchQuery.trim()) {
                                    const q = backupSearchQuery.toLowerCase();
                                    const homeName = (m.homeTeam?.name || '').toLowerCase();
                                    const awayName = (m.awayTeam?.name || '').toLowerCase();
                                    const leagueName = (m.league?.name || '').toLowerCase();
                                    return homeName.includes(q) || awayName.includes(q) || leagueName.includes(q);
                                }
                                return true;
                            });

                            if (filteredMatches.length === 0) {
                                return (
                                    <div className="py-16 rounded-3xl bg-[#0B0F17]/60 border border-white/10 text-center flex flex-col items-center justify-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
                                            <Search className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-300">ไม่พบคู่การแข่งขันตามเงื่อนไขที่เลือก</p>
                                        <p className="text-xs text-slate-500">ลองล้างคำค้นหา หรือเลือกตัวกรองสถานะอื่น</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {filteredMatches.map((m) => {
                                        const matchKey = getMatchRoomKey(m);
                                        const activeBackup = backupStreams[matchKey] || (
                                            m.streamLinks?.find((s) => s.id?.includes('backup') || s.label?.includes('สำรอง') || s.url?.includes('channel19'))
                                                ? { url: m.streamLinks.find((s) => s.id?.includes('backup') || s.label?.includes('สำรอง') || s.url?.includes('channel19'))!.url, label: 'ช่องสำรอง 2' }
                                                : null
                                        );
                                        const matchName = `${m.homeTeam?.name || 'ทีมเหย้า'} vs ${m.awayTeam?.name || 'ทีมเยือน'}`;
                                        const mainStreamUrl = (m.streamLinks?.[0]?.url && m.streamLinks[0].url !== '#')
                                            ? m.streamLinks[0].url
                                            : ((m as any).link && (m as any).link !== '#' ? (m as any).link : ((m as any).embed_url !== '#' ? (m as any).embed_url || '' : ''));

                                        return (
                                            <div
                                                key={m.id || matchKey}
                                                className={`p-5 rounded-3xl bg-[#0B0F17]/90 border transition-all space-y-4 shadow-xl backdrop-blur-xl ${
                                                    activeBackup
                                                        ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/10 via-[#0B0F17]/90 to-[#0B0F17]'
                                                        : 'border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {/* Match Header */}
                                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <span className="text-[11px] font-bold text-[#E5B842] truncate">
                                                            {m.league?.name || 'ฟุตบอลสด'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">•</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {m.kickoffTime}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {m.status === 'LIVE' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[10px] font-extrabold border border-rose-500/30 animate-pulse">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                LIVE
                                                            </span>
                                                        ) : m.status === 'FINISHED' ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-white/5">
                                                                จบการแข่งขัน
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                                                                รอเตะ
                                                            </span>
                                                        )}

                                                        <a
                                                            href={`/watch/${m.slug || m.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="เปิดดูหน้าถ่ายทอดสดของคู่นี้"
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Teams Scoreboard Display */}
                                                <div className="flex items-center justify-between gap-4 py-1">
                                                    {/* Home */}
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                                            {m.homeTeam?.logo ? (
                                                                <img src={m.homeTeam.logo} alt="" className="w-full h-full object-contain" />
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-400">H</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-100 truncate">
                                                            {m.homeTeam?.name}
                                                        </span>
                                                    </div>

                                                    {/* Score or VS */}
                                                    <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/5 text-xs font-mono font-black text-amber-300">
                                                        {m.status === 'LIVE' || m.status === 'FINISHED'
                                                            ? `${m.homeTeam?.score ?? 0} - ${m.awayTeam?.score ?? 0}`
                                                            : 'VS'}
                                                    </div>

                                                    {/* Away */}
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end text-right">
                                                        <span className="text-xs font-bold text-slate-100 truncate">
                                                            {m.awayTeam?.name}
                                                        </span>
                                                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                                            {m.awayTeam?.logo ? (
                                                                <img src={m.awayTeam.logo} alt="" className="w-full h-full object-contain" />
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-400">A</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Streams Info & Actions */}
                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                    {/* Main Stream Reference */}
                                                    <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-white/[0.02] border border-white/5">
                                                        <div className="flex items-center gap-2 truncate text-slate-400">
                                                            <Tv className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                            <span className="font-semibold text-slate-300">ช่อง 1 (HD หลัก):</span>
                                                            <span className="font-mono text-slate-500 truncate max-w-[200px] sm:max-w-[280px]">
                                                                {mainStreamUrl || 'ไม่มี URL'}
                                                            </span>
                                                        </div>
                                                        {mainStreamUrl && (
                                                            <button
                                                                onClick={() => copyToClipboard(mainStreamUrl, `main-${matchKey}`)}
                                                                title="คัดลอกลิงก์หลัก"
                                                                className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                                                            >
                                                                {copiedUrlKey === `main-${matchKey}` ? (
                                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Backup Stream Row */}
                                                    {activeBackup ? (
                                                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-300">
                                                                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                                                    ช่องสำรอง 2 (เปิดใช้งานสด)
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingBackupMatch({
                                                                                matchKey,
                                                                                matchName,
                                                                                currentUrl: activeBackup.url,
                                                                            });
                                                                            setBackupUrlInput(activeBackup.url);
                                                                        }}
                                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[11px] font-bold border border-emerald-500/40 cursor-pointer transition-all active:scale-95"
                                                                    >
                                                                        แก้ไขลิงก์
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteBackupStream(matchKey)}
                                                                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer transition-all active:scale-95"
                                                                        title="ลบช่องสำรองนี้"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-200/80 bg-black/40 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                                                                <span className="truncate max-w-[280px] sm:max-w-[400px]">
                                                                    {activeBackup.url}
                                                                </span>
                                                                <button
                                                                    onClick={() => copyToClipboard(activeBackup.url, `backup-${matchKey}`)}
                                                                    title="คัดลอกลิงก์สำรอง"
                                                                    className="text-emerald-400 hover:text-emerald-200 ml-2 cursor-pointer"
                                                                >
                                                                    {copiedUrlKey === `backup-${matchKey}` ? (
                                                                        <Check className="w-3 h-3 text-emerald-300" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
                                                            <span className="text-xs text-slate-500">
                                                                ยังไม่มีการกำหนดช่องสำรอง
                                                            </span>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingBackupMatch({
                                                                        matchKey,
                                                                        matchName,
                                                                        currentUrl: '',
                                                                    });
                                                                    setBackupUrlInput('');
                                                                }}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                เพิ่มช่องสำรอง
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        {/* Modal: Add or Edit Backup Stream */}
                        {editingBackupMatch && (
                            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="w-full max-w-lg rounded-3xl bg-[#0B0F17] border border-emerald-500/30 p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
                                    <div className="flex items-start justify-between border-b border-white/10 pb-3">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                                                <Radio className="w-4 h-4 text-emerald-400" />
                                                ตั้งค่าช่องสำรอง 2
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                คู่แข่งขัน: <strong className="text-emerald-300">{editingBackupMatch.matchName}</strong>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setEditingBackupMatch(null)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSaveBackupStream(editingBackupMatch.matchKey, backupUrlInput);
                                        }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                                                <span>URL ลิงก์สตรีมช่องสำรอง:</span>
                                                <span className="text-[10px] text-emerald-400 font-normal">รองรับ .flv, .m3u8, mp4</span>
                                            </label>
                                            <input
                                                type="url"
                                                value={backupUrlInput}
                                                onChange={(e) => setBackupUrlInput(e.target.value)}
                                                placeholder="https://live2.domainkqt.cc/live/channel19.flv"
                                                required
                                                autoFocus
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 font-mono"
                                            />
                                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300/90 leading-relaxed space-y-1">
                                                <p><strong>💡 ปลดล็อกอัตโนมัติ:</strong> หากเป็นลิงก์จาก <code>domainkqt.cc</code> หรือไฟล์ <code>.flv</code> ระบบ Stream Proxy ของเว็บจะแปลงและแก้ระบบกันดูด (Referer Block) ให้ผู้ชมเปิดดูได้ลื่นไหลทันที</p>
                                                <div className="pt-1 flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400">ตัวอย่างสตรีมทดสอบ:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBackupUrlInput('https://live2.domainkqt.cc/live/channel19.flv')}
                                                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 cursor-pointer font-mono"
                                                    >
                                                        + ใส่ลิงก์ Channel 19
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                            <button
                                                type="button"
                                                onClick={() => setEditingBackupMatch(null)}
                                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSavingBackup}
                                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isSavingBackup ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        บันทึกและส่งสดให้คนดูทันที
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
