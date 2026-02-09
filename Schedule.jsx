import React, { useEffect, useState } from 'react';
import { listSchedule, autoGenerateSchedule, deleteSchedule } from '../../lib/adminApi.js';

export default function AdminSchedule() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await listSchedule();
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible de charger le planning.");
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
  }, []);

  async function onAuto() {
    setLoading(true);
    const r = await autoGenerateSchedule();
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible de générer automatiquement le planning.");
      setLoading(false);
      return;
    }

    const createdCount = Array.isArray(r.data && r.data.created) ? r.data.created.length : 0;
    if (!createdCount) {
      setError("Aucune soutenance n'a pu être générée. Vérifiez les créneaux (Salles) et les affectations (Enseignants & jurys).");
    } else {
      setError('');
      alert(`Planning généré : ${createdCount} soutenance(s).`);
    }
    await load();
  }

  async function onDelete(row) {
    const email = row && row.student_email;
    if (!email) {
      setError("Impossible de supprimer cette ligne (email manquant).");
      return;
    }
    const ok = confirm(`Supprimer la soutenance de ${email} ?`);
    if (!ok) return;
    const r = await deleteSchedule(email);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Impossible de supprimer la soutenance.');
      return;
    }
    setError('');
    await load();
  }

  return (
    <div>
      <h2 className="title">Planning final des soutenances</h2>
      <p className="subtitle">Gérer les dates, salles, participants et sujets</p>
      <div className="toolbar">
        <button className="primary" type="button" onClick={onAuto} disabled={loading}>Générer automatiquement</button>
        <button className="btn" type="button" onClick={load} disabled={loading}>{loading ? 'Chargement...' : 'Actualiser'}</button>
      </div>
      {error && <div className="errors">{error}</div>}

      <div style={{ marginTop: 18, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th><th>Horaire</th><th>Salle</th><th>Étudiant</th><th>Encadrants</th><th>Jury</th><th>Titre</th><th style={{ width: 60 }}>X</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.student_email || i}-${r.day}-${r.time || ''}`}>
                <td>{r.day}</td>
                <td>{r.time || ''}</td>
                <td>{r.room}</td>
                <td>{r.student}</td>
                <td>{Array.isArray(r.supervisors) ? r.supervisors.join(', ') : r.supervisors}</td>
                <td>{Array.isArray(r.juries) ? r.juries.join(', ') : r.juries}</td>
                <td>{r.title}</td>
                <td>
                  <button className="icon-btn" type="button" onClick={() => onDelete(r)} aria-label={`Supprimer soutenance ${r.student}`}>
                    x
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: 'var(--muted)' }}>
                  Aucun planning généré pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
