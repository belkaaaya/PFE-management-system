import React, { useEffect, useState } from 'react';
import { listTeachers, addTeacher, addSupervision, deleteTeacher } from '../../lib/adminApi.js';

export default function AdminTeachers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ user_email: '', teacher_id: '', first_name: '', last_name: '', speciality: '' });
  const [assign, setAssign] = useState({ student_email: '', teacher_email: '', role: 'supervisor' });
  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await listTeachers();
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible de charger la liste des enseignants.");
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

  async function onAdd(ev) {
    ev.preventDefault();
    if (!form.user_email || !form.first_name || !form.last_name) {
      setError("Veuillez remplir l'e-mail, le prenom et le nom.");
      return;
    }

    const r = await addTeacher({
      user_email: form.user_email,
      teacher_id: form.teacher_id,
      first_name: form.first_name,
      last_name: form.last_name,
      speciality: form.speciality
    });

    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible d'ajouter l'enseignant.");
      return;
    }

    setError('');
    setForm({ user_email: '', teacher_id: '', first_name: '', last_name: '', speciality: '' });
    await load();
  }

  function onAssignChange(k, v) {
    setAssign(s => ({ ...s, [k]: v }));
  }

  async function onAssign(ev) {
    ev.preventDefault();
    if (!assign.student_email || !assign.teacher_email) {
      setError("Veuillez remplir l'e-mail de l'etudiant et de l'enseignant.");
      return;
    }

    const r = await addSupervision(assign);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible d'enregistrer l'affectation.");
      return;
    }

    setError('');
    setAssign({ student_email: '', teacher_email: '', role: 'supervisor' });
    alert('Affectation enregistree');
  }

  async function onDelete(email) {
    if (!email) return;
    const ok = confirm(`Supprimer l'enseignant ${email} ?`);
    if (!ok) return;
    const r = await deleteTeacher(email);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible de supprimer l'enseignant.");
      return;
    }
    setError('');
    await load();
  }

  return (
    <div>
      <h2 className="title">Enseignants & jurys</h2>
      <p className="subtitle">Gerer les enseignants et leurs affectations (encadrement / jury)</p>

      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => setShowForm(s => !s)}>{showForm ? 'Masquer le formulaire' : 'Ajouter un enseignant'}</button>
        <button className="btn" onClick={() => setShowAssign(s => !s)}>{showAssign ? "Masquer l'affectation" : 'Affecter encadrement/jury'}</button>
        <button className="btn" onClick={load} disabled={loading}>{loading ? 'Chargement...' : 'Actualiser'}</button>
      </div>

      {showForm && (
        <form onSubmit={onAdd} style={{ marginTop: 12 }}>
          <div className="field">
            <span className="icon" aria-hidden="true">@</span>
            <input placeholder="Adresse e-mail" value={form.user_email} onChange={e => onChange('user_email', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">#</span>
            <input placeholder="Matricule" value={form.teacher_id} onChange={e => onChange('teacher_id', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">N</span>
            <input placeholder="Nom" value={form.last_name} onChange={e => onChange('last_name', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">P</span>
            <input placeholder="Prenom" value={form.first_name} onChange={e => onChange('first_name', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">S</span>
            <input placeholder="Specialite" value={form.speciality} onChange={e => onChange('speciality', e.target.value)} />
          </div>
          <button className="primary" type="submit">Ajouter</button>
        </form>
      )}

      {showAssign && (
        <form onSubmit={onAssign} style={{ marginTop: 12 }}>
          <div className="field">
            <span className="icon" aria-hidden="true">S</span>
            <input placeholder="E-mail de l'etudiant" value={assign.student_email} onChange={e => onAssignChange('student_email', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">T</span>
            <input placeholder="E-mail de l'enseignant" value={assign.teacher_email} onChange={e => onAssignChange('teacher_email', e.target.value)} />
          </div>
          <div className="field select">
            <span className="icon" aria-hidden="true">R</span>
            <select value={assign.role} onChange={e => onAssignChange('role', e.target.value)}>
              <option value="supervisor">Encadrant</option>
              <option value="jury">Jury</option>
            </select>
            <span className="chevron" aria-hidden="true">v</span>
          </div>
          <button className="primary" type="submit">Enregistrer l'affectation</button>
        </form>
      )}

      {error && <div className="errors">{error}</div>}

      <div style={{ marginTop: 18, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>E-mail</th><th>Matricule</th><th>Nom</th><th>Prenom</th><th>Specialite</th><th style={{ width: 60 }}>X</th>
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
                  <td>{r.teacher_id || ''}</td>
                  <td>{r.last_name || inferredLast}</td>
                  <td>{r.first_name || inferredFirst}</td>
                  <td>{r.speciality || ''}</td>
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
                <td colSpan={6} style={{ padding: 14, color: 'var(--muted)' }}>
                  Aucun enseignant trouve.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
