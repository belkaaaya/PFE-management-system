import React, { useEffect, useState } from 'react';
import { getReport, setReport } from '../../lib/studentApi.js';

export default function Report({ email }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await getReport({ email });
      setData(r.data || { status: 'not_submitted', deadline: '', report_url: '', memoire_url: '' });
      setLoading(false);
    })();
  }, [email]);

  if (loading) return <p className="subtitle">Chargement…</p>;

  async function save() {
    await setReport({ email, ...data });
    alert('Enregistré');
  }

  return (
    <div>
      <h2 className="title">Report Submission</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="field"><span className="icon" aria-hidden="true">📌</span>
          <select value={data.status} onChange={e=>setData({ ...data, status: e.target.value })}>
            <option value="not_submitted">NotSubmitted</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
        <div className="field"><span className="icon" aria-hidden="true">📅</span><input value={data.deadline} placeholder="Deadline (e.g., June 15, 2025)" onChange={e=>setData({ ...data, deadline: e.target.value })} /></div>
      </div>
      <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
        <button className="btn" onClick={() => document.getElementById('report-url').focus()}>Upload your report</button>
        <input id="report-url" className="field" placeholder="Report URL" onChange={e=>setData({ ...data, report_url: e.target.value })} />
        <button className="btn" onClick={() => document.getElementById('memoire-url').focus()}>Upload your mémoire</button>
        <input id="memoire-url" className="field" placeholder="Mémoire URL" onChange={e=>setData({ ...data, memoire_url: e.target.value })} />
      </div>
      <button className="primary" style={{ marginTop: 12 }} onClick={save}>Sauvegarder</button>
    </div>
  );
}
