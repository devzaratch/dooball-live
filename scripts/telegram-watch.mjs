// Watcher: เฝ้ากล่องงาน Telegram แล้วปลุก Delta ทันทีที่มีงานใหม่
// หลักการ: รัน background ไว้ พอมีงานใหม่จะ print แล้ว exit -> Delta ได้รับแจ้งอัตโนมัติ
// วิธีใช้: node scripts/telegram-watch.mjs
import fs from 'node:fs';
import path from 'node:path';

const INBOX_PATH = path.resolve(process.cwd(), 'telegram-inbox.json');
const STATE_PATH = path.resolve(process.cwd(), '.telegram-watch-state');
const POLL_MS = 10_000;

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    return { seen: 0 };
  }
}
function saveState(s) {
  try { fs.writeFileSync(STATE_PATH, JSON.stringify(s)); } catch {}
}

function readInbox() {
  try {
    const arr = JSON.parse(fs.readFileSync(INBOX_PATH, 'utf-8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function main() {
  const state = loadState();
  // ครั้งแรก: จำงานเก่าทั้งหมดว่าอ่านแล้ว เฝ้าเฉพาะงานใหม่
  if (!state.seen) {
    const items = readInbox();
    state.seen = Date.now();
    saveState(state);
    console.log(`watcher started, skip old ${items.length} tasks`);
  } else {
    console.log('watcher started');
  }

  for (;;) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const items = readInbox();
    const fresh = items.filter((it) => {
      const t = new Date(it.createdAt || 0).getTime() || 0;
      return !it.handled && t > (state.seen || 0);
    });
    if (fresh.length > 0) {
      state.seen = Date.now();
      saveState(state);
      console.log('NEW_TELEGRAM_TASKS:' + JSON.stringify(fresh));
      process.exit(0);
    }
  }
}

main();
