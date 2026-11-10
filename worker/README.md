# Stream Relay Worker (deploy ผ่าน dashboard 5 นาที ไม่ต้องใช้ CLI)

## ทำไมต้องมีตัวนี้

- host `.sbs` (ต้นทางสตรีม) **แบนช่วง IP ของ Vercel** — ยิงจาก Vercel ได้ 403 เสมอ
- และ host **ตรวจ Referer** — browser ตั้ง Referer เองไม่ได้ → เล่นตรงจาก browser ได้ 403 เสมอเหมือนกัน
- เส้นทางเดียวที่ได้ 200 = ยิงจาก IP ที่ไม่โดนแบน + ใส่ Referer `https://dooball99.top/`
- IP บ้านทดสอบผ่าน (HTTP 200) → Cloudflare Worker ทำหน้าที่ "IP ที่ upstream ยอม + ฉีด Referer ให้" เท่านั้น

## ขั้นตอน deploy

1. เข้า dash.cloudflare.com → **Workers & Pages** → **Create application** → **Create Worker**
2. ตั้งชื่อ เช่น `dooball-relay` → **Deploy** (code default ยังไม่ต้องสน)
3. กด **Edit code** → ลบทั้งหมด → paste เนื้อหา `worker/relay.js` → **Deploy**
4. กลับหน้า Worker → **Settings** → **Variables and Secrets** → เพิ่ม (Text):
   - `RELAY_KEY` = รหัสยาว ๆ เอาใหม่ เช่น `dbr_<random>` (ต้องตรงกับฝั่ง Vercel step 5)
5. Vercel → โปรเจกต์ `dooball-live` → **Settings** → **Environment Variables** → เพิ่ม 2 ตัว:
   - `STREAM_RELAY_BASE` = `https://dooball-relay.<ชื่อบัญชี>.workers.dev`
   - `STREAM_RELAY_KEY` = ค่าเดียวกับ `RELAY_KEY` ในข้อ 4
6. **Redeploy** (Deployments > project latest > Redeploy เพื่อให้ env มีผล)

## ทดสอบหลัง deploy

```bash
curl -s "https://dooball-relay.<ชื่อบัญชี>.workers.dev/stream?url=https%3A%2F%2F<host>.sbs%2Ftest&referer=https%3A%2F%2Fdooball99.top%2F" -H "X-Relay-Key: <RELAY_KEY>" -i
```

คาดหวัง: ตอบไม่ใช่ 403 จาก host (200 หรือ 404 จาก .sbs ก็แปลว่า relay ถึง upstream ได้)

ถ้า Worker ยังโดน `.sbs` reject (ยังตรวจไม่ได้หลัง deploy) — แจ้งให้ JAVIS ทดสอบต่อ มี plan B คือ relay ผ่านเครื่องตัวเอง/วาน VPS อื่น
