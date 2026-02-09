import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listMyStudents } from '../../lib/professorApi.js';
import { getMessages, sendMessage } from '../../lib/studentApi.js';

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

export default function ProfMessaging({ teacherEmail, initialPeer }) {
  const initialEmail = typeof initialPeer === 'string' ? initialPeer : (initialPeer && initialPeer.email);
  const [peers, setPeers] = useState([]);
  const [peerEmail, setPeerEmail] = useState(initialEmail || '');
  const [msgs, setMsgs] = useState([]);
  const [unread, setUnread] = useState({});
  const [text, setText] = useState('');
  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const threadRef = useRef(null);

  const peerLabel = useMemo(() => peers.find(p => p.email === peerEmail)?.name || peerEmail, [peers, peerEmail]);

  async function loadPeers() {
    const r = await listMyStudents({ teacher_email: teacherEmail, role: 'supervisor' });
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Impossible de charger la liste des étudiants.');
      setPeers([]);
      return;
    }
    setError('');
    const rows = Array.isArray(r.data) ? r.data : [];
    const p = rows.map(x => ({ email: x.student_email, name: x.student_name })).filter(x => x.email);
    setPeers(p);
    if (!peerEmail && p.length) setPeerEmail(p[0].email);
  }

  async function loadThread({ selectedPeer }) {
    if (!selectedPeer) return;
    let r = null;
    try {
      r = await getMessages({ user: teacherEmail, peer: selectedPeer });
    } catch {
      setError("Impossible de joindre l'API (messagerie).");
      setMsgs([]);
      return;
    }
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Impossible de charger les messages.');
      setMsgs([]);
      return;
    }
    setError('');
    setMsgs(Array.isArray(r.data) ? r.data : []);
    try {
      localStorage.setItem(lastSeenKey(teacherEmail, selectedPeer), String(Date.now()));
    } catch {
      // ignore
    }
  }

  async function refreshUnread(currentPeers) {
    const map = {};
    for (const p of currentPeers) {
      let r = null;
      try {
        r = await getMessages({ user: teacherEmail, peer: p.email });
      } catch {
        continue;
      }
      if (!r.ok || !Array.isArray(r.data) || !r.data.length) continue;
      const lastFromPeer = [...r.data].reverse().find(m => m.user === p.email);
      if (!lastFromPeer) continue;
      let seen = 0;
      try {
        seen = Number(localStorage.getItem(lastSeenKey(teacherEmail, p.email)) || 0);
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
  }, [teacherEmail]);

  useEffect(() => {
    if (!initialEmail) return;
    setPeerEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    (async () => {
      await loadThread({ selectedPeer: peerEmail });
      await refreshUnread(peers);
    })();
  }, [peerEmail]);

  useEffect(() => {
    if (!peers.length) return;
    refreshUnread(peers);
    const id = setInterval(() => refreshUnread(peers), 8000);
    return () => clearInterval(id);
  }, [peers, teacherEmail]);

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
      r = await sendMessage({ user: teacherEmail, peer: peerEmail, content });
    } catch {
      setError("Impossible de joindre l'API (messagerie).");
      return;
    }
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible d'envoyer le message.");
      return;
    }

    setError('');
    setMsgs(m => [...m, { user: teacherEmail, peer: peerEmail, content, created_at: Date.now() }]);
    setText('');
    setDocName('');
    setDocUrl('');
    try {
      localStorage.setItem(lastSeenKey(teacherEmail, peerEmail), String(Date.now()));
    } catch {
      // ignore
    }
    setUnread(u0 => {
      const copy = { ...u0 };
      delete copy[peerEmail];
      return copy;
    });
  }

  if (loading) return <p className="subtitle">Chargement…</p>;

  return (
    <div>
      <h2 className="title">Messagerie interne</h2>
      <p className="subtitle">Communication étudiant ↔ encadrant (historique complet)</p>
      {error && <div className="errors">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14, marginTop: 14 }}>
        <div style={{ border: '1px solid #d6d9e3', borderRadius: 14, background: 'rgba(255,255,255,0.74)', padding: 10 }}>
          <p className="subtitle" style={{ textAlign: 'left', margin: '4px 0 10px' }}>Étudiants</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {peers.map(p => (
              <button
                key={p.email}
                className={'btn' + (peerEmail === p.email ? ' primary' : '')}
                type="button"
                onClick={() => setPeerEmail(p.email)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '0 12px' }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                {unread[p.email] ? <span style={{ width: 10, height: 10, borderRadius: 999, background: '#b91c1c', display: 'inline-block' }} aria-label="Nouveau message" /> : null}
              </button>
            ))}
            {!peers.length && (
              <div className="subtitle" style={{ textAlign: 'left' }}>
                Aucun étudiant affecté.
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="subtitle" style={{ textAlign: 'left', marginTop: 0 }}>
            Conversation: {peerEmail ? peerLabel : '—'}
          </p>
          <div ref={threadRef} style={{ border: '1px solid #d6d9e3', borderRadius: 14, padding: 12, minHeight: 260, background: '#fff', maxHeight: 360, overflow: 'auto' }}>
            {msgs.map((m, i) => {
              const me = m.user === teacherEmail;
              const c = parseContent(m.content);
              return (
                <div key={i} style={{ textAlign: me ? 'right' : 'left', margin: '6px 0' }}>
                  <div style={{ display: 'inline-block', maxWidth: 520, background: me ? '#eef1f8' : '#f1f5ff', padding: '8px 12px', borderRadius: 10 }}>
                    {c.text && <div style={{ whiteSpace: 'pre-wrap' }}>{c.text}</div>}
                    {c.attachment && c.attachment.url && (
                      <div style={{ marginTop: 6, fontSize: 13 }}>
                        <a href={c.attachment.url} target="_blank" rel="noreferrer">
                          📎 {c.attachment.name || 'Document'}
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
                Aucun message.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            <div className="field">
              <span className="icon" aria-hidden="true">💬</span>
              <input value={text} placeholder="Votre message..." onChange={e => setText(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field">
                <span className="icon" aria-hidden="true">📎</span>
                <input value={docName} placeholder="Nom du document (optionnel)" onChange={e => setDocName(e.target.value)} />
              </div>
              <div className="field">
                <span className="icon" aria-hidden="true">🔗</span>
                <input value={docUrl} placeholder="URL document / correction (optionnel)" onChange={e => setDocUrl(e.target.value)} />
              </div>
            </div>
            <button className="primary" type="button" onClick={onSend} disabled={!peerEmail}>Envoyer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
