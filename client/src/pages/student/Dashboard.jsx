import React, { useEffect, useMemo, useState } from 'react';
import { getDefense, getReport, listSupervisors } from '../../lib/studentApi.js';
import { listNotifications } from '../../lib/notificationsApi.js';

function parseTimeRange(v) {
  const raw = String(v || '').trim();
  const parts = raw.split('-').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 2) return { start: parts[0], end: parts[1] };
  if (parts.length === 1 && parts[0]) return { start: parts[0], end: '' };
  return { start: '', end: '' };
}

function fmtLongDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr || '');
  try {
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return d.toLocaleDateString();
  }
}

function daysUntil(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfTarget - startOfToday) / (24 * 60 * 60 * 1000));
}

function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIcsDateTimeLocal(dateObj) {
  return `${dateObj.getFullYear()}${pad2(dateObj.getMonth() + 1)}${pad2(dateObj.getDate())}T${pad2(dateObj.getHours())}${pad2(dateObj.getMinutes())}00`;
}

function buildIcs({ title, description, location, start, end }) {
  const uid = `${Date.now()}@monpfe`;
  const dtstamp = toIcsDateTimeLocal(new Date());
  const dtstart = toIcsDateTimeLocal(start);
  const dtend = toIcsDateTimeLocal(end);
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//monpfe//planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(location)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function openPrintInvitation({ studentEmail, date, time, room, supervisors, juries }) {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    alert('Popup blocked by your browser. Allow popups and try again.');
    return;
  }
  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const now = new Date().toLocaleString();
  const supText = (supervisors || []).join(', ') || '—';
  const juryText = (juries || []).join(', ') || '—';
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Invitation</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 28px; color: #111827; }
        .meta { color: #6b7280; font-size: 12px; margin: 6px 0 18px; }
        h1 { font-size: 18px; margin: 0; }
        .box { border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; }
        .row { display: grid; grid-template-columns: 160px 1fr; gap: 10px; padding: 8px 0; border-bottom: 1px solid #eef2f8; }
        .row:last-child { border-bottom: 0; }
        .k { color: #374151; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
        .v { font-weight: 700; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Defense invitation</h1>
      <div class="meta">Generated on ${esc(now)} — use “Print” then “Save as PDF”.</div>
      <div class="box">
        <div class="row"><div class="k">Student</div><div class="v">${esc(studentEmail)}</div></div>
        <div class="row"><div class="k">Date</div><div class="v">${esc(date)}</div></div>
        <div class="row"><div class="k">Time</div><div class="v">${esc(time)}</div></div>
        <div class="row"><div class="k">Room</div><div class="v">${esc(room)}</div></div>
        <div class="row"><div class="k">Supervisor(s)</div><div class="v">${esc(supText)}</div></div>
        <div class="row"><div class="k">Jury</div><div class="v">${esc(juryText)}</div></div>
      </div>
      <script>
        setTimeout(() => { try { window.focus(); window.print(); } catch (e) {} }, 200);
      </script>
    </body>
  </html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export default function Dashboard({ email }) {
  const [defense, setDefense] = useState(null);
  const [report, setReport] = useState(null);
  const [supervisors, setSupervisors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [d, r, s, n] = await Promise.all([
      getDefense({ email }),
      getReport({ email }),
      listSupervisors({ student_email: email }),
      listNotifications({ email, limit: 6 })
    ]);

    if (d.ok) setDefense(d.data || null);
    if (r.ok) setReport(r.data || null);
    if (s.ok) setSupervisors(Array.isArray(s.data) ? s.data : []);
    if (n.ok) setNotifications(Array.isArray(n.data) ? n.data : []);

    const errs = [];
    if (!d.ok) errs.push((d.data && d.data.errors && d.data.errors[0]) || 'Unable to load defense.');
    if (!r.ok) errs.push((r.data && r.data.errors && r.data.errors[0]) || 'Unable to load documents.');
    if (!s.ok) errs.push((s.data && s.data.errors && s.data.errors[0]) || 'Unable to load supervisors.');
    if (!n.ok) errs.push((n.data && n.data.errors && n.data.errors[0]) || 'Unable to load notifications.');
    setError(errs.filter(Boolean).slice(0, 1).join('\n'));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [email]);

  const time = useMemo(() => parseTimeRange(defense && defense.time), [defense && defense.time]);
  const juryList = useMemo(() => {
    const raw = defense && defense.jury ? String(defense.jury) : '';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }, [defense && defense.jury]);
  const supNames = useMemo(() => (supervisors || []).map((x) => x.teacher_name || x.teacher_email).filter(Boolean), [supervisors]);

  const reminder = defense && defense.date ? daysUntil(defense.date) : null;
  const reminderText =
    reminder === null
      ? ''
      : reminder < 0
        ? 'Past defense'
        : reminder === 0
          ? 'Today'
          : reminder === 1
            ? 'Tomorrow'
            : `In ${reminder} days`;

  function onDownloadInvitation() {
    if (!defense || !defense.date) {
      alert('No defense scheduled.');
      return;
    }
    openPrintInvitation({
      studentEmail: email,
      date: fmtLongDate(defense.date),
      time: defense.time || '',
      room: defense.classroom || '',
      supervisors: supNames,
      juries: juryList
    });
  }

  function onAddToCalendar() {
    if (!defense || !defense.date) {
      alert('No defense scheduled.');
      return;
    }
    const d = new Date(defense.date);
    const startH = time.start ? time.start.split(':') : [];
    const endH = time.end ? time.end.split(':') : [];
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(startH[0] || 0), Number(startH[1] || 0), 0);
    const end = time.end
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(endH[0] || 0), Number(endH[1] || 0), 0)
      : new Date(start.getTime() + 60 * 60 * 1000);
    const ics = buildIcs({
      title: 'Defense',
      description: `Defense — ${email}\nSupervisor(s): ${supNames.join(', ') || '—'}\nJury: ${juryList.join(', ') || '—'}`,
      location: defense.classroom || '',
      start,
      end
    });
    downloadText('defense.ics', ics, 'text/calendar;charset=utf-8');
  }

  if (loading) return <p className="subtitle">Loading...</p>;

  return (
    <div>
      <div className="dash-grid">
        <div className="dash-col">
          <section className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title">
                <span aria-hidden="true">🎓</span> My defense
              </h3>
              {reminderText ? <span className="status-pill">{reminderText}</span> : null}
            </div>

            {!defense || !defense.date ? (
              <p className="glass-card-sub">No defense scheduled yet.</p>
            ) : (
              <>
                <div className="defense-main">
                  <div className="defense-date">{fmtLongDate(defense.date)}</div>
                  <div className="defense-time">
                    {time.start}
                    {time.end ? ` → ${time.end}` : ''}
                  </div>
                </div>

                <div className="kv">
                  <div>
                    <strong>Room:</strong> {defense.classroom || '—'}
                  </div>
                  <div>
                    <strong>Supervisor:</strong> {supNames.length ? supNames[0] : '—'}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <p className="glass-card-sub" style={{ margin: 0 }}>
                    <strong>Jury:</strong>
                  </p>
                  <ul className="check-list">
                    {juryList.length ? (
                      juryList.map((j, i) => (
                        <li key={`${j}-${i}`}>
                          <span className="check" aria-hidden="true">
                            ✓
                          </span>
                          <span>{j}</span>
                        </li>
                      ))
                    ) : (
                      <li>
                        <span className="check" aria-hidden="true">
                          ✓
                        </span>
                        <span>To be confirmed</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="toolbar" style={{ marginTop: 14 }}>
                  <button className="btn" type="button" onClick={onDownloadInvitation}>
                    Download invitation
                  </button>
                  <button className="btn" type="button" onClick={onAddToCalendar}>
                    Add to calendar
                  </button>
                </div>
              </>
            )}
          </section>

          <section className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title">
                <span aria-hidden="true">🧾</span> Thesis report
              </h3>
              {report && report.status ? (
                <span className={'status-pill ' + (report.status === 'submitted' ? 'ok' : '')}>
                  {report.status === 'submitted' ? 'Submitted' : 'Not submitted'}
                </span>
              ) : null}
            </div>

            {!report ? (
              <p className="glass-card-sub">No submission info yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                <div className="doc-row">
                  <div className="doc-name">Report</div>
                  <div className="doc-action">{report.report_url ? <a href={report.report_url} target="_blank" rel="noreferrer">Open</a> : '—'}</div>
                </div>
                <div className="doc-row">
                  <div className="doc-name">Thesis</div>
                  <div className="doc-action">{report.memoire_url ? <a href={report.memoire_url} target="_blank" rel="noreferrer">Open</a> : '—'}</div>
                </div>
                {report.deadline ? (
                  <p className="glass-card-sub" style={{ margin: 0 }}>
                    Deadline: <strong>{report.deadline}</strong>
                  </p>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <div className="dash-col">
          <section className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title">
                <span aria-hidden="true">🔔</span> Important notifications
              </h3>
              <button className="icon-btn" type="button" onClick={load} aria-label="Refresh">
                ↻
              </button>
            </div>

            {error ? <div className="errors" style={{ marginTop: 10 }}>{error}</div> : null}

            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              {(notifications || []).slice(0, 4).map((n, i) => (
                <div
                  key={n.delivery_id || i}
                  className="notif-row"
                  style={{ background: n.read_at ? 'rgba(255,255,255,0.62)' : '#f1f5ff' }}
                >
                  <div className="notif-title">{n.title || 'Notification'}</div>
                  <div className="notif-meta">{n.created_at ? new Date(Number(n.created_at)).toLocaleString() : ''}</div>
                  <div className="notif-body">{n.message}</div>
                </div>
              ))}
              {(!notifications || !notifications.length) && <p className="glass-card-sub" style={{ margin: 0 }}>No notifications.</p>}
            </div>
          </section>

          <section className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title">
                <span aria-hidden="true">👩‍🏫</span> Supervisor(s)
              </h3>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {supNames.length ? (
                supNames.map((s, i) => (
                  <div key={`${s}-${i}`} className="peer-pill">
                    {s}
                  </div>
                ))
              ) : (
                <p className="glass-card-sub" style={{ margin: 0 }}>
                  No supervisor assigned.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

