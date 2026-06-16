'use client';
import { useEffect, useState } from 'react';
import Backdrop from '@/components/Backdrop';

const MAX = 280;

export default function ChatPage() {
  const [name, setName] = useState('');
  const [table, setTable] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [poof, setPoof] = useState(false);

  // remember name & table between sends
  useEffect(() => {
    try {
      setName(localStorage.getItem('hdl_name') || '');
      setTable(localStorage.getItem('hdl_table') || '');
    } catch (_) {}
  }, []);

  async function send() {
    setError('');
    if (!name.trim()) return setError('Please enter your name 🐼');
    if (!message.trim()) return setError('Your message is empty');
    setSending(true);
    try {
      const r = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, table, message }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to send');
      try {
        localStorage.setItem('hdl_name', name);
        localStorage.setItem('hdl_table', table);
      } catch (_) {}
      setMessage('');
      setPoof(true);
      setTimeout(() => setPoof(false), 1600);
    } catch (e) {
      setError(e.message || 'Something went wrong, try again');
    } finally {
      setSending(false);
    }
  }

  return (
    <Backdrop showSpotlight={false}>
      <div className="chat-wrap">
        <div className="chat-head">
          <img src="/mascot.png" alt="Panda Hi" />
          <h1>Send to the <span className="accent">Screen</span></h1>
          <p>Your message will float on the big screen ✨</p>
        </div>

        <div className="card-form">
          <div className="field-2">
            <div className="row">
              <label htmlFor="nm">Name</label>
              <input id="nm" value={name} maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name" />
            </div>
            <div className="row table">
              <label htmlFor="tb">Table No.</label>
              <input id="tb" value={table} maxLength={12} inputMode="numeric"
                onChange={(e) => setTable(e.target.value)}
                placeholder="12" />
            </div>
          </div>

          <div className="row">
            <label htmlFor="ms">Message</label>
            <textarea id="ms" value={message} maxLength={MAX}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Say hi, request a song, anything..." />
            <div className="counter">{message.length}/{MAX}</div>
          </div>

          <button className="send-btn" onClick={send} disabled={sending}>
            {sending ? 'Sending…' : <>Send to screen 🚀</>}
          </button>

          <div className="form-error">{error}</div>
        </div>
      </div>

      {poof && (
        <div className="poof" onClick={() => setPoof(false)}>
          <div className="inner">
            <div className="puff">💨</div>
            <h3>Sent!</h3>
            <p>Look at the big screen — your message is floating 🐼</p>
          </div>
        </div>
      )}
    </Backdrop>
  );
}
