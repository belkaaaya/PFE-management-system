import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getMessages, sendMessage, listSupervisors } from '../../lib/studentApi.js';

function parseContent(raw) {
  if (typeof raw !== 'string') return { text: '' };
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === 'object') {
      const text = typeof j.text === 'string' ? j.text : '';
      const attachment = j.attachment && typeof j.attachment === 'object' ? j.attachment : null;
      return { text, attachment };
    }
  } catch {
    // ignore
  }
  return { text: raw };
}

function lastSeenKey(me, peer) {
  return `monpfe:last_seen:${me}:${peer}`;
}

export default function Messaging({ email }) {
  const me = email;
  const [peers, setPeers] = useState([]);
  const [peerEmail, setPeerEmail] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [unread, setUnread] = useState({});
  const [text, setText] = useState('');
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const threadRef = useRef(null);

  const peerLabel = useMemo(() => peers.find((p) => p.email === peerEmail)?.name || peerEmail, [peers, peerEmail]);

  async function loadPeers() {
    let r = null;
    try {
      r = await listSupervisors({ student_email: me });
    } catch {
      setError('Unable to reach the API (messaging).');
      setPeers([]);
      return;
    }
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to load supervisors list.');
      setPeers([]);
      return;
    }
    setError('');
    const rows = Array.isArray(r.data) ? r.data : [];
    const p = rows.map((x) => ({ email: x.teacher_email, name: x.teacher_name })).filter((x) => x.email);
    setPeers(p);
    if (!peerEmail && p.length) setPeerEmail(p[0].email);
  }

  async function loadThread(selectedPeer) {
    if (!selectedPeer) return;
    let r = null;
    try {
      r = await getMessages({ user: me, peer: selectedPeer });
    } catch {
      setError('Unable to reach the API (messaging).');
      setMsgs([]);
      return;
    }
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to load messages.');
      setMsgs([]);
      return;
    }
    setError('');
    setMsgs(Array.isArray(r.data) ? r.data : []);
    try {
      localStorage.setItem(lastSeenKey(me, selectedPeer), String(Date.now()));
    } catch {
      // ignore
    }
  }

  async function refreshUnread(currentPeers) {
    const map = {};
    for (const p of currentPeers) {
      let r = null;
      try {
        r = await getMessages({ user: me, peer: p.email });
      } catch {
        continue;
      }
      if (!r.ok || !Array.isArray(r.data) || !r.data.length) continue;
      const lastFromPeer = [...r.data].reverse().find((m) => m.user === p.email);
      if (!lastFromPeer) continue;
      let seen = 0;
      try {
        seen = Number(localStorage.getItem(lastSeenKey(me, p.email)) || 0);
      } catch {
        seen = 0;
      }
      if (Number(lastFromPeer.created_at) > seen) map[p.email] = 1;
    }
    setUnread(map);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadPeers();
      setLoading(false);
    })();
  }, [me]);

  useEffect(() => {
    (async () => {
      await loadThread(peerEmail);
      await refreshUnread(peers);
    })();
  }, [peerEmail]);

  useEffect(() => {
    if (!peers.length) return;
    refreshUnread(peers);
    const id = setInterval(() => refreshUnread(peers), 8000);
    return () => clearInterval(id);
  }, [peers, me]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs]);

  async function onSend() {
    const t = text.trim();
    const u = docUrl.trim();
    if (!peerEmail) return;
    if (!t && !u) return;

    const payload = { text: t, attachment: u ? { name: (docName || 'document').trim(), url: u } : null };
    const content = JSON.stringify(payload);

    let r = null;
    try {
      r = await sendMessage({ user: me, peer: peerEmail, content });
    } catch {
      setError('Unable to reach the API (messaging).');
      return;
    }
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to send message.');
      return;
    }

    setError('');
    setMsgs((m) => [...m, { user: me, peer: peerEmail, content, created_at: Date.now() }]);
    setText('');
    setDocName('');
    setDocUrl('');
    try {
      localStorage.setItem(lastSeenKey(me, peerEmail), String(Date.now()));
    } catch {
      // ignore
    }
    setUnread((u0) => {
      const copy = { ...u0 };
      delete copy[peerEmail];
      return copy;
    });
  }

  if (loading) return <p className="subtitle">Loading...</p>;

  return (
    <div>
      <h2 className="title">Messages</h2>
      <p className="subtitle">Student ↔ supervisor communication (messages, documents, corrections)</p>
      {error && <div className="errors">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ border: '1px solid #d6d9e3', borderRadius: 14, background: 'rgba(255,255,255,0.74)', padding: 10 }}>
          <p className="subtitle" style={{ textAlign: 'left', margin: '4px 0 10px' }}>
            Supervisor(s)
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {peers.map((p) => (
              <button
                key={p.email}
                className={'btn' + (peerEmail === p.email ? ' primary' : '')}
                type="button"
                onClick={() => setPeerEmail(p.email)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  padding: '0 12px'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                {unread[p.email] ? (
                  <span
                    style={{ width: 10, height: 10, borderRadius: 999, background: '#b91c1c', display: 'inline-block' }}
                    aria-label="New message"
                  />
                ) : null}
              </button>
            ))}
            {!peers.length && (
              <div className="subtitle" style={{ textAlign: 'left' }}>
                No supervisor assigned.
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="subtitle" style={{ textAlign: 'left', marginTop: 0 }}>
            Conversation: {peerEmail ? peerLabel : '—'}
          </p>
          <div
            ref={threadRef}
            style={{
              border: '1px solid #d6d9e3',
              borderRadius: 14,
              padding: 12,
              minHeight: 260,
              background: '#fff',
              maxHeight: 360,
              overflow: 'auto'
            }}
          >
            {msgs.map((m, i) => {
              const mine = m.user === me;
              const c = parseContent(m.content);
              return (
                <div key={i} style={{ textAlign: mine ? 'right' : 'left', margin: '6px 0' }}>
                  <div style={{ display: 'inline-block', maxWidth: 520, background: mine ? '#eef1f8' : '#f1f5ff', padding: '8px 12px', borderRadius: 10 }}>
                    {c.text && <div style={{ whiteSpace: 'pre-wrap' }}>{c.text}</div>}
                    {c.attachment && c.attachment.url && (
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        <a href={c.attachment.url} target="_blank" rel="noreferrer">
                          📎 {c.attachment.name || 'Attachment'}
                        </a>
                      </div>
                    )}
                    <div style={{ marginTop: 4, fontSize: 11, color: '#6b7280' }}>
                      {m.created_at ? new Date(Number(m.created_at)).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              );
            })}
            {!msgs.length && (
              <div className="subtitle" style={{ textAlign: 'left' }}>
                No messages.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            <div className="field">
              <span className="icon" aria-hidden="true">
                💬
              </span>
              <input value={text} placeholder="Your message..." onChange={(e) => setText(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field">
                <span className="icon" aria-hidden="true">
                  📎
                </span>
                <input value={docName} placeholder="Document name (optional)" onChange={(e) => setDocName(e.target.value)} />
              </div>
              <div className="field">
                <span className="icon" aria-hidden="true">
                  🔗
                </span>
                <input value={docUrl} placeholder="Document URL / correction (optional)" onChange={(e) => setDocUrl(e.target.value)} />
              </div>
            </div>
            <button className="primary" type="button" onClick={onSend} disabled={!peerEmail}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

