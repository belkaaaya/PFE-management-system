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

  if (loading) return <p className="subtitle">Loading...</p>;

  async function save() {
    await setReport({ email, ...data });
    alert('Saved');
  }

  return (
    <div>
      <h2 className="title">Report Submission</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="field">
          <span className="icon" aria-hidden="true">
            📌
          </span>
          <select value={data.status} onChange={(e) => setData({ ...data, status: e.target.value })}>
            <option value="not_submitted">Not submitted</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
        <div className="field">
          <span className="icon" aria-hidden="true">
            📅
          </span>
          <input
            value={data.deadline}
            placeholder="Deadline (e.g., 2026-06-15)"
            onChange={(e) => setData({ ...data, deadline: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
        <button className="btn" onClick={() => document.getElementById('report-url').focus()}>
          Upload your report
        </button>
        <input
          id="report-url"
          className="field"
          value={data.report_url || ''}
          placeholder="Report URL"
          onChange={(e) => setData({ ...data, report_url: e.target.value })}
        />
        <button className="btn" onClick={() => document.getElementById('memoire-url').focus()}>
          Upload your thesis
        </button>
        <input
          id="memoire-url"
          className="field"
          value={data.memoire_url || ''}
          placeholder="Thesis URL"
          onChange={(e) => setData({ ...data, memoire_url: e.target.value })}
        />
      </div>

      <button className="primary" style={{ marginTop: 12 }} onClick={save}>
        Save
      </button>
    </div>
  );
}

