import React, { useEffect, useState } from 'react';
import { listMyStudents } from '../../lib/professorApi.js';

function fmtDefense(row) {
  if (!row || !row.defense_date) return '-';
  const parts = [row.defense_date, row.defense_time, row.defense_room].filter(Boolean);
  return parts.join(' - ');
}

export default function ProfStudents({ teacherEmail, onMessage }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const r = await listMyStudents({ teacher_email: teacherEmail, role: 'supervisor' });
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Impossible de charger vos etudiants.');
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

  return (
    <div>
      <h2 className="title">Mes etudiants encadres</h2>
      <p className="subtitle">Voir les etudiants, telecharger les rapports et communiquer</p>

      <div className="toolbar">
        <button className="btn" type="button" onClick={load} disabled={loading}>
          {loading ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      {error && <div className="errors">{error}</div>}

      <div style={{ marginTop: 18, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Etudiant</th>
              <th>E-mail</th>
              <th>Titre</th>
              <th>Rapport</th>
              <th>Memoire</th>
              <th>Soutenance</th>
              <th>Note</th>
              <th style={{ width: 140 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.student_email || index}>
                <td>{row.student_name}</td>
                <td>{row.student_email}</td>
                <td>{row.project_title || ''}</td>
                <td>{row.report_url ? <a href={row.report_url} target="_blank" rel="noreferrer">Telecharger</a> : '-'}</td>
                <td>{row.memoire_url ? <a href={row.memoire_url} target="_blank" rel="noreferrer">Telecharger</a> : '-'}</td>
                <td>{fmtDefense(row)}</td>
                <td>{row.eval_grade === null || row.eval_grade === undefined ? '-' : row.eval_grade}</td>
                <td>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => onMessage && onMessage({ email: row.student_email, name: row.student_name })}
                  >
                    Message
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: 'var(--muted)' }}>
                  Aucun etudiant affecte pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
