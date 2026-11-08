// แจ้งเตือน Telegram อัตโนมัติสำหรับ dooball-live
// - แจ้งเมื่อบอลเริ่มเตะ (UPCOMING -> LIVE)
// - แจ้งเมื่อจบการแข่งขัน (LIVE -> FINISHED) พร้อมสกอร์
// - เช็คสุขภาพลิงก์สตรีมของคู่ LIVE ทุก 5 นาที ถ้าเสียแจ้งเตือน (ไม่spam ซ้ำใน 30 นาที)
// วิธีใช้: npm run telegram:notify   (รันค้างไว้ — เครื่อง dev หรือ pm2 บนเซิร์ฟเวอร์)
import fs from 'node:fs';
import path from 'node:path';

// ---- โหลด .env.local เอง (รันด้วย node ธรรมดา) ----
try {
  const raw = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ALLOWED_CHAT_IDS?.split(',')[0] || '';
const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://football-888-b9a7e-default-rtdb.asia-southeast1.firebasedatabase.app';
const STATE_PATH = path.resolve(process.cwd(), '.telegram-notified.json');
const POLL_MS = 60_000;              // เช็ครายการแข่งขันทุก 1 นาที
const STREAM_CHECK_MS = 5 * 60_000;  // เช็คลิงก์สตรีมทุก 5 นาที
const STREAM_RETRY_MS = 30 * 60_000; // ห้ามแจ้งซ้ำสตรีมเสียบ่อยกว่า 30 นาที

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('ต้องตั้ง TELEGRAM_BOT_TOKEN และ TELEGRAM_CHAT_ID ใน .env.local');
  process.exit(1);
}

// ---- State (กันแจ้งซ้ำ) ----
let state = { statuses: {}, streamAlertAt: {}, lastStreamCheck: {} };
try {
  state = { ...state, ...JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')) };
} catch {}
function saveState() {
  try { fs.writeFileSync(STATE_PATH, JSON.stringify(state)); } catch {}
}

async function send(text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text.slice(0, 4000) }),
    });
    return res.ok;
  } catch (e) {
    console.error('send fail:', e?.message || e);
    return false;
  }
}

function normalizeStatus(raw) {
  const s = String(raw.status || '').trim();
  const low = s.toLowerCase();
  if (raw.is_live === true || s === 'LIVE' || low === 'live') return 'LIVE';
  const finished =
    s === 'FINISHED' || s === 'จบการแข่งขัน' || ['ft', 'finished', 'ended', 'full-time', 'aet', 'pen'].includes(low);
  if (finished) return 'FINISHED';
  return 'UPCOMING';
}

function matchName(m) {
  const home = m.home || m.homeTeam?.name || 'ทีมเหย้า';
  const away = m.away || m.awayTeam?.name || 'ทีมเยือน';
  const league = typeof m.league === 'string' ? m.league : m.league?.name || '';
  return { home, away, league };
}

function scoreText(m) {
  const h = m.home_score ?? m.homeTeam?.score ?? '-';
  const a = m.away_score ?? m.awayTeam?.score ?? '-';
  return `${h}-${a}`;
}

async function fetchMatches() {
  try {
    const res = await fetch(`${DB_URL}/matches.json`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];
    const arr = Array.isArray(data) ? data : Object.keys(data).map((k) => ({ id: k, ...data[k] }));
    return arr.filter(Boolean);
  } catch (e) {
    console.error('fetch matches fail:', e?.message || e);
    return [];
  }
}

async function checkStream(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0', 'User-Agent': 'Mozilla/5.0' },
      signal: controller.signal,
      cache: 'no-store',
    });
    return res.ok || res.status === 206;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function primaryStream(m) {
  const links = Array.isArray(m.streamLinks)
    ? m.streamLinks.filter((s) => s && s.url && s.url !== '#')
    : [];
  if (links.length > 0) return links[0].url;
  if (m.link && m.link !== '#') return m.link;
  if (m.embed_url && m.embed_url !== '#') return m.embed_url;
  return '';
}

async function tick() {
  const matches = await fetchMatches();
  const now = Date.now();
  let changed = false;

  for (const m of matches) {
    const id = String(m.id ?? '');
    if (!id) continue;
    const status = normalizeStatus(m);
    const prev = state.statuses[id];

    // 1) การเปลี่ยนสถานะ -> แจ้งเตือน
    if (prev && prev !== status) {
      const { home, away, league } = matchName(m);
      const leaguePart = league ? ` (${league})` : '';
      if (prev === 'UPCOMING' && status === 'LIVE') {
        await send(`🔴 เริ่มเตะแล้ว! ${home} vs ${away}${leaguePart}\nดูสด: ดูบอลสด HD ที่เว็บเลยครับ`);
      } else if (prev === 'LIVE' && status === 'FINISHED') {
        await send(`🏁 จบการแข่งขัน ${home} ${scoreText(m)} ${away}${leaguePart}`);
      }
    }
    if (state.statuses[id] !== status) {
      state.statuses[id] = status;
      changed = true;
    }

    // 2) เช็คสตรีมคู่ LIVE
    if (status === 'LIVE') {
      const lastCheck = state.lastStreamCheck[id] || 0;
      if (now - lastCheck >= STREAM_CHECK_MS) {
        state.lastStreamCheck[id] = now;
        changed = true;
        const url = primaryStream(m);
        if (url) {
          const ok = await checkStream(url);
          const alertedAt = state.streamAlertAt[id] || 0;
          if (!ok && now - alertedAt >= STREAM_RETRY_MS) {
            const { home, away } = matchName(m);
            await send(`⚠️ ลิงก์สตรีมเสีย: ${home} vs ${away}\nเข้าเว็บแล้วกดเปลี่ยนช่อง หรือแจ้งแอดมินเปลี่ยนลิงก์ด่วนครับ`);
            state.streamAlertAt[id] = now;
            changed = true;
          }
        }
      }
    }
  }

  if (changed) saveState();
  return matches.length;
}

async function main() {
  console.log(`match-notify started (poll ${POLL_MS / 1000}s, stream check ${STREAM_CHECK_MS / 60000} min)`);
  // เก็บสถานะรอบแรกโดยไม่แจ้ง (กัน spam ตอนเปิดเครื่อง)
  const first = await fetchMatches();
  for (const m of first) {
    const id = String(m.id ?? '');
    if (id && !state.statuses[id]) state.statuses[id] = normalizeStatus(m);
  }
  saveState();

  for (;;) {
    try {
      const n = await tick();
      if (n > 0) console.log(`[notify] checked ${n} matches @ ${new Date().toISOString()}`);
    } catch (e) {
      console.error('tick error:', e?.message || e);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main();
