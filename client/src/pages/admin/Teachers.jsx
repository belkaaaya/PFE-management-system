import React, { useEffect, useState } from 'react';
import {
  listTeachers,
  addTeacher,
  addSupervision,
  deleteTeacher,
  listSupervisions,
  deleteSupervision
} from '../../lib/adminApi.js';

const emptyTeacher = { user_email: '', teacher_id: '', first_name: '', last_name: '', speciality: '' };
const emptyAssign = { student_email: '', teacher_email: '', role: 'supervisor' };

function fmtRole(role) {
  return role === 'jury' ? 'Jury' : 'Supervisor';
}

export default function AdminTeachers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyTeacher);
  const [editingEmail, setEditingEmail] = useState('');
  const [assign, setAssign] = useState(emptyAssign);
  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [lookupEmail, setLookupEmail] = useState('');
  const [supervisions, setSupervisions] = useState([]);
  const [loadingSup, setLoadingSup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await listTeachers();
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to load professors list.');
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

  async function onAdd(ev) {
    ev.preventDefault();
    if (!form.user_email || !form.first_name || !form.last_name) {
      setError('Please fill in email, first name, and last name.');
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
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to add professor.');
      return;
    }

    setError('');
    setForm(emptyTeacher);
    setEditingEmail('');
    await load();
  }

  function onEditRow(row) {
    if (!row || !row.user_email) return;
    setEditingEmail(row.user_email);
    setForm({
      user_email: row.user_email || '',
      teacher_id: row.teacher_id || '',
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      speciality: row.speciality || ''
    });
    setShowForm(true);
  }

  function onCancelEdit() {
    setEditingEmail('');
    setForm(emptyTeacher);
  }

  function onAssignChange(k, v) {
    setAssign((s) => ({ ...s, [k]: v }));
  }

  async function onAssign(ev) {
    ev.preventDefault();
    if (!assign.student_email || !assign.teacher_email) {
      setError('Please fill in the student and professor emails.');
      return;
    }

    const r = await addSupervision(assign);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to save assignment.');
      return;
    }

    setError('');
    setAssign(emptyAssign);
    alert('Assignment saved');
  }

  async function loadSupervisions(email) {
    const e = String(email || '').trim();
    if (!e) {
      setError('Please enter the student email.');
      return;
    }
    setLoadingSup(true);
    const r = await listSupervisions(e);
    setLoadingSup(false);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to load assignments.');
      setSupervisions([]);
      return;
    }
    setError('');
    setSupervisions(Array.isArray(r.data) ? r.data : []);
  }

  async function onDeleteSupervision(row) {
    if (!row || !row.id) return;
    const ok = confirm(`Delete this assignment (${fmtRole(row.role)} — ${row.teacher_email})?`);
    if (!ok) return;
    const r = await deleteSupervision(row.id);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to delete assignment.');
      return;
    }
    setError('');
    await loadSupervisions(lookupEmail);
  }

  async function onDelete(email) {
    if (!email) return;
    const ok = confirm(`Delete professor ${email}?`);
    if (!ok) return;
    const r = await deleteTeacher(email);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to delete professor.');
      return;
    }
    setError('');
    await load();
  }

  return (
    <div>
      <h2 className="title">Professors & juries</h2>
      <p className="subtitle">Manage professors and their assignments (supervision / jury)</p>

      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Hide form' : 'Add professor'}
        </button>
        <button className="btn" onClick={() => setShowAssign((s) => !s)}>
          {showAssign ? 'Hide assignment' : 'Assign supervision/jury'}
        </button>
        <button className="btn" onClick={() => setShowLookup((s) => !s)}>
          {showLookup ? 'Hide assignments' : 'View / delete assignments'}
        </button>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onAdd} style={{ marginTop: 12 }}>
          <div className="field">
            <span className="icon" aria-hidden="true">
              @
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
            <input placeholder="Staff ID" value={form.teacher_id} onChange={(e) => onChange('teacher_id', e.target.value)} />
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
              📚
            </span>
            <input placeholder="Specialty" value={form.speciality} onChange={(e) => onChange('speciality', e.target.value)} />
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

      {showAssign && (
        <form onSubmit={onAssign} style={{ marginTop: 12 }}>
          <div className="field">
            <span className="icon" aria-hidden="true">
              🎓
            </span>
            <input
              placeholder="Student email"
              value={assign.student_email}
              onChange={(e) => onAssignChange('student_email', e.target.value)}
            />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              👩‍🏫
            </span>
            <input
              placeholder="Professor email"
              value={assign.teacher_email}
              onChange={(e) => onAssignChange('teacher_email', e.target.value)}
            />
          </div>
          <div className="field select">
            <span className="icon" aria-hidden="true">
              R
            </span>
            <select value={assign.role} onChange={(e) => onAssignChange('role', e.target.value)}>
              <option value="supervisor">Supervisor</option>
              <option value="jury">Jury</option>
            </select>
            <span className="chevron" aria-hidden="true">
              ▾
            </span>
          </div>
          <button className="primary" type="submit">
            Save assignment
          </button>
        </form>
      )}

      {showLookup && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10, maxWidth: 720 }}>
            <div className="field" style={{ margin: 0 }}>
              <span className="icon" aria-hidden="true">
                🎓
              </span>
              <input placeholder="Student email" value={lookupEmail} onChange={(e) => setLookupEmail(e.target.value)} />
            </div>
            <button className="btn" type="button" onClick={() => loadSupervisions(lookupEmail)} disabled={loadingSup}>
              {loadingSup ? 'Loading...' : 'Load'}
            </button>
          </div>

          <div style={{ marginTop: 12, overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Professor (email)</th>
                  <th style={{ width: 60 }}>X</th>
                </tr>
              </thead>
              <tbody>
                {supervisions.map((s, i) => (
                  <tr key={s.id || i}>
                    <td>{fmtRole(s.role)}</td>
                    <td>{s.teacher_email}</td>
                    <td>
                      <button
                        className="icon-btn"
                        type="button"
                        onClick={() => onDeleteSupervision(s)}
                        aria-label={`Delete assignment ${s.teacher_email}`}
                      >
                        x
                      </button>
                    </td>
                  </tr>
                ))}
                {!supervisions.length && !loadingSup && (
                  <tr>
                    <td colSpan={3} style={{ padding: 14, color: 'var(--muted)' }}>
                      No assignments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && <div className="errors">{error}</div>}

      <div style={{ marginTop: 18, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Staff ID</th>
              <th>Last name</th>
              <th>First name</th>
              <th>Specialty</th>
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
                  <td>{r.teacher_id || ''}</td>
                  <td>{r.last_name || inferredLast}</td>
                  <td>{r.first_name || inferredFirst}</td>
                  <td>{r.speciality || ''}</td>
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
                <td colSpan={6} style={{ padding: 14, color: 'var(--muted)' }}>
                  No professors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

