import { addMessage, getMessages, getDeletions } from '@/lib/store';

export const dynamic = 'force-dynamic';

// Display polls: GET /api/messages?since=<lastId>&delsince=<lastDelAt>
export async function GET(req) {
  const u = new URL(req.url);
  const since = Number(u.searchParams.get('since') || 0);
  const delsince = Number(u.searchParams.get('delsince') || 0);

  const all = await getMessages(); // newest-first
  const fresh = all
    .filter((m) => m.id > since)
    .sort((a, b) => a.id - b.id); // oldest-first so bubbles appear in order

  const tombs = await getDeletions();
  const deleted = tombs.filter((t) => t.at > delsince);

  return Response.json({ messages: fresh, deleted, now: Date.now() });
}

// Phone sends: POST /api/messages  { name, table, message }
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = String(body.name || '').trim().slice(0, 40);
  const table = String(body.table || '').trim().slice(0, 12);
  const text = String(body.message || '').trim().slice(0, 280);

  if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });
  if (!text) return Response.json({ error: 'Message is required' }, { status: 400 });

  const msg = {
    id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
    name,
    table,
    text,
    ts: Date.now(),
  };

  await addMessage(msg);
  return Response.json({ ok: true, msg });
}
