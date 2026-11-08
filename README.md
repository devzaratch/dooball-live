# Dooball Live ⚽ (ดูบอลสด)

เว็บถ่ายทอดสดฟุตบอลฟรี รองรับ ไทย/ลาว — ดูบอลสด, ตารางคะแนน, ไฮไลท์, ข่าว, แชทสด และหลังบ้านแอดมิน

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Firebase Realtime Database** (asia-southeast1) — client + admin SDK
- **hls.js** — เล่นสตรีม m3u8
- Port dev: **3008**

## เริ่มต้น (เครื่อง dev)

```bash
npm install
npm run dev          # http://localhost:3008
```

## ตั้งค่า Environment

ก๊อปปี้ `.env.local.example` เป็น `.env.local` แล้วใส่ค่าจริง:

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | ต่อ Firebase (มาจาก Firebase Console) |
| `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY` | รหัสเข้าหน้า `/admin` — **ไม่มี = เข้าหลังบ้านไม่ได้เลย** |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | กุญแจ Admin SDK (JSON หรือ Base64) — จำเป็นตอนขึ้นเซิร์ฟเวอร์จริง |
| `NEXT_PUBLIC_SITE_URL` | โดเมนจริง `https://dooball-live-p6mk.vercel.app` (SEO/canonical) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_CHAT_IDS` | ระบบสั่งงานผ่าน Telegram |

> ⚠️ `serviceAccountKey.json` ถูกลบออกจากโปรเจคแล้ว ใช้ env `FIREBASE_SERVICE_ACCOUNT_KEY` อย่างเดียว

## คำสั่ง

```bash
npm run dev             # dev server พอร์ต 3008
npm run build           # build เช็กก่อนขึ้นเซิร์ฟเวอร์
npm run lint            # eslint
npx tsc --noEmit        # เช็ก types
npm run telegram:poll   # เปิดตัวรับคำสั่ง Telegram (dev ไม่ต้องมี public URL)
npm run telegram:watch  # เฝ้ากล่องงาน Telegram (ปลุกเมื่อมีงานใหม่)
npm run telegram:notify # แจ้งเตือนอัตโนมัติ: บอลเริ่มเตะ, จบแล้ว, สตรีมเสีย
```

## คำสั่ง Telegram (บอท @Forcill_bot)

- `/help` `/status` `/summary` — ตอบทันที
- `/delta <งาน>` หรือข้อความธรรมดา — เก็บเข้ากล่องงานให้ Delta

## Deploy (Vercel)

1. ตั้งค่า Environment Variables ใน Vercel Project → Settings → Environment Variables
   (ดูตัวแปรทั้งหมดใน [`.env.local.example`](./.env.local.example))
2. ต้องมี `FIREBASE_SERVICE_ACCOUNT_KEY` (Base64 JSON) ใน Production Variables
3. Vercel จะ build + deploy อัตโนมัติเมื่อ push ไป main
4. ตั้ง Custom Domain ไป `dooball-live-p6mk.vercel.app` ใน Vercel Domain Settings

## โครงสร้างโปรเจค

```
src/
  app/           # หน้าเว็บ + API (admin, matches, table, highlights, news, og, proxy, stream, telegram)
  components/    # player, chat, layout, home, watch, table, ads, common
  hooks/         # realtime matches, standings, viewers, reactions, favorites
  lib/           # firebase, firebaseAdmin, rateLimit, safeFetch, telegram, streamHealth
  context/       # LanguageContext (TH/LA)
  types/         # football, news
scripts/         # telegram-poll.mjs, telegram-watch.mjs
```
