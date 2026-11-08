// ตัวช่วย fetch ภายนอกแบบกัน SSRF: บล็อก private IP / metadata / localhost + timeout + จำกัดขนาด
const BLOCKED_HOST_RE =
  /^(localhost|metadata\.google|metadata\.google\.internal|169\.254\.169\.254)$/i;

function isPrivateIpHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost') return true;
  if (h.startsWith('10.') || h.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h === '127.0.0.1' || h === '0.0.0.0' || h === '::1' || h === '::') return true;
  return false;
}

export function isUrlAllowed(rawUrl: string): boolean {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  if (BLOCKED_HOST_RE.test(u.hostname)) return false;
  if (isPrivateIpHost(u.hostname)) return false;
  return true;
}

export async function fetchWithGuard(
  url: string,
  init: RequestInit = {},
  opts: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<Response> {
  if (!isUrlAllowed(url)) {
    throw new Error('URL not allowed');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    if (opts.maxBytes !== undefined) {
      const len = res.headers.get('content-length');
      if (len && Number(len) > opts.maxBytes) {
        throw new Error('Response too large');
      }
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}
