import React, { useEffect, useState } from 'react';
import { getStats } from '../../lib/adminApi.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const r = await getStats();
        if (!r.ok) {
          setError((r.data && r.data.errors && r.data.errors[0]) || 'Impossible de charger les statistiques.');
          setStats(null);
          return;
        }
        setError('');
        setStats(r.data || null);
      } catch (e) {
        setError("Impossible de joindre l'API (démarrez le serveur backend).");
        setStats(null);
      }
    })();
  }, []);
  return (
    <div>
      <h2 className="title">Statistiques globales</h2>
      <p className="subtitle">Aperçu des étudiants, enseignants, salles et soutenances</p>
      {error && <div className="errors">{error}</div>}
      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Total étudiants</p>
          <p className="stat-value">{stats ? stats.totalStudents : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total enseignants</p>
          <p className="stat-value">{stats ? stats.totalTeachers : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Salles</p>
          <p className="stat-value">{stats ? stats.rooms : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Rapports en attente</p>
          <p className="stat-value">{stats ? stats.pendingReports : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Rapports soumis</p>
          <p className="stat-value">{stats ? stats.submittedReports : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Soutenances planifiées</p>
          <p className="stat-value">{stats ? stats.scheduledDefenses : 0}</p>
        </div>
      </div>
    </div>
  );
}
