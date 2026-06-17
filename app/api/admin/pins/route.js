import { pinMessage, unpinMessage, getPins } from '@/lib/store';
import { isAuthed } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({ pins: await getPins() });
}

// Pin sebuah pesan. Body: { message: { id, name, table, text } }
export async function POST(req) {
  if (!isAuthed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid body' }, { status: 400 }); }
  const m = body.message;
  if (!m || !m.id) return Response.json({ error: 'message required' }, { status: 400 });

  const r = await pinMessage(m);
  if (!r.ok) return Response.json({ error: 'Maksimal 3 pin', pins: r.pins }, { status: 400 });
  return Response.json({ ok: true, pins: r.pins });
}

// Unpin. ?id=<id>
export async function DELETE(req) {
  if (!isAuthed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  const pins = await unpinMessage(id);
  return Response.json({ ok: true, pins });
}
