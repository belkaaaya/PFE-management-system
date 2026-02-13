import React, { useEffect, useMemo, useState } from 'react';
import {
  listSchedule,
  autoGenerateSchedule,
  deleteSchedule,
  listRoomSlots,
  rescheduleDefense,
  getPlanningStatus,
  setPlanningStatus
} from '../../lib/adminApi.js';

function fmtSlotLabel(s) {
  if (!s) return '';
  return `${s.day} ${s.start}-${s.end} — ${s.room_name}`;
}

function fmtPlanningStatus(s) {
  if (!s || !s.validated) return 'Draft';
  return 'Validated';
}

export default function AdminSchedule({ adminEmail }) {
  const [rows, setRows] = useState([]);
  const [slots, setSlots] = useState([]);
  const [planning, setPlanning] = useState({ validated: false, validated_at: null, validated_by: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [editingEmail, setEditingEmail] = useState('');
  const [slotId, setSlotId] = useState('');

  const editingRow = useMemo(() => rows.find((r) => r.student_email === editingEmail) || null, [rows, editingEmail]);

  const availableSlots = useMemo(() => {
    if (!editingRow) return [];
    const email = editingRow.student_email;
    return (Array.isArray(slots) ? slots : [])
      .filter((s) => !s.reserved_by || s.reserved_by === email)
      .sort(
        (a, b) =>
          String(a.day).localeCompare(String(b.day)) ||
          String(a.start).localeCompare(String(b.start)) ||
          String(a.room_name).localeCompare(String(b.room_name))
      );
  }, [slots, editingRow]);

  async function load() {
    setLoading(true);

    const [r, s, p] = await Promise.all([listSchedule(), listRoomSlots(), getPlanningStatus()]);

    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to load schedule.');
      setRows([]);
      setSlots([]);
      setPlanning({ validated: false, validated_at: null, validated_by: null });
      setLoading(false);
      return;
    }
    if (!s.ok) {
      setError((s.data && s.data.errors && s.data.errors[0]) || 'Unable to load time slots.');
      setRows(Array.isArray(r.data) ? r.data : []);
      setSlots([]);
      setPlanning(p && p.ok ? p.data || planning : planning);
      setLoading(false);
      return;
    }

    setError('');
    setRows(Array.isArray(r.data) ? r.data : []);
    setSlots(Array.isArray(s.data) ? s.data : []);
    setPlanning(
      p && p.ok ? p.data || { validated: false, validated_at: null, validated_by: null } : { validated: false, validated_at: null, validated_by: null }
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!editingRow) return;
    const current = editingRow.slot_id ? String(editingRow.slot_id) : '';
    setSlotId(current);
  }, [editingEmail]);

  async function onAuto() {
    setLoading(true);
    const r = await autoGenerateSchedule();
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to auto-generate the schedule.');
      setLoading(false);
      return;
    }

    const createdCount = Array.isArray(r.data && r.data.created) ? r.data.created.length : 0;
    if (!createdCount) {
      setError('No defense could be generated. Check time slots (Rooms) and assignments (Professors & juries).');
    } else {
      setError('');
      alert(`Schedule generated: ${createdCount} defense(s).`);
    }
    await load();
  }

  async function onToggleValidate() {
    const next = !planning.validated;
    const r = await setPlanningStatus({ validated: next, validated_by: adminEmail || '' });
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to update schedule status.');
      return;
    }
    setError('');
    const p = await getPlanningStatus();
    if (p.ok) setPlanning(p.data || planning);
  }

  async function onReschedule() {
    if (!editingRow) return;
    const id = Number(slotId);
    if (!Number.isInteger(id)) {
      setError('Please select a time slot.');
      return;
    }
    const r = await rescheduleDefense({ student_email: editingRow.student_email, slot_id: id });
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to update defense.');
      return;
    }
    setError('');
    setEditingEmail('');
    setSlotId('');
    await load();
    alert('Defense updated');
  }

  async function onDelete(row) {
    const email = row && row.student_email;
    if (!email) {
      setError('Unable to delete this row (missing email).');
      return;
    }
    const ok = confirm(`Delete defense for ${email}?`);
    if (!ok) return;
    const r = await deleteSchedule(email);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to delete defense.');
      return;
    }
    setError('');
    await load();
  }

  return (
    <div>
      <h2 className="title">Defense schedule</h2>
      <p className="subtitle">Validate, edit, and generate the schedule (time slots, rooms, participants)</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 10 }}>
        <div style={{ padding: '8px 12px', borderRadius: 999, border: '1px solid #d6d9e3', background: 'rgba(255,255,255,0.74)' }}>
          <span style={{ fontWeight: 800, color: '#1f2a5a' }}>Status:</span>{' '}
          <span style={{ fontWeight: 700 }}>{fmtPlanningStatus(planning)}</span>
          {planning.validated_at ? (
            <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
              ({new Date(Number(planning.validated_at)).toLocaleString()}
              {planning.validated_by ? ` — ${planning.validated_by}` : ''})
            </span>
          ) : null}
        </div>
        <button className={planning.validated ? 'btn' : 'primary'} type="button" onClick={onToggleValidate}>
          {planning.validated ? 'Set as draft' : 'Validate schedule'}
        </button>
      </div>

      <div className="toolbar">
        <button className="primary" type="button" onClick={onAuto} disabled={loading}>
          Auto-generate
        </button>
        <button className="btn" type="button" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="errors">{error}</div>}

      {editingRow && (
        <div style={{ marginTop: 14, border: '1px solid #d6d9e3', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.74)' }}>
          <p className="subtitle" style={{ textAlign: 'left', margin: 0 }}>
            Edit defense — {editingRow.student} ({editingRow.student_email})
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 10 }}>
            <div className="field select" style={{ margin: 0 }}>
              <span className="icon" aria-hidden="true">
                🗓️
              </span>
              <select value={slotId} onChange={(e) => setSlotId(e.target.value)}>
                <option value="">Choose a time slot (date / time / room)</option>
                {availableSlots.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {fmtSlotLabel(s)}
                    {s.reserved_by && s.reserved_by === editingRow.student_email ? ' (already reserved)' : ''}
                  </option>
                ))}
              </select>
              <span className="chevron" aria-hidden="true">
                ▾
              </span>
            </div>
          </div>
          <div className="toolbar" style={{ marginTop: 12 }}>
            <button className="primary" type="button" onClick={onReschedule}>
              Save
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                setEditingEmail('');
                setSlotId('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Room</th>
              <th>Student</th>
              <th>Supervisors</th>
              <th>Jury</th>
              <th>Title</th>
              <th style={{ width: 180 }}>Actions</th>
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
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button className="btn" type="button" onClick={() => setEditingEmail(r.student_email)}>
                      Edit
                    </button>
                    <button className="icon-btn" type="button" onClick={() => onDelete(r)} aria-label={`Delete defense ${r.student}`}>
                      x
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: 14, color: 'var(--muted)' }}>
                  No schedule generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

