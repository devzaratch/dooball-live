// Poll Telegram แบบไม่ต้องมี public URL (รันบนเครื่อง dev)
// วิธีใช้: ตั้งค่า .env.local แล้วรัน `npm run telegram:poll`
// สคริปต์จะตอบ /help /status /summary ทันที ส่วนข้อความอื่นจะเก็บลง telegram-inbox.json ให้ Delta อ่าน
import fs from 'node:fs';
import path from 'node:path';

// โหลด .env.local เอง เพราะรันด้วย node ธรรมดา (ไม่ใช่ next)
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const raw = fs.readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
} catch {}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.argv[2] || '';
const ALLOWED = (process.env.TELEGRAM_ALLOWED_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const INBOX_PATH = path.resolve(process.cwd(), 'telegram-inbox.json');

if (!BOT_TOKEN) {
  console.error('ต้องตั้ง TELEGRAM_BOT_TOKEN ก่อน (ใน .env.local หรือส่งเป็น arg)');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
let offset = 0;

function loadOffset() {
  try {
    const raw = fs.readFileSync(path.resolve(process.cwd(), '.telegram-offset'), 'utf-8');
    offset = parseInt(raw.trim(), 10) || 0;
  } catch { offset = 0; }
}
function saveOffset(v) {
  try { fs.writeFileSync(path.resolve(process.cwd(), '.telegram-offset'), String(v)); } catch {}
}
function saveInbox(chatId, text, from) {
  let arr = [];
  try { arr = JSON.parse(fs.readFileSync(INBOX_PATH, 'utf-8')); if (!Array.isArray(arr)) arr = []; } catch { arr = []; }
  arr.push({ chatId: String(chatId), text: String(text).slice(0, 2000), from, createdAt: new Date().toISOString(), handled: false });
  try { fs.writeFileSync(INBOX_PATH, JSON.stringify(arr.slice(-200), null, 2)); } catch {}
}

async function api(method, payload) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function helpText() {
  return ['Delta พร้อมรับคำสั่ง ✅', '', '/help - ช่วยเหลือ', '/status - สถานะเว็บ', '/summary - ภาพรวมโปรเจค', '/delta <ข้อความ> - ฝากงานให้ Delta', '', 'พิมพ์ข้อความธรรมดาก็ได้ Delta จะเก็บเข้ากล่องงานให้'].join('\n');
}

async function handleMessage(m) {
  const chatId = m?.chat?.id;
  const text = (m?.text || '').trim();
  if (!chatId || !text) return;
  if (ALLOWED.length > 0 && !ALLOWED.includes(String(chatId))) {
    await api('sendMessage', { chat_id: chatId, text: 'ไม่อนุญาตให้ใช้งานครับ' });
    return;
  }
  const from = m?.from?.first_name || m?.from?.username || 'unknown';
  console.log(`[tg] ${from} (${chatId}): ${text.slice(0, 120)}`);

  if (text === '/start' || text === '/help' || text.startsWith('/help@')) {
    await api('sendMessage', { chat_id: chatId, text: helpText() });
    return;
  }
  if (text.startsWith('/status')) {
    await api('sendMessage', { chat_id: chatId, text: `dooball-live status ✅\n${new Date().toISOString()}\nport 3008 | db asia-southeast1` });
    return;
  }
  if (text.startsWith('/summary')) {
    await api('sendMessage', { chat_id: chatId, text: 'dooball-live เว็บดูบอลสดฟรี เสร็จ ~85% เหลือล็อกแอดมิน + กันดูดลิงก์ + ซ่อม watch + og-image + README แผน 3-4 วันพร้อมเปิดจริง' });
    return;
  }
  const task = text.startsWith('/delta') ? text.replace('/delta', '').trim() : text;
  if (!task) {
    await api('sendMessage', { chat_id: chatId, text: 'พิมพ์แบบนี้ครับ: /delta <งานที่อยากให้ทำ>' });
    return;
  }
  saveInbox(chatId, task, from);
  await api('sendMessage', { chat_id: chatId, text: `Delta รับงานแล้ว ✅\n"${task.slice(0, 200)}"` });
}

async function loop() {
  loadOffset();
  console.log('Telegram poll เริ่มแล้ว กด Ctrl+C เพื่อหยุด');
  for (;;) {
    try {
      const res = await fetch(`${API}/getUpdates?timeout=25&offset=${offset}&allowed_updates=${encodeURIComponent('["message","channel_post"]')}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const u of data.result) {
          offset = u.update_id + 1;
          saveOffset(offset);
          const m = u.message || u.channel_post;
          if (m) await handleMessage(m);
        }
      }
    } catch (e) {
      console.error('poll error:', e?.message || e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

loop();
