// ระบบกันดูด/กันบอทของ API (Phase 1 - Anti-Bot & Anti-Leech)
// - checkRateLimit: จำกัดจำนวนคำขอต่อ IP (fixed window, in-memory)
// - markViolation / isBanned: สะสมคะแนนผิดกฎ → แบน IP ชั่วคราว (15 นาที)
// - isBotUserAgent: กรอง User-Agent ที่เป็นบอท/สแครปเปอร์
// - isAllowedSiteOrigin: ตรวจว่า Referer/Origin ขาเข้ามาจากเว็บเราเท่านั้น
// - getSafeClientIp: ตัด IP จาก proxy headers อย่างปลอดภัย

interface RateLimitStore {
    [ip: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// ตารางแบนชั่วคราว (in-memory — รีสตาร์ทแล้วหาย พอสำหรับบล็อกบอทวิ่งวนระยะสั้น)
interface ViolationRecord {
    count: number;   // จำนวนครั้งที่ผิดกฎในหน้าต่างเวลาปัจจุบัน
    lastAt: number;  // เวลา (ms epoch) ที่ผิดกฎครั้งล่าสุด
}
const violationStore: Record<string, ViolationRecord> = {};
const banStore: Record<string, number> = {}; // เวลา (ms epoch) ที่ปลดแบน

const BAN_THRESHOLD = 5;                    // ผิดกฎ 5 ครั้งในหน้าต่างเวลา → แบน
const BAN_DURATION_MS = 15 * 60 * 1000;     // แบน 15 นาที
const VIOLATION_WINDOW_MS = 10 * 60 * 1000; // คะแนนผิดกฎเก่าหมดอายุใน 10 นาที
const MAX_TRACKED_IPS = 5000;               // เพดานกัน memory บวมจาก IP แบบกระจาย

// เว็บเราเอง (allowlist ตรง) — โดเมนย่อยอื่นครอบด้วย isAllowedSiteOrigin
const ALLOWED_HOST_NAMES: string[] = [
    'dooballlaos.com',
    'www.dooballlaos.com',
];

/**
 * ชุด host ที่ถือว่าเป็น "เว็บเรา" — รวม host จาก NEXT_PUBLIC_SITE_URL
 * (ใช้ตอนรันบนโดเมนชั่วคราว เช่น ตอน server หลักถูกแบน)
 */
function getAllowedHosts(): string[] {
    const hosts = [...ALLOWED_HOST_NAMES];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
        try {
            const envHost = new URL(siteUrl).hostname.toLowerCase();
            if (envHost && !hosts.includes(envHost)) hosts.push(envHost);
        } catch { /* ค่า env ไม่ใช่ URL ที่ถูกต้อง — ข้าม */ }
    }
    return hosts;
}

export function getSafeClientIp(request: { headers: { get(name: string): string | null } }): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim();
        if (first && !isLoopbackIp(first)) return first;
        // loopback แรก = request มาจาก reverse proxy บนเครื่องเดียวกันโดยไม่ระบุ IP จริงของ client
        // → ลองใช้ fallback header อื่นก่อน (ห้ามนำ 127.0.0.1 ไปนับแบนเด็ดขาด)
    }
    // fallback มาตรฐาน CDN/proxy อื่นๆ
    const realIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip');
    if (realIp && !isLoopbackIp(realIp.trim())) return realIp.trim();
    // ⚠️ ระบุตัวตน client ไม่ได้ (เช่น nginx ไม่ส่ง XFF แล้ว Next เติม 127.0.0.1 จาก socket ให้เอง —
    // ทุก client จะกลายเป็น IP เดียวกัน → บอท 5 ครั้งแบน "ทุกคน" พร้อมกัน)
    // ค่า sentinel นี้ระบบรู้ว่า "ห้ามเอาไปนับ violation / ห้ามแบน" (ดู markViolation/isBanned)
    return 'unidentified';
}

/** loopback เป็น IP "รวม" ของ reverse proxy บนเครื่องเดียวกัน — ไม่ใช่ตัวตน client จริง */
function isLoopbackIp(ip: string): boolean {
    const v = ip.toLowerCase();
    return v === '127.0.0.1' || v === '::1' || v === '::ffff:127.0.0.1' || v.startsWith('::ffff:127.');
}

/** IP ที่ระบุตัวตนได้จริงเท่านั้น ถึงจะมีสิทธิ์ถูกนับ violation/แบน */
export function isIdentifiableIp(ip: string): boolean {
    return ip !== 'unidentified' && ip.trim().length > 0;
}

export function isBotUserAgent(userAgent: string | null): boolean {
    if (!userAgent || userAgent.trim().length === 0) return true; // ไม่มี UA → บอท
    const ua = userAgent.toLowerCase();
    const botPatterns = [
        'bot', 'crawler', 'spider', 'crawl',
        'python-requests', 'python-urllib', 'curl/', 'wget/', 'libwww',
        'scrapy', 'node-fetch', 'axios/', 'okhttp',
        'headlesschrome', 'phantomjs', 'puppeteer', 'lighthouse',
        'facebookexternalhit', 'semrush', 'ahrefs', 'mj12bot',
        'dotbot', 'petalbot', 'bytespider',
    ];
    return botPatterns.some((p) => ua.includes(p));
}

/**
 * เช็คว่า Referer/Origin ขาเข้าเป็นของเว็บเราเองหรือไม่
 * ใช้กันเว็บอื่นฝัง player / ดึงสตรีมโดยตรง
 * - dev (NODE_ENV !== 'production'): ยกเว้นกรณีไม่ส่ง Referer/Origin เลย เพื่อไม่ตันเวิร์กโฟลว์ทดสอบ
 * - prod: ถ้าไม่มี Referer และ Origin เลยถือว่าเป็นบอท/เครื่องมือ → ไม่อนุญาต
 */
export function isAllowedSiteOrigin(
    referer: string | null,
    origin: string | null,
    requestHost: string | null
): boolean {
    if (process.env.NODE_ENV !== 'production' && !referer && !origin) return true;

    const hostFromUrl = (url: string): string | null => {
        try {
            return new URL(url).hostname.toLowerCase();
        } catch {
            return null;
        }
    };

    const refHost = referer ? hostFromUrl(referer) : null;
    const orgHost = origin ? hostFromUrl(origin) : null;

    // selfHost อาจเป็นรายการหลายค่า (host ที่รีเวิร์สโปรกซีรับเข้ามา เช่น localhost ส่วน
    // X-Forwarded-Host เป็นโดเมนจริงปลายทางตาม platform เช่น Vercel) — ต้องผ่านอะไนตัวใดตัวหนึ่งก็ได้
    const selfHosts = String(requestHost || '')
        .split(',')
        .map((h) => h.trim().toLowerCase().split(':')[0])
        .filter(Boolean);

    const allowed = (h: string | null) =>
        !!h && (
            getAllowedHosts().includes(h) ||
            selfHosts.includes(h) ||           // hostname ของตัวเซิร์ฟเวอร์เราเอง
            h.endsWith('.dooballlaos.com')
        );

    if (!refHost && !orgHost) return false;    // ไม่มีทั้ง Referer และ Origin → บอท
    if (refHost && !allowed(refHost)) return false; // Referer จากเว็บอื่น → ดูด
    if (orgHost && !allowed(orgHost)) return false; // Origin จากเว็บอื่น (iframe/embed) → ดูด
    return true;
}

/**
 * บันทึกพฤติกรรมผิดกฎ → เสียคะแนน → ครบเกณฑ์แล้วแบนชั่วคราว
 * @param countsTowardBan false = แค่ปัดรายตัว ไม่เข้าบัญชีแบน (ใช้กับ referer ไม่ผ่าน
 *   เพื่อกันผู้ใช้จริงหลายคนหลัง NAT/CGNAT เดียว หรือ privacy browser ที่ตัด Referer
 *   ถูกรวบแบนไปด้วยกันทั้งก้อน)
 */
export function markViolation(ip: string, countsTowardBan = true): void {
    // 🛡️ IP ที่ระบุตัวตนไม่ได้ ห้ามนับเด็ดขาด — คะแนนจะไปตกกองรวมของ "ทุกคน"
    if (!isIdentifiableIp(ip)) return;

    // violation ชนิดไม่นับแบน → ไม่จำเป็นต้องเก็บ state เลย (คำขอถูกปัด 403 รายตัวอยู่แล้ว)
    if (!countsTowardBan) return;

    const now = Date.now();
    const rec = violationStore[ip];

    // คะแนนเก่าเกินหน้าต่างเวลา → เริ่มนับใหม่
    if (rec && now - rec.lastAt > VIOLATION_WINDOW_MS) {
        violationStore[ip] = { count: 1, lastAt: now };
    } else {
        violationStore[ip] = { count: (rec?.count || 0) + 1, lastAt: now };
    }

    if (violationStore[ip].count >= BAN_THRESHOLD) {
        banStore[ip] = now + BAN_DURATION_MS;
        delete violationStore[ip]; // เริ่มนับใหม่หลังหมดแบน
    }

    // กัน memory บวม: ล้างรายการหมดอายุเมื่อจำนวนเกินเพดาน
    if (Object.keys(violationStore).length > MAX_TRACKED_IPS) {
        for (const k in violationStore) {
            if (now - violationStore[k].lastAt > VIOLATION_WINDOW_MS) delete violationStore[k];
        }
    }
    if (Object.keys(banStore).length > MAX_TRACKED_IPS) {
        for (const k in banStore) {
            if (banStore[k] < now) delete banStore[k];
        }
    }
}

export function isBanned(ip: string): boolean {
    // 🛡️ IP ระบุตัวตนไม่ได้ = ไม่มีวันถูกแบน (กัน lock ทั้งเว็บเมื่อ nginx ไม่ส่ง XFF)
    if (!isIdentifiableIp(ip)) return false;
    const until = banStore[ip];
    if (!until) return false;
    if (Date.now() > until) {
        delete banStore[ip];
        return false;
    }
    return true;
}

/**
 * In-Memory Rate Limiter for API endpoints
 * @param ip Client IP address
 * @param limit Max requests allowed within window
 * @param windowMs Time window in milliseconds (default 60 seconds)
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(ip: string, limit = 60, windowMs = 60000) {
    const now = Date.now();
    const clientData = store[ip] || { count: 0, resetTime: now + windowMs };

    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + windowMs;
    } else {
        clientData.count += 1;
    }

    store[ip] = clientData;

    const allowed = clientData.count <= limit;
    const remaining = Math.max(0, limit - clientData.count);

    // Periodically clean expired IPs from memory store
    if (Object.keys(store).length > 1000) {
        for (const k in store) {
            if (now > store[k].resetTime) {
                delete store[k];
            }
        }
    }

    return {
        allowed,
        remaining,
        resetTime: clientData.resetTime,
    };
}
