'use client';
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Backdrop from '@/components/Backdrop';

export default function DisplayPage() {
  const [bubbles, setBubbles] = useState([]);
  const [pins, setPins] = useState([]);
  const [chatUrl, setChatUrl] = useState('');
  const sinceRef = useRef(0);
  const delSinceRef = useRef(0);

  // build the QR target from the current origin
  useEffect(() => {
    setChatUrl(`${window.location.origin}/chat`);
    // ignore any backlog: only show messages/deletions after the wall opened
    const nowCursor = Date.now() * 1000;
    sinceRef.current = nowCursor;
    delSinceRef.current = nowCursor;

    // welcome bubble so the screen isn't empty
    spawn({
      id: Date.now() * 1000,
      name: 'Admin Ganteng',
      table: 'Staff',
      text: 'Welcome to the night shift! Scan the QR & say hi 🐼🔥',
    });
  }, []);

  function spawn(msg) {
    const lane = 8 + Math.random() * 64; // left % (keep clear of QR/mascot edges-ish)
    const rise = 30 + Math.random() * 11; // slower again (~0.7x of previous speed)
    const swaydur = 4 + Math.random() * 4;
    const key = `${msg.id}-${Math.random().toString(36).slice(2, 7)}`;
    setBubbles((b) => [...b, { ...msg, lane, rise, swaydur, key }]);
    setTimeout(() => {
      setBubbles((b) => b.filter((x) => x.key !== key));
    }, rise * 1000 + 500);
  }

  // poll for new messages
  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch(
          `/api/messages?since=${sinceRef.current}&delsince=${delSinceRef.current}`,
          { cache: 'no-store' }
        );
        const data = await r.json();
        if (!alive) return;

        if (data.messages?.length) {
          for (const m of data.messages) {
            sinceRef.current = Math.max(sinceRef.current, m.id);
            spawn(m);
          }
        }

        if (data.deleted?.length) {
          const ids = new Set();
          let clearAll = false;
          for (const t of data.deleted) {
            delSinceRef.current = Math.max(delSinceRef.current, t.at);
            if (t.id === '*') clearAll = true;
            else ids.add(t.id);
          }
          if (clearAll) setBubbles([]);
          else if (ids.size) setBubbles((b) => b.filter((x) => !ids.has(x.id)));
        }

        if (data.pins) setPins(data.pins);
      } catch (_) {}
    }
    const id = setInterval(tick, 1500);
    tick();
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <Backdrop>
      {/* brand */}
      <div className="brand">
        <img className="brand-logo" src="/logo.png" alt="Haidilao" />
        <span className="brand-sub">Haidilao PIK Avenue</span>
      </div>
      <div className="shift-tag"><span className="dot" /> NIGHT SHIFT • LIVE</div>

      {/* floating bubbles */}
      <div className="bubble-lane">
        {bubbles.map((b) => (
          <div key={b.key} className="bubble"
            style={{ left: `${b.lane}%`, '--rise': `${b.rise}s` }}>
            <div className="sway" style={{ '--swaydur': `${b.swaydur}s` }}>
              <div className="card">
                <div className="meta">
                  <span className="nm">{b.name}</span>
                  {b.table ? <span className="tbl">Table {b.table}</span> : null}
                </div>
                <div className="msg">{b.text}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* pinned bubbles — stay floating until unpinned (max 3) */}
      <div className="pin-lane">
        {pins.slice(0, 3).map((p, i) => (
          <div key={p.id} className={`pin-bubble slot-${i}`}>
            <div className="pin-float" style={{ animationDelay: `${i * 0.8}s` }}>
              <div className="card pinned">
                <div className="pin-badge">📌</div>
                <div className="meta">
                  <span className="nm">{p.name}</span>
                  {p.table ? <span className="tbl">Table {p.table}</span> : null}
                </div>
                <div className="msg">{p.text}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* mascot */}
      <div className="mascot-glow" />
      <img className="mascot" src="/mascot.png" alt="Panda Hi" />
      <div className="mascot-hint">Midnight cravings? Haidilao PIK is the answer! 👋</div>

      {/* QR panel */}
      <div className="qr-panel">
        <div className="qr-box qr-scanline">
          {chatUrl && (
            <QRCodeSVG value={chatUrl} size={150} level="M"
              fgColor="#1a0f55" bgColor="#ffffff" />
          )}
        </div>
        <h4>Scan &amp; Chat</h4>
        <p>Scan QR to send a message ✨</p>
      </div>
    </Backdrop>
  );
}
