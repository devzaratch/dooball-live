import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// กล่องงานให้ Delta อ่าน: GET /api/telegram/inbox
export async function GET() {
  try {
    const snap = await adminDb.ref('telegram_inbox').limitToLast(20).once('value');
    const val = snap.val() || {};
    const items = Object.entries(val).map(([id, v]) => ({ id, ...(v as Record<string, unknown>) }));
    items.sort((a, b) => Number((b as { createdAt?: number }).createdAt || 0) - Number((a as { createdAt?: number }).createdAt || 0));
    return NextResponse.json({ ok: true, count: items.length, items });
    } catch {
        return NextResponse.json({ ok: false, error: 'read failed' }, { status: 500 });
    }
}
