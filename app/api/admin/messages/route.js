import { getMessages, deleteMessage, clearMessages, getPins } from '@/lib/store';
import { isAuthed } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// List semua pesan + pins (untuk moderasi). Juga dipakai sebagai cek login.
export async function GET(req) {
  if (!isAuthed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const messages = await getMessages(); // newest-first
  const pins = await getPins();
  return Response.json({ messages, pins });
}

// Hapus satu (?id=) atau semua (?all=1).
export async function DELETE(req) {
  if (!isAuthed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const u = new URL(req.url);

  if (u.searchParams.get('all') === '1') {
    await clearMessages();
    return Response.json({ ok: true, cleared: true });
  }

  const id = Number(u.searchParams.get('id'));
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  const ok = await deleteMessage(id);
  return Response.json({ ok });
}
