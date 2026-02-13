import React, { useEffect, useMemo, useState } from 'react';
import { listMyStudents, saveEvaluation } from '../../lib/professorApi.js';

function fmtDefense(r) {
  if (!r || !r.defense_date) return '-';
  const parts = [r.defense_date, r.defense_time, r.defense_room].filter(Boolean);
  return parts.join(' — ');
}

export default function JuryStudents({ teacherEmail }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => rows.find(r => r.student_email === selectedEmail) || null, [rows, selectedEmail]);

  async function load() {
    setLoading(true);
    const r = await listMyStudents({ teacher_email: teacherEmail, role: 'jury' });
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible de charger vos soutenances (jury).");
      setRows([]);
      setLoading(false);
      return;
    }
    setError('');
    setRows(Array.isArray(r.data) ? r.data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [teacherEmail]);

  useEffect(() => {
    if (!selected) return;
    setGrade(selected.eval_grade === null || selected.eval_grade === undefined ? '' : String(selected.eval_grade));
    setComment(selected.eval_comment || '');
  }, [selected]);

  async function onSave() {
    if (!selected) return;
    setSaving(true);
    const g = grade === '' ? null : Number(grade);
    const r = await saveEvaluation({
      student_email: selected.student_email,
      evaluator_email: teacherEmail,
      evaluator_role: 'jury',
      grade: g,
      comment
    });
    setSaving(false);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible d'enregistrer la note jury.");
      return;
    }
    setError('');
    await load();
    alert('Note jury enregistrée');
  }

  return (
    <div>
      <h2 className="title">Mes étudiants (jury)</h2>
      <p className="subtitle">Accéder aux rapports, voir les infos de soutenance et saisir la note du jury</p>

      <div className="toolbar">
        <button className="btn" type="button" onClick={load} disabled={loading}>{loading ? 'Chargement...' : 'Actualiser'}</button>
      </div>

      {error && <div className="errors">{error}</div>}

      <div style={{ marginTop: 18, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Étudiant</th><th>E-mail</th><th>Encadrant(s)</th><th>Soutenance</th><th>Rapport</th><th>Mémoire</th><th>Note</th><th style={{ width: 140 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.student_email || i} style={{ background: selectedEmail === r.student_email ? '#f3f6ff' : undefined }}>
                <td>{r.student_name}</td>
                <td>{r.student_email}</td>
                <td>{Array.isArray(r.supervisors) ? r.supervisors.join(', ') : r.supervisors}</td>
                <td>{fmtDefense(r)}</td>
                <td>{r.report_url ? <a href={r.report_url} target="_blank" rel="noreferrer">Ouvrir</a> : '-'}</td>
                <td>{r.memoire_url ? <a href={r.memoire_url} target="_blank" rel="noreferrer">Ouvrir</a> : '-'}</td>
                <td>{r.eval_grade === null || r.eval_grade === undefined ? '-' : r.eval_grade}</td>
                <td>
                  <button className="btn" type="button" onClick={() => setSelectedEmail(r.student_email)}>
                    Noter
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: 'var(--muted)' }}>
                  Aucune affectation jury trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={{ marginTop: 16 }}>
          <h3 className="title" style={{ fontSize: 16, textAlign: 'left' }}>
            Note jury — {selected.student_name} ({selected.student_email})
          </h3>
          <div style={{ display: 'grid', gap: 10, marginTop: 10, maxWidth: 640 }}>
            <div className="field">
              <span className="icon" aria-hidden="true">📝</span>
              <input type="number" min="0" max="20" step="0.25" placeholder="Note / 20" value={grade} onChange={e => setGrade(e.target.value)} />
            </div>
            <div className="field" style={{ gridTemplateColumns: '40px 1fr', alignItems: 'start' }}>
              <span className="icon" aria-hidden="true">💬</span>
              <textarea value={comment} placeholder="Commentaire du jury..." onChange={e => setComment(e.target.value)} style={{ width: '100%', minHeight: 90, border: 0, outline: 0, resize: 'vertical', padding: '12px 0 4px', background: 'transparent', fontFamily: 'inherit' }} />
            </div>
            <div className="toolbar" style={{ marginTop: 0 }}>
              <button className="primary" type="button" onClick={onSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              <button className="btn" type="button" onClick={() => setSelectedEmail('')}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
