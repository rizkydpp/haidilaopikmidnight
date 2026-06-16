'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [checking, setChecking] = useState(false);
  const [messages, setMessages] = useState([]);
  const keyRef = useRef('');

  const load = useCallback(async (key) => {
    const r = await fetch('/api/admin/messages', {
      headers: { 'x-admin-key': key },
      cache: 'no-store',
    });
    if (r.status === 401) throw new Error('unauthorized');
    const data = await r.json();
    return data.messages || [];
  }, []);

  // try existing session
  useEffect(() => {
    const saved = sessionStorage.getItem('hdl_admin_key');
    if (!saved) return;
    load(saved)
      .then((msgs) => { keyRef.current = saved; setMessages(msgs); setAuthed(true); })
      .catch(() => sessionStorage.removeItem('hdl_admin_key'));
  }, [load]);

  // auto refresh while authed
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      load(keyRef.current).then(setMessages).catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, [authed, load]);

  async function unlock() {
    setLoginErr('');
    if (!pw) return setLoginErr('Enter the admin password');
    setChecking(true);
    try {
      const msgs = await load(pw);
      keyRef.current = pw;
      sessionStorage.setItem('hdl_admin_key', pw);
      setMessages(msgs);
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
  }

  async function del(id) {
    setMessages((m) => m.filter((x) => x.id !== id)); // optimistic
    await fetch(`/api/admin/messages?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': keyRef.current },
    });
  }

  async function clearAll() {
    if (!confirm('Clear ALL messages from the wall? This cannot be undone.')) return;
    setMessages([]);
    await fetch('/api/admin/messages?all=1', {
      method: 'DELETE',
      headers: { 'x-admin-key': keyRef.current },
    });
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
          <button className="btn btn-ghost" onClick={() => load(keyRef.current).then(setMessages)}>
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
          messages.map((m) => (
            <div className="msg-row" key={m.id}>
              <div className="body">
                <div className="top">
                  <span className="nm">{m.name}</span>
                  {m.table ? <span className="tbl">Table {m.table}</span> : null}
                  <span className="tm">{new Date(m.ts).toLocaleString()}</span>
                </div>
                <div className="tx">{m.text}</div>
              </div>
              <button className="del" onClick={() => del(m.id)}>Delete</button>
            </div>
          ))
        )}

        <div className="admin-hint">
          Deleting pulls the message off the big screen live and removes it from history.
        </div>
      </div>
    </div>
  );
}
