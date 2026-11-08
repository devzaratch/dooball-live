import { NextRequest, NextResponse } from 'next/server';
import {
  buildHelpText,
  buildStatusText,
  buildSummaryText,
  isAllowedChat,
  sendTelegramMessage,
} from '@/lib/telegram';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'telegram-webhook', hint: 'POST from Telegram here' });
}

type TgMessage = {
  message_id?: number;
  from?: { id?: number; first_name?: string; username?: string };
  chat?: { id?: number | string; type?: string };
  text?: string;
  date?: number;
};

async function saveInbox(chatId: string, text: string, from: string) {
  try {
    await adminDb.ref('telegram_inbox').push({
      chatId,
      text: text.slice(0, 2000),
      from,
      createdAt: Date.now(),
      handled: false,
    });
  } catch (e) {
    console.error('saveInbox failed:', e);
  }
}

function parseCommand(text: string): { cmd: string; arg: string } {
  const t = (text || '').trim();
  if (!t.startsWith('/')) return { cmd: 'task', arg: t };
  const space = t.indexOf(' ');
  if (space === -1) return { cmd: t.split('@')[0], arg: '' };
  return { cmd: t.slice(0, space).split('@')[0], arg: t.slice(space + 1).trim() };
}

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || '';
  if (secret) {
    const got = req.headers.get('x-telegram-bot-api-secret-token') || '';
    if (got !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: { message?: TgMessage; channel_post?: TgMessage } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = body?.message || body?.channel_post;
  const chatId = msg?.chat?.id;
  const text = (msg?.text || '').trim();
  if (!chatId || !text) return NextResponse.json({ ok: true });

  if (!isAllowedChat(chatId)) {
    await sendTelegramMessage(chatId, 'ไม่อนุญาตให้ใช้งานครับ ติดต่อเจ้าของโปรเจคก่อน');
    return NextResponse.json({ ok: true });
  }

  const from = msg?.from?.first_name || msg?.from?.username || 'unknown';
  const { cmd, arg } = parseCommand(text);
  const chatIdStr = String(chatId);

  if (cmd === '/start' || cmd === '/help') {
    await sendTelegramMessage(chatId, buildHelpText());
    return NextResponse.json({ ok: true });
  }
  if (cmd === '/status') {
    await sendTelegramMessage(chatId, buildStatusText());
    return NextResponse.json({ ok: true });
  }
  if (cmd === '/summary') {
    await sendTelegramMessage(chatId, buildSummaryText());
    return NextResponse.json({ ok: true });
  }
  if (cmd === '/delta') {
    if (!arg) {
      await sendTelegramMessage(chatId, 'พิมพ์แบบนี้ครับ: /delta <งานที่อยากให้ทำ>');
      return NextResponse.json({ ok: true });
    }
    await saveInbox(chatIdStr, arg, from);
    await sendTelegramMessage(chatId, `Delta รับงานแล้ว ✅\n"${arg.slice(0, 200)}"\nเดี๋ยวผมเปิดดูในกล่องงานให้`);
    return NextResponse.json({ ok: true });
  }

  await saveInbox(chatIdStr, text, from);
  await sendTelegramMessage(chatId, `รับแล้วครับ ✅ เก็บเข้ากล่องงาน Delta ให้แล้ว\nพิมพ์ /help ดูคำสั่งได้`);
  return NextResponse.json({ ok: true });
}
