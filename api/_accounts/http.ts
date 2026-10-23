/** Small HTTP helpers shared by the account endpoints: JSON replies, same-origin, body caps, cookies. */

export function json(status: number, body: unknown, headers: [string, string][] = []): Response {
  const h = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
  for (const [k, v] of headers) h.append(k, v);
  return new Response(JSON.stringify(body), { status, headers: h });
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host) return req.headers.get('sec-fetch-site') === 'same-origin';
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Reads a JSON body no larger than `max` bytes; null when it is too big or not JSON. */
export async function readJson(req: Request, max: number): Promise<Record<string, unknown> | null> {
  if (Number(req.headers.get('content-length') ?? '0') > max) return null;
  const raw = await req.text();
  if (raw.length > max) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
}

// Session cookies: HttpOnly (scripts never see them), Secure, SameSite=Lax, and scoped to /api.
export const ACCESS = 'el_at';
export const REFRESH = 'el_rt';
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function sessionCookies(s: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}): [string, string][] {
  return [
    ['set-cookie', cookie(ACCESS, s.accessToken, Math.max(60, s.expiresIn))],
    ['set-cookie', cookie(REFRESH, s.refreshToken, REFRESH_MAX_AGE)],
  ];
}

export function clearCookies(): [string, string][] {
  return [
    ['set-cookie', cookie(ACCESS, '', 0)],
    ['set-cookie', cookie(REFRESH, '', 0)],
  ];
}

export function readCookie(req: Request, name: string): string | null {
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}
