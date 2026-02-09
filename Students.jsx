import React, { useEffect, useState } from 'react';
import { listStudents, addStudent, deleteStudent } from '../../lib/adminApi.js';

export default function AdminStudents() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ user_email: '', student_id: '', first_name: '', last_name: '', level: '', speciality: '', project_title: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await listStudents();
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible de charger la liste des étudiants.");
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

  function onChange(k, v) {
    setForm(s => ({ ...s, [k]: v }));
  }
  function onAdd(ev) {
    ev.preventDefault();
    if (!form.user_email || !form.first_name || !form.last_name) {
      setError("Veuillez remplir l'e-mail, le prénom et le nom.");
      return;
    }
    (async () => {
      const r = await addStudent(form);
      if (r.ok) {
        setError('');
        await load();
        setForm({ user_email: '', student_id: '', first_name: '', last_name: '', level: '', speciality: '', project_title: '' });
      } else {
        setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible d'ajouter l'étudiant.");
      }
    })();
  }

  async function onDelete(email) {
    if (!email) return;
    const ok = confirm(`Supprimer l'etudiant ${email} ?`);
    if (!ok) return;
    const r = await deleteStudent(email);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible de supprimer l'etudiant.");
      return;
    }
    setError('');
    await load();
  }

  return (
    <div>
      <h2 className="title">Étudiants</h2>
      <p className="subtitle">Gérer la liste des étudiants et leurs informations</p>
      <div className="toolbar">
        <button className="btn" onClick={() => setShowForm(s=>!s)}>{showForm ? 'Masquer le formulaire' : 'Ajouter un étudiant'}</button>
        <button className="btn" onClick={load} disabled={loading}>{loading ? 'Chargement...' : 'Actualiser'}</button>
      </div>
      {showForm && (
        <form onSubmit={onAdd} style={{ marginTop: 12 }}>
          <div className="field">
            <span className="icon" aria-hidden="true">✉️</span>
            <input placeholder="Adresse e-mail" value={form.user_email} onChange={e=>onChange('user_email', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">🆔</span>
            <input placeholder="Matricule" value={form.student_id} onChange={e=>onChange('student_id', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">👤</span>
            <input placeholder="Nom" value={form.last_name} onChange={e=>onChange('last_name', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">👤</span>
            <input placeholder="Prénom" value={form.first_name} onChange={e=>onChange('first_name', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">🎚️</span>
            <input placeholder="Niveau" value={form.level} onChange={e=>onChange('level', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">📚</span>
            <input placeholder="Spécialité" value={form.speciality} onChange={e=>onChange('speciality', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">📝</span>
            <input placeholder="Titre du projet" value={form.project_title} onChange={e=>onChange('project_title', e.target.value)} />
          </div>
          <button className="primary" type="submit">Ajouter</button>
        </form>
      )}
      {error && <div className="errors">{error}</div>}

      <div style={{ marginTop: 18, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>E-mail</th><th>Matricule</th><th>Nom</th><th>Prénom</th><th>Niveau</th><th>Spécialité</th><th>Titre du projet</th><th style={{ width: 60 }}>X</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const parts = String(r.account_name || '').trim().split(/\s+/).filter(Boolean);
              const inferredLast = parts.length ? parts.slice(-1).join(' ') : '';
              const inferredFirst = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
              return (
                <tr key={r.user_email || i}>
                  <td>{r.user_email}</td>
                  <td>{r.student_id || ''}</td>
                  <td>{r.last_name || inferredLast}</td>
                  <td>{r.first_name || inferredFirst}</td>
                  <td>{r.level}</td>
                  <td>{r.speciality}</td>
                  <td>{r.project_title}</td>
                  <td>
                    <button className="icon-btn" type="button" onClick={() => onDelete(r.user_email)} aria-label={`Supprimer ${r.user_email}`}>
                      x
                    </button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: 'var(--muted)' }}>
                  Aucun étudiant trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
