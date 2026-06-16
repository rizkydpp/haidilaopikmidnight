// Penyimpanan pesan + jejak penghapusan (tombstone).
// - Ada env KV_REST_API_URL & KV_REST_API_TOKEN (Upstash/Vercel KV) -> pakai Redis.
// - Kalau tidak -> memori proses (cukup untuk `npm run dev` lokal).

const KEY = 'haidilao:wall';
const DEL_KEY = 'haidilao:deleted';
const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
const useKV = Boolean(url && token);

globalThis.__wall ||= [];
globalThis.__deleted ||= [];

async function kv(command) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV error ${res.status}`);
  return (await res.json()).result;
}

function marker(id) {
  return { id, at: Date.now() * 1000 + Math.floor(Math.random() * 1000) };
}

export async function addMessage(msg) {
  if (useKV) {
    await kv(['LPUSH', KEY, JSON.stringify(msg)]);
    await kv(['LTRIM', KEY, '0', '299']);
  } else {
    globalThis.__wall.unshift(msg);
    globalThis.__wall = globalThis.__wall.slice(0, 300);
  }
}

export async function getMessages() {
  if (useKV) {
    const arr = (await kv(['LRANGE', KEY, '0', '299'])) || [];
    return arr.map((s) => JSON.parse(s));
  }
  return globalThis.__wall;
}

async function pushTomb(t) {
  if (useKV) {
    await kv(['LPUSH', DEL_KEY, JSON.stringify(t)]);
    await kv(['LTRIM', DEL_KEY, '0', '199']);
  } else {
    globalThis.__deleted.unshift(t);
    globalThis.__deleted = globalThis.__deleted.slice(0, 200);
  }
}

export async function getDeletions() {
  if (useKV) {
    const arr = (await kv(['LRANGE', DEL_KEY, '0', '199'])) || [];
    return arr.map((s) => JSON.parse(s));
  }
  return globalThis.__deleted;
}

export async function deleteMessage(id) {
  let removed = false;
  if (useKV) {
    const raw = (await kv(['LRANGE', KEY, '0', '-1'])) || [];
    const target = raw.find((s) => {
      try { return JSON.parse(s).id === id; } catch { return false; }
    });
    if (target) { await kv(['LREM', KEY, '1', target]); removed = true; }
  } else {
    const before = globalThis.__wall.length;
    globalThis.__wall = globalThis.__wall.filter((m) => m.id !== id);
    removed = globalThis.__wall.length < before;
  }
  if (removed) await pushTomb(marker(id)); // tell the wall to yank it live
  return removed;
}

export async function clearMessages() {
  if (useKV) await kv(['DEL', KEY]);
  else globalThis.__wall = [];
  await pushTomb(marker('*')); // '*' = clear everything on the wall
}

export const storageMode = useKV ? 'kv' : 'memory';
