// Dooball stream relay worker — ทางเข้าสตรีมที่ host .sbs ยอมรับ
// ทำหน้าที่: ยิง upstream .sbs จาก IP ของ Cloudflare (ไม่ใช่ IP Vercel ที่โดนแบน)
// และตั้ง Referer/Origin = dooball99.top ให้ครบ (upstream ตรวจ Referer → 403 ถ้าไม่มี/ผิด)
//
// ตั้งค่าผ่าน Variables (Workers & Pages > ตัว Worker > Settings > Variables):
//   RELAY_KEY = รหัสกันชนตัวเทียม (ค่าเดียวกับ STREAM_RELAY_KEY ใน Vercel)
//
// ป้องกัน open-proxy abuse:
//   - เฉพาะ path /stream
//   - ขอสิทธิ์ด้วย header X-Relay-Key ที่ต้องตรง RELAY_KEY
//   - เฉพาะ https + hostname ลงท้าย .sbs

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const DEFAULT_REFERER = 'https://dooball99.top/';

const PASS_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname !== '/stream') return new Response('Not found', { status: 404 });
		if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });

		const expectedKey = env.RELAY_KEY || '';
		if (expectedKey && (request.headers.get('X-Relay-Key') || '') !== expectedKey) {
			return new Response('Forbidden', { status: 403 });
		}

		const target = url.searchParams.get('url');
		const referer = url.searchParams.get('referer') || DEFAULT_REFERER;
		let parsed;
		try {
			parsed = new URL(target || '');
		} catch {
			return new Response('bad url', { status: 400 });
		}
		if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.sbs')) {
			return new Response('bad url', { status: 400 });
		}

		const headers = {
			'Referer': referer,
			'Origin': new URL(referer).origin,
			'User-Agent': UA,
			'Accept': '*/*',
		};
		const range = request.headers.get('Range');
		if (range) headers['Range'] = range;

		const upstream = await fetch(parsed.href, { headers, redirect: 'follow' });

		const out = new Headers();
		for (const h of PASS_HEADERS) {
			const v = upstream.headers.get(h);
			if (v) out.set(h, v);
		}
		out.set('Cache-Control', 'no-store');
		return new Response(upstream.body, { status: upstream.status, headers: out });
	},
};
