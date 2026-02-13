import React, { useEffect, useState } from 'react';
import { listStudents, addStudent, deleteStudent } from '../../lib/adminApi.js';

const emptyForm = { user_email: '', student_id: '', first_name: '', last_name: '', level: '', speciality: '', project_title: '' };

export default function AdminStudents() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingEmail, setEditingEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await listStudents();
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to load students list.');
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
    setForm((s) => ({ ...s, [k]: v }));
  }

  function onAdd(ev) {
    ev.preventDefault();
    if (!form.user_email || !form.first_name || !form.last_name) {
      setError('Please fill in email, first name, and last name.');
      return;
    }
    (async () => {
      const r = await addStudent(form);
      if (r.ok) {
        setError('');
        await load();
        setForm(emptyForm);
        setEditingEmail('');
      } else {
        setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to add student.');
      }
    })();
  }

  function onEditRow(row) {
    if (!row || !row.user_email) return;
    setEditingEmail(row.user_email);
    setForm({
      user_email: row.user_email || '',
      student_id: row.student_id || '',
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      level: row.level || '',
      speciality: row.speciality || '',
      project_title: row.project_title || ''
    });
    setShowForm(true);
  }

  function onCancelEdit() {
    setEditingEmail('');
    setForm(emptyForm);
  }

  async function onDelete(email) {
    if (!email) return;
    const ok = confirm(`Delete student ${email}?`);
    if (!ok) return;
    const r = await deleteStudent(email);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to delete student.');
      return;
    }
    setError('');
    await load();
  }

  return (
    <div>
      <h2 className="title">Students</h2>
      <p className="subtitle">Manage the students list and their information</p>
      <div className="toolbar">
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Hide form' : 'Add a student'}
        </button>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onAdd} style={{ marginTop: 12 }}>
          <div className="field">
            <span className="icon" aria-hidden="true">
              ✉️
            </span>
            <input
              placeholder="Email address"
              value={form.user_email}
              onChange={(e) => onChange('user_email', e.target.value)}
              readOnly={!!editingEmail}
            />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              🆔
            </span>
            <input placeholder="Student ID" value={form.student_id} onChange={(e) => onChange('student_id', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              👤
            </span>
            <input placeholder="Last name" value={form.last_name} onChange={(e) => onChange('last_name', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              👤
            </span>
            <input placeholder="First name" value={form.first_name} onChange={(e) => onChange('first_name', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              🎚️
            </span>
            <input placeholder="Level" value={form.level} onChange={(e) => onChange('level', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              📚
            </span>
            <input placeholder="Specialty" value={form.speciality} onChange={(e) => onChange('speciality', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              📝
            </span>
            <input placeholder="Project title" value={form.project_title} onChange={(e) => onChange('project_title', e.target.value)} />
          </div>
          <div className="toolbar" style={{ marginTop: 0 }}>
            <button className="primary" type="submit">
              {editingEmail ? 'Update' : 'Add'}
            </button>
            {editingEmail ? (
              <button className="btn" type="button" onClick={onCancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      )}

      {error && <div className="errors">{error}</div>}

      <div style={{ marginTop: 18, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Student ID</th>
              <th>Last name</th>
              <th>First name</th>
              <th>Level</th>
              <th>Specialty</th>
              <th>Project title</th>
              <th style={{ width: 180 }}>Actions</th>
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
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button className="btn" type="button" onClick={() => onEditRow(r)}>
                        Edit
                      </button>
                      <button className="icon-btn" type="button" onClick={() => onDelete(r.user_email)} aria-label={`Delete ${r.user_email}`}>
                        x
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: 'var(--muted)' }}>
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

