const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BASE_URL = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : '';

function getAllowedChatIds(): string[] {
  const raw = process.env.TELEGRAM_ALLOWED_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function isTelegramConfigured(): boolean {
  return Boolean(BOT_TOKEN);
}

export function isAllowedChat(chatId: string | number): boolean {
  const allowed = getAllowedChatIds();
  if (allowed.length === 0) return true;
  return allowed.includes(String(chatId));
}

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN missing');
    return false;
  }
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000) }),
    });
    return res.ok;
  } catch (e) {
    console.error('sendTelegramMessage failed:', e);
    return false;
  }
}

export function buildHelpText(): string {
  return [
    'Delta พร้อมรับคำสั่ง ✅',
    '',
    '/help - ช่วยเหลือ',
    '/status - สถานะเว็บ',
    '/summary - ภาพรวมโปรเจค',
    '/delta <ข้อความ> - ฝากงานให้ Delta',
    '',
    'พิมพ์ข้อความธรรมดาก็ได้ Delta จะเก็บเข้ากล่องงานให้',
  ].join('\n');
}

export function buildStatusText(): string {
  return [
    'dooball-live status ✅',
    `time: ${new Date().toISOString()}`,
    'port: 3008',
    'db: football-888-b9a7e (asia-southeast1)',
    'bot: @Forcill_bot',
  ].join('\n');
}

export function buildSummaryText(): string {
  return [
    'สรุปภาพรวม dooball-live by Delta',
    '',
    'เว็บดูบอลสดฟรี (ไทย/ลาว) ดูบอล + ตาราง + ไฮไลท์ + ข่าว + แชทสด มีหลังบ้านแอดมินแปะลิงก์',
    'Tech: Next.js 16 + React 19 + Tailwind 4 + Firebase RTDB + hls.js',
    '',
    'เสร็จ ~85% เหลือ: ล็อกแอดมิน, เอาไฟล์กุญแจออก, กันดูดลิงก์, ซ่อมหน้า watch, ใส่รูป og-image, เขียน README',
    'แผน 3-4 วันพร้อมเปิดจริง',
  ].join('\n');
}
