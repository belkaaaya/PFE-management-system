import React, { useEffect, useState } from 'react';
import { listRooms, addRoom, listRoomSlots, addRoomSlot, deleteRoom, deleteRoomSlot } from '../../lib/adminApi.js';

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [slots, setSlots] = useState([]);
  const [roomForm, setRoomForm] = useState({ name: '' });
  const [slotForm, setSlotForm] = useState({ room_name: '', day: '', start: '', end: '' });
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await listRooms();
    const s = await listRoomSlots();

    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Impossible de charger les salles.');
      setRooms([]);
      setSlots([]);
      setLoading(false);
      return;
    }
    if (!s.ok) {
      setError((s.data && s.data.errors && s.data.errors[0]) || 'Impossible de charger les créneaux.');
      setRooms(Array.isArray(r.data) ? r.data : []);
      setSlots([]);
      setLoading(false);
      return;
    }

    setError('');
    setRooms(Array.isArray(r.data) ? r.data : []);
    setSlots(Array.isArray(s.data) ? s.data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function onRoomChange(k, v) {
    setRoomForm(s => ({ ...s, [k]: v }));
  }
  function onAddRoom(ev) {
    ev.preventDefault();
    if (!roomForm.name) return;
    (async () => {
      const r = await addRoom({ name: roomForm.name });
      if (r.ok) {
        await load();
        setRoomForm({ name: '' });
      } else {
        setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible d'ajouter la salle.");
      }
    })();
  }
  function onSlotChange(k, v) {
    setSlotForm(s => ({ ...s, [k]: v }));
  }
  function onAddSlot(ev) {
    ev.preventDefault();
    const { room_name, day, start, end } = slotForm;
    if (!room_name || !day || !start || !end) return;
    (async () => {
      const r = await addRoomSlot({ room_name, day, start, end });
      if (r.ok) {
        await load();
        setSlotForm({ room_name: '', day: '', start: '', end: '' });
      } else {
        setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible d'ajouter le créneau.");
      }
    })();
  }

  async function onDeleteRoomRow(room) {
    if (!room || !room.id) return;
    const ok = confirm(`Supprimer la salle "${room.name}" ?`);
    if (!ok) return;
    const r = await deleteRoom(room.id);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Impossible de supprimer la salle.');
      return;
    }
    setError('');
    await load();
  }

  async function onDeleteSlotRow(slot) {
    if (!slot || !slot.id) return;
    const ok = confirm(`Supprimer le créneau ${slot.room_name} (${slot.day} ${slot.start}-${slot.end}) ?`);
    if (!ok) return;
    const r = await deleteRoomSlot(slot.id);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || 'Impossible de supprimer le créneau.');
      return;
    }
    setError('');
    await load();
  }

  return (
    <div>
      <h2 className="title">Salles & disponibilités</h2>
      <p className="subtitle">Gérer les salles et les créneaux disponibles</p>
      <div className="toolbar">
        <button className="btn" onClick={()=>setShowRoomForm(s=>!s)}>{showRoomForm ? 'Masquer le formulaire' : 'Ajouter une salle'}</button>
        <button className="btn" onClick={()=>setShowSlotForm(s=>!s)}>{showSlotForm ? 'Masquer le formulaire' : 'Ajouter un créneau'}</button>
        <button className="btn" onClick={load} disabled={loading}>{loading ? 'Chargement...' : 'Actualiser'}</button>
      </div>
      {error && <div className="errors">{error}</div>}
      {showRoomForm && (
        <form onSubmit={onAddRoom} style={{ marginTop: 12 }}>
          <div className="field">
            <span className="icon" aria-hidden="true">🏫</span>
            <input placeholder="Nom de la salle" value={roomForm.name} onChange={e=>onRoomChange('name', e.target.value)} />
          </div>
          <button className="primary" type="submit">Ajouter</button>
        </form>
      )}

      {showSlotForm && (
        <form onSubmit={onAddSlot} style={{ marginTop: 12 }}>
          {rooms.length ? (
            <div className="field select">
              <span className="icon" aria-hidden="true">🏫</span>
              <select value={slotForm.room_name} onChange={e=>onSlotChange('room_name', e.target.value)} required>
                <option value="">Choisir une salle</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
              <span className="chevron" aria-hidden="true">▾</span>
            </div>
          ) : (
            <div className="field">
              <span className="icon" aria-hidden="true">🏫</span>
              <input placeholder="Nom de la salle" value={slotForm.room_name} onChange={e=>onSlotChange('room_name', e.target.value)} />
            </div>
          )}
          <div className="field">
            <span className="icon" aria-hidden="true">📅</span>
            <input placeholder="Date (YYYY-MM-DD)" value={slotForm.day} onChange={e=>onSlotChange('day', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">⏰</span>
            <input placeholder="Début (HH:MM)" value={slotForm.start} onChange={e=>onSlotChange('start', e.target.value)} />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">⏱️</span>
            <input placeholder="Fin (HH:MM)" value={slotForm.end} onChange={e=>onSlotChange('end', e.target.value)} />
          </div>
          <button className="primary" type="submit">Ajouter le créneau</button>
        </form>
      )}

      <div style={{ marginTop: 18, display: 'grid', gap: 18 }}>
        <div style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Salles</th><th style={{ width: 60 }}>X</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>
                    <button className="icon-btn" type="button" onClick={() => onDeleteRoomRow(r)} aria-label={`Supprimer ${r.name}`}>
                      x
                    </button>
                  </td>
                </tr>
              ))}
              {!rooms.length && !loading && (
                <tr>
                  <td colSpan={2} style={{ padding: 14, color: 'var(--muted)' }}>Aucune salle.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ overflow: 'auto' }}>
          <table className="data-table">
          <thead>
            <tr>
              <th>Salle</th><th>Date</th><th>Début</th><th>Fin</th><th>Réservé par</th><th style={{ width: 60 }}>X</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr key={s.id}>
                <td>{s.room_name}</td>
                <td>{s.day}</td>
                <td>{s.start}</td>
                <td>{s.end}</td>
                <td>{s.reserved_by || ''}</td>
                <td>
                  <button className="icon-btn" type="button" onClick={() => onDeleteSlotRow(s)} aria-label={`Supprimer créneau ${s.room_name} ${s.day} ${s.start}-${s.end}`}>
                    x
                  </button>
                </td>
              </tr>
            ))}
            {!slots.length && !loading && (
              <tr>
                <td colSpan={6} style={{ padding: 14, color: 'var(--muted)' }}>
                  Aucun créneau disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
