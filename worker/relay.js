// Dooball stream relay worker (v2 — browser-direct mode)
// วิธีใช้: browser ของเว็บเราเรียก Worker ตรง (IP บ้านผ่าน Cloudflare ✔ ไม่เจอกฎบล็อก datacenter)
// สิทธิ์อนุญาต 2 ทาง:
//   1) X-Relay-Key ตรงกับ RELAY_KEY (สำหรับ server เรียก เช่น Vercel ในอนาคต)
//   2) Origin/Referer เป็นเว็บของเราเอง (dooball-laos.vercel.app) — browser ส่งอัตโนมัติ
// ตัวต้นทางยังถูกจำกัด: เฉพาะ https + hostname ลงท้าย .sbs (ห้ามกลายเป็น open proxy)

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const DEFAULT_REFERER = 'https://dooball99-s.com/';

const SITE_ORIGINS = ['https://dooball-laos.vercel.app'];
const PASS_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges'];

// 🎯 โดเมนหน้า fixture ที่อนุญาตให้ Worker ไปดึงแทน (upstream บล็อก IP datacenter เช่น Vercel → 403)
const FIXTURE_HOSTS = [
	'dooball99-s.com',
	'dooball99.top',
	'dooball99.to',
	'dooball66-hd.com',
	'dooballonline.live',
	'dooballlaos.com',
];

// ถอด POOL: {"img": "...", "u": "<base64 ของ URL ที่ reverse กลับด้าน>"}
function decodePoolEntry(u) {
	try {
		const b64 = String(u).replace(/-/g, '+').replace(/_/g, '/');
		const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
		const raw = atob(padded);
		// atob ให้ binary string (URL เป็น ASCII) → reverse กลับด้าน
		return raw.split('').reverse().join('');
	} catch {
		return '';
	}
}

function extractStreams(html) {
	const out = [];
	const m = html.match(/var\s+POOL\s*=\s*(\[[\s\S]*?\])\s*;/);
	if (m) {
		try {
			const pool = JSON.parse(m[1]);
			for (const c of pool) {
				const u = c && c.u ? decodePoolEntry(c.u) : '';
				if (u.startsWith('http')) out.push(u);
			}
		} catch { /* โครงสร้างเพี้ยน → ลองแบบ regex ด้านล่าง */ }
	}
	// เผื่อกรณีหน้า HTML ฝัง .m3u8 ตรง ๆ
	const direct = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || [];
	return [...new Set([...out, ...direct])];
}

async function handleFixture(request, env, url) {
	const siteOrigin = siteOriginOf(request);
	const expectedKey = env.RELAY_KEY || '';
	const givenKey = request.headers.get('X-Relay-Key') || '';
	const keyOk = Boolean(expectedKey) && givenKey === expectedKey;
	if (!keyOk && !siteOrigin) return jsonResponse({ ok: false, error: 'forbidden' }, 403, siteOrigin);

	const id = (url.searchParams.get('id') || '').replace(/[^0-9]/g, '');
	const hostParam = (url.searchParams.get('host') || '').trim().toLowerCase();
	if (!id) return jsonResponse({ ok: false, error: 'missing id' }, 400, siteOrigin);

	const hosts = hostParam && FIXTURE_HOSTS.includes(hostParam)
		? [hostParam, ...FIXTURE_HOSTS.filter((h) => h !== hostParam)]
		: FIXTURE_HOSTS;

	const trace = [];
	for (const host of hosts) {
		const target = `https://${host}/fixtures/${id}`;
		try {
			const res = await fetch(target, {
				headers: {
					'User-Agent': UA,
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': 'th,en;q=0.9',
					'Referer': `https://${host}/`,
				},
				redirect: 'follow',
				cf: { cacheTtl: 0 },
			});
			if (!res.ok) {
				trace.push(`${host}:${res.status}`);
				continue;
			}
			const html = await res.text();
			const streams = extractStreams(html);
			if (streams.length > 0) {
				return jsonResponse({ ok: true, host, id, pool: streams, trace }, 200, siteOrigin);
			}
			trace.push(`${host}:no_stream`);
		} catch (e) {
			trace.push(`${host}:err`);
		}
	}
	return jsonResponse({ ok: false, error: 'no_stream', trace }, 404, siteOrigin);
}

function jsonResponse(body, status, siteOrigin) {
	const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
	if (siteOrigin) {
		headers['Access-Control-Allow-Origin'] = siteOrigin;
		headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
		headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Relay-Key';
		headers['Vary'] = 'Origin';
	}
	return new Response(JSON.stringify(body), { status, headers });
}

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
		if (url.pathname === '/fixture') {
			if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
			return handleFixture(request, env, url);
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

		// 📝 m3u8: revise ทุกบรรทัดให้ยิงกลับเข้า /stream ของ Worker เอง
		const ct = (upstream.headers.get('content-type') || '').toLowerCase();
		const isHls = ct.includes('mpegurl') || parsed.pathname.endsWith('.m3u8');
		if (isHls) {
			const selfOrigin = url.origin;
			const text = await upstream.text();
			const baseUrl = parsed;
			const lines = text.split('\n').map((line) => {
				const t = line.trim();
				if (!t) return line;
				if (t.startsWith('#')) {
					// #EXT-X-KEY URI="..." ต้อง wrap ด้วย
					if (t.includes('URI="')) {
						return t.replace(/URI="([^"]+)"/g, (m0, uri) => {
							try {
								const abs = new URL(uri, baseUrl).href;
								return `URI="${selfOrigin}/stream?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}"`;
							} catch {
								return m0;
							}
						});
					}
					return line;
				}
				try {
					const abs = new URL(t, baseUrl).href;
					return `${selfOrigin}/stream?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer)}`;
				} catch {
					return line;
				}
			});
			out.set('Content-Type', 'application/vnd.apple.mpegurl');
			return new Response(lines.join('\n'), { status: 200, headers: out });
		}

		return new Response(upstream.body, { status: upstream.status, headers: out });
	},
};
