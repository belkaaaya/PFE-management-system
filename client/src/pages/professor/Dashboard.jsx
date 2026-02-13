import React, { useEffect, useState } from 'react';
import { listMyStudents, getSimulatorCriteria } from '../../lib/professorApi.js';

export default function ProfDashboard({ teacherEmail }) {
  const [stats, setStats] = useState(null);
  const [criteria, setCriteria] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [sup, jury, crit] = await Promise.all([
        listMyStudents({ teacher_email: teacherEmail, role: 'supervisor' }),
        listMyStudents({ teacher_email: teacherEmail, role: 'jury' }),
        getSimulatorCriteria()
      ]);

      if (!sup.ok) {
        setError((sup.data && sup.data.errors && sup.data.errors[0]) || "Impossible de charger vos étudiants.");
        setStats(null);
        setCriteria(null);
        return;
      }

      if (!jury.ok) {
        setError((jury.data && jury.data.errors && jury.data.errors[0]) || "Impossible de charger vos affectations jury.");
        setStats(null);
        setCriteria(null);
        return;
      }

      setError('');
      const supRows = Array.isArray(sup.data) ? sup.data : [];
      const juryRows = Array.isArray(jury.data) ? jury.data : [];
      const pendingReports = supRows.filter(r => (r.report_status || 'not_submitted') !== 'submitted').length;
      const scheduledDefenses = supRows.filter(r => r.defense_date && r.defense_time).length;

      setStats({
        supervised: supRows.length,
        jury: juryRows.length,
        pendingReports,
        scheduledDefenses
      });

      if (crit.ok) setCriteria(crit.data || null);
      else setCriteria(null);
    })();
  }, [teacherEmail]);

  const wr = criteria ? Number(criteria.report_weight) : null;
  const wd = criteria ? Number(criteria.defense_weight) : null;
  const wi = criteria ? Number(criteria.internship_weight) : null;
  const sum = wr !== null && wd !== null && wi !== null ? (wr + wd + wi) : null;
  const pct = (v) => (sum && sum > 0 ? Math.round((v / sum) * 100) : null);

  return (
    <div>
      <h2 className="title">Aperçu</h2>
      <p className="subtitle">Compte: {teacherEmail}</p>
      {error && <div className="errors">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Étudiants encadrés</p>
          <p className="stat-value">{stats ? stats.supervised : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Affectations jury</p>
          <p className="stat-value">{stats ? stats.jury : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Rapports en attente</p>
          <p className="stat-value">{stats ? stats.pendingReports : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Soutenances planifiées</p>
          <p className="stat-value">{stats ? stats.scheduledDefenses : 0}</p>
        </div>
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <p className="stat-label">Critères simulateur (poids)</p>
          <p className="stat-value" style={{ fontSize: 18 }}>
            {criteria ? `Rapport ${pct(wr)}% • Soutenance ${pct(wd)}% • Stage ${pct(wi)}%` : 'Non défini'}
          </p>
        </div>
      </div>
    </div>
  );
}
