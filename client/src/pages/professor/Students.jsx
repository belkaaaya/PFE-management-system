import React, { useEffect, useMemo, useState } from 'react';
import { listMyStudents, saveEvaluation } from '../../lib/professorApi.js';

function fmtDefense(r) {
  if (!r || !r.defense_date) return '-';
  const parts = [r.defense_date, r.defense_time, r.defense_room].filter(Boolean);
  return parts.join(' — ');
}

export default function ProfStudents({ teacherEmail, onMessage }) {
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
    const r = await listMyStudents({ teacher_email: teacherEmail, role: 'supervisor' });
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible de charger vos étudiants.");
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
      evaluator_role: 'supervisor',
      grade: g,
      comment
    });
    setSaving(false);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible d'enregistrer la note.");
      return;
    }
    setError('');
    await load();
    alert('Note enregistrée');
  }

  return (
    <div>
      <h2 className="title">Mes étudiants encadrés</h2>
      <p className="subtitle">Voir les étudiants, télécharger les rapports, communiquer et noter</p>

      <div className="toolbar">
        <button className="btn" type="button" onClick={load} disabled={loading}>{loading ? 'Chargement...' : 'Actualiser'}</button>
      </div>

      {error && <div className="errors">{error}</div>}

      <div style={{ marginTop: 18, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Étudiant</th><th>E-mail</th><th>Titre</th><th>Rapport</th><th>Mémoire</th><th>Soutenance</th><th>Note</th><th style={{ width: 170 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.student_email || i} style={{ background: selectedEmail === r.student_email ? '#f3f6ff' : undefined }}>
                <td>{r.student_name}</td>
                <td>{r.student_email}</td>
                <td>{r.project_title || ''}</td>
                <td>
                  {r.report_url ? <a href={r.report_url} target="_blank" rel="noreferrer">Télécharger</a> : '-'}
                </td>
                <td>
                  {r.memoire_url ? <a href={r.memoire_url} target="_blank" rel="noreferrer">Télécharger</a> : '-'}
                </td>
                <td>{fmtDefense(r)}</td>
                <td>{r.eval_grade === null || r.eval_grade === undefined ? '-' : r.eval_grade}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button className="btn" type="button" onClick={() => setSelectedEmail(r.student_email)}>Noter</button>
                    <button className="btn" type="button" onClick={() => onMessage && onMessage({ email: r.student_email, name: r.student_name })}>Message</button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: 'var(--muted)' }}>
                  Aucun étudiant affecté pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={{ marginTop: 16 }}>
          <h3 className="title" style={{ fontSize: 16, textAlign: 'left' }}>
            Notation — {selected.student_name} ({selected.student_email})
          </h3>
          <div style={{ display: 'grid', gap: 10, marginTop: 10, maxWidth: 640 }}>
            <div className="field">
              <span className="icon" aria-hidden="true">📝</span>
              <input type="number" min="0" max="20" step="0.25" placeholder="Note / 20" value={grade} onChange={e => setGrade(e.target.value)} />
            </div>
            <div className="field" style={{ gridTemplateColumns: '40px 1fr', alignItems: 'start' }}>
              <span className="icon" aria-hidden="true">💬</span>
              <textarea value={comment} placeholder="Commentaire / validation..." onChange={e => setComment(e.target.value)} style={{ width: '100%', minHeight: 90, border: 0, outline: 0, resize: 'vertical', padding: '12px 0 4px', background: 'transparent', fontFamily: 'inherit' }} />
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
