import React, { useState } from 'react';
import { simulateGrade } from '../../lib/studentApi.js';

export default function Simulator() {
  const [report, setReport] = useState(12);
  const [defense, setDefense] = useState(13);
  const [internship, setInternship] = useState(14);
  const [result, setResult] = useState(null);

  async function calc() {
    const r = await simulateGrade({ report, defense, internship });
    setResult(r.data);
  }

  return (
    <div>
      <h2 className="title">Intelligent Grade Simulator</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        <label>Report: {report}
          <input type="range" min="0" max="20" value={report} onChange={e=>setReport(+e.target.value)} />
        </label>
        <label>Defense: {defense}
          <input type="range" min="0" max="20" value={defense} onChange={e=>setDefense(+e.target.value)} />
        </label>
        <label>Internship: {internship}
          <input type="range" min="0" max="20" value={internship} onChange={e=>setInternship(+e.target.value)} />
        </label>
      </div>
      <button className="primary" style={{ marginTop: 10 }} onClick={calc}>Simuler</button>
      {result && (
        <p className="subtitle" style={{ marginTop: 8 }}>
          Note: {result.grade.toFixed(2)} / 20 — {result.mention}
        </p>
      )}
    </div>
  );
}
