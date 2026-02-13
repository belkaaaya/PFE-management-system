import React, { useEffect, useMemo, useState } from 'react';
import { getSimulatorCriteria, setSimulatorCriteria } from '../../lib/professorApi.js';

export default function ProfCriteria({ teacherEmail }) {
  const [form, setForm] = useState({ report_weight: '0.4', defense_weight: '0.3', internship_weight: '0.3' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await getSimulatorCriteria();
      if (!r.ok) {
        setError((r.data && r.data.errors && r.data.errors[0]) || 'Impossible de charger les critères.');
        setLoading(false);
        return;
      }
      setError('');
      const c = r.data || {};
      setForm({
        report_weight: String(c.report_weight ?? 0.4),
        defense_weight: String(c.defense_weight ?? 0.3),
        internship_weight: String(c.internship_weight ?? 0.3),
      });
      setLoading(false);
    })();
  }, []);

  const sum = useMemo(() => {
    const rw = Number(form.report_weight);
    const dw = Number(form.defense_weight);
    const iw = Number(form.internship_weight);
    if (![rw, dw, iw].every(Number.isFinite)) return null;
    return rw + dw + iw;
  }, [form]);

  function pct(v) {
    if (!sum || sum <= 0) return 0;
    return Math.round((Number(v) / sum) * 100);
  }

  async function onSave() {
    const rw = Number(form.report_weight);
    const dw = Number(form.defense_weight);
    const iw = Number(form.internship_weight);
    if (![rw, dw, iw].every(n => Number.isFinite(n) && n >= 0)) {
      setError('Veuillez saisir des nombres valides (>= 0).');
      return;
    }
    if (rw + dw + iw <= 0) {
      setError('La somme des poids doit être > 0.');
      return;
    }
    setSaving(true);
    const r = await setSimulatorCriteria({ report_weight: rw, defense_weight: dw, internship_weight: iw, updated_by: teacherEmail });
    setSaving(false);
    if (!r.ok) {
      setError((r.data && r.data.errors && r.data.errors[0]) || "Impossible d'enregistrer les critères.");
      return;
    }
    setError('');
    alert('Critères enregistrés');
  }

  if (loading) return <p className="subtitle">Chargement…</p>;

  return (
    <div>
      <h2 className="title">Critères du simulateur</h2>
      <p className="subtitle">Définir et ajuster les poids (la somme peut être 1 ou 100)</p>

      {error && <div className="errors">{error}</div>}

      <div style={{ display: 'grid', gap: 10, maxWidth: 520, marginTop: 14 }}>
        <div className="field">
          <span className="icon" aria-hidden="true">📝</span>
          <input
            type="number"
            step="0.01"
            value={form.report_weight}
            onChange={e => setForm(s => ({ ...s, report_weight: e.target.value }))}
            placeholder="Poids rapport"
          />
        </div>
        <div className="field">
          <span className="icon" aria-hidden="true">🎤</span>
          <input
            type="number"
            step="0.01"
            value={form.defense_weight}
            onChange={e => setForm(s => ({ ...s, defense_weight: e.target.value }))}
            placeholder="Poids soutenance"
          />
        </div>
        <div className="field">
          <span className="icon" aria-hidden="true">🏢</span>
          <input
            type="number"
            step="0.01"
            value={form.internship_weight}
            onChange={e => setForm(s => ({ ...s, internship_weight: e.target.value }))}
            placeholder="Poids stage"
          />
        </div>
        <p className="subtitle" style={{ textAlign: 'left', margin: '4px 0 0' }}>
          Total: {sum === null ? '—' : sum.toFixed(2)} • Normalisé: Rapport {pct(form.report_weight)}% • Soutenance {pct(form.defense_weight)}% • Stage {pct(form.internship_weight)}%
        </p>
        <button className="primary" type="button" onClick={onSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </div>
  );
}
