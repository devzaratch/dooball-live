// Dooball stream relay worker (v2 — browser-direct mode)
// วิธีใช้: browser ของเว็บเราเรียก Worker ตรง (IP บ้านผ่าน Cloudflare ✔ ไม่เจอกฎบล็อก datacenter)
// สิทธิ์อนุญาต 2 ทาง:
//   1) X-Relay-Key ตรงกับ RELAY_KEY (สำหรับ server เรียก เช่น Vercel ในอนาคต)
//   2) Origin/Referer เป็นเว็บของเราเอง (dooball-laos.vercel.app) — browser ส่งอัตโนมัติ
// ตัวต้นทางยังถูกจำกัด: เฉพาะ https + hostname ลงท้าย .sbs (ห้ามกลายเป็น open proxy)

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const DEFAULT_REFERER = 'https://dooball99.top/';

const SITE_ORIGINS = ['https://dooball-laos.vercel.app'];
const PASS_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

function siteOriginOf(request) {
	const origin = (request.headers.get('Origin') || '').trim();
	let ok = SITE_ORIGINS.includes(origin);
	if (!ok) {
		const ref = request.headers.get('Referer') || '';
		try {
			if (ref && SITE_ORIGINS.includes(new URL(ref).origin)) ok = true;
		} catch { /* ignore */ }
	}
	// ยอม localhost ระหว่างพัฒนาเท่านั้น
	if (!ok && origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) ok = true;
	return ok ? origin : '';
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		// CORS preflight
		if (request.method === 'OPTIONS') {
			const siteOrigin = siteOriginOf(request);
			if (!siteOrigin) return new Response(null, { status: 403 });
			return new Response(null, {
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': siteOrigin,
					'Access-Control-Allow-Methods': 'GET, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Key',
					'Vary': 'Origin',
				},
			});
		}
		if (url.pathname !== '/stream') return new Response('Not found', { status: 404 });
		if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });

		const siteOrigin = siteOriginOf(request);
		const expectedKey = env.RELAY_KEY || '';
		const givenKey = request.headers.get('X-Relay-Key') || '';
		const keyOk = Boolean(expectedKey) && givenKey === expectedKey;
		if (!keyOk && !siteOrigin) {
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
		if (siteOrigin) {
			out.set('Access-Control-Allow-Origin', siteOrigin);
			out.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
			out.set('Vary', 'Origin');
		}
		out.set('Cache-Control', 'no-store');
		return new Response(upstream.body, { status: upstream.status, headers: out });
	},
};
