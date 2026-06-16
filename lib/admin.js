import crypto from 'crypto';

// Set ADMIN_PASSWORD di environment (Vercel: Project Settings -> Environment Variables).
// Fallback hanya untuk dev lokal — JANGAN dipakai di produksi.
const DEFAULT_KEY = 'haidilao-admin';

export function adminKey() {
  return process.env.ADMIN_PASSWORD || DEFAULT_KEY;
}

export function isAuthed(req) {
  const provided = req.headers.get('x-admin-key') || '';
  const expected = adminKey();
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
