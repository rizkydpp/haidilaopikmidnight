'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [checking, setChecking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pins, setPins] = useState([]);
  const keyRef = useRef('');

  const load = useCallback(async (key) => {
    const r = await fetch('/api/admin/messages', {
      headers: { 'x-admin-key': key },
      cache: 'no-store',
    });
    if (r.status === 401) throw new Error('unauthorized');
    const data = await r.json();
    return { messages: data.messages || [], pins: data.pins || [] };
  }, []);

  function apply({ messages, pins }) {
    setMessages(messages);
    setPins(pins);
  }

  // try existing session
  useEffect(() => {
    const saved = sessionStorage.getItem('hdl_admin_key');
    if (!saved) return;
    load(saved)
      .then((d) => { keyRef.current = saved; apply(d); setAuthed(true); })
      .catch(() => sessionStorage.removeItem('hdl_admin_key'));
  }, [load]);

  // auto refresh while authed
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      load(keyRef.current).then(apply).catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, [authed, load]);

  async function unlock() {
    setLoginErr('');
    if (!pw) return setLoginErr('Enter the admin password');
    setChecking(true);
    try {
      const d = await load(pw);
      keyRef.current = pw;
      sessionStorage.setItem('hdl_admin_key', pw);
      apply(d);
      setAuthed(true);
      setPw('');
    } catch {
      setLoginErr('Wrong password');
    } finally {
      setChecking(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('hdl_admin_key');
    keyRef.current = '';
    setAuthed(false);
    setMessages([]);
    setPins([]);
  }

  function refresh() {
    load(keyRef.current).then(apply).catch(() => {});
  }

  async function del(id) {
    setMessages((m) => m.filter((x) => x.id !== id)); // optimistic
    setPins((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/admin/messages?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': keyRef.current },
    });
  }

  async function clearAll() {
    if (!confirm('Clear ALL messages from the wall? This cannot be undone.')) return;
    setMessages([]);
    setPins([]);
    await fetch('/api/admin/messages?all=1', {
      method: 'DELETE',
      headers: { 'x-admin-key': keyRef.current },
    });
  }

  async function pin(m) {
    const r = await fetch('/api/admin/pins', {
      method: 'POST',
      headers: { 'x-admin-key': keyRef.current, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { id: m.id, name: m.name, table: m.table, text: m.text } }),
    });
    const data = await r.json();
    if (!r.ok) { alert(data.error || 'Failed to pin'); if (data.pins) setPins(data.pins); return; }
    setPins(data.pins);
  }

  async function unpin(id) {
    const r = await fetch(`/api/admin/pins?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': keyRef.current },
    });
    const data = await r.json();
    if (r.ok) setPins(data.pins);
  }

  if (!authed) {
    return (
      <div className="admin admin-bg">
        <div className="admin-login">
          <div className="box">
            <div className="lock">🔒</div>
            <h2>Moderation</h2>
            <p>Staff only — enter the admin password to continue.</p>
            <input
              type="password"
              value={pw}
              autoFocus
              placeholder="Admin password"
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && unlock()}
            />
            <button className="btn btn-primary" onClick={unlock} disabled={checking}>
              {checking ? 'Checking…' : 'Unlock'}
            </button>
            <div className="login-err">{loginErr}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin admin-bg">
      <div className="admin-wrap">
        <div className="admin-bar">
          <div className="ttl">🛡️ Moderation</div>
          <span className="count">{messages.length} on wall</span>
          <span className="count pin-count">📌 {pins.length}/3 pinned</span>
          <button className="btn btn-ghost" onClick={refresh}>
            Refresh
          </button>
          <button className="btn btn-danger" onClick={clearAll} disabled={!messages.length}>
            Clear all
          </button>
          <button className="btn btn-ghost" onClick={logout}>Lock</button>
        </div>

        {messages.length === 0 ? (
          <div className="admin-empty">
            <div className="big">🐼</div>
            No messages on the wall right now.
          </div>
        ) : (
          messages.map((m) => {
            const isPinned = pins.some((p) => p.id === m.id);
            const pinFull = pins.length >= 3 && !isPinned;
            return (
              <div className={`msg-row${isPinned ? ' is-pinned' : ''}`} key={m.id}>
                <div className="body">
                  <div className="top">
                    <span className="nm">{m.name}</span>
                    {m.table ? <span className="tbl">Table {m.table}</span> : null}
                    {isPinned ? <span className="pinned-tag">📌 Pinned</span> : null}
                    <span className="tm">{new Date(m.ts).toLocaleString()}</span>
                  </div>
                  <div className="tx">{m.text}</div>
                </div>
                <div className="row-actions">
                  {isPinned ? (
                    <button className="act unpin" onClick={() => unpin(m.id)}>Unpin</button>
                  ) : (
                    <button className="act pin" onClick={() => pin(m)} disabled={pinFull}
                      title={pinFull ? 'Max 3 pinned' : 'Pin to keep it floating'}>📌 Pin</button>
                  )}
                  <button className="act del" onClick={() => del(m.id)}>Delete</button>
                </div>
              </div>
            );
          })
        )}

        <div className="admin-hint">
          Delete pulls a message off the screen. Pin keeps it floating in the air (max 3).
        </div>
      </div>
    </div>
  );
}
