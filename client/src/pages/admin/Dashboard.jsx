import React, { useEffect, useState } from 'react';
import { getStats } from '../../lib/adminApi.js';

function labelBucket(k) {
  return k === 'tresBien'
    ? 'Excellent (≥ 16)'
    : k === 'bien'
      ? 'Good (≥ 14)'
      : k === 'assezBien'
        ? 'Fairly good (≥ 12)'
        : k === 'passable'
          ? 'Pass (≥ 10)'
          : k === 'insuffisant'
            ? 'Fail (< 10)'
            : k;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await getStats();
        if (!r.ok) {
          setError((r.data && r.data.errors && r.data.errors[0]) || 'Unable to load statistics.');
          setStats(null);
          return;
        }
        setError('');
        setStats(r.data || null);
      } catch (e) {
        setError("Unable to reach the API (start the backend server).");
        setStats(null);
      }
    })();
  }, []);

  const dist = stats && stats.gradeDistribution ? stats.gradeDistribution : null;
  const distKeys = ['tresBien', 'bien', 'assezBien', 'passable', 'insuffisant'];
  const graded = stats ? stats.gradedStudents || 0 : 0;

  return (
    <div>
      <h2 className="title">Overall statistics</h2>
      <p className="subtitle">Overview of defenses, reports, juries, and grades</p>
      {error && <div className="errors">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Total students</p>
          <p className="stat-value">{stats ? stats.totalStudents : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total professors</p>
          <p className="stat-value">{stats ? stats.totalTeachers : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Rooms</p>
          <p className="stat-value">{stats ? stats.rooms : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending reports</p>
          <p className="stat-value">{stats ? stats.pendingReports : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Submitted reports</p>
          <p className="stat-value">{stats ? stats.submittedReports : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Scheduled defenses</p>
          <p className="stat-value">{stats ? stats.scheduledDefenses : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Schedule validated</p>
          <p className="stat-value">{stats && stats.planningValidated ? 'Yes' : 'No'}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Unavailable juries</p>
          <p className="stat-value">{stats ? stats.unavailableJuries : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Graded students</p>
          <p className="stat-value">{stats ? stats.gradedStudents : 0}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Ungraded students</p>
          <p className="stat-value">{stats ? stats.ungradedStudents : 0}</p>
        </div>
      </div>

      {dist && graded > 0 && (
        <div style={{ marginTop: 18 }}>
          <h3 className="title" style={{ fontSize: 16, textAlign: 'left' }}>
            Grade distribution (average)
          </h3>
          <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
            {distKeys.map((k) => {
              const n = Number(dist[k] || 0);
              const pct = graded > 0 ? Math.round((n / graded) * 100) : 0;
              return (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '190px 1fr 56px', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: '#1f2a5a', fontWeight: 700 }}>{labelBucket(k)}</div>
                  <div style={{ height: 10, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#9db4ff' }} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'right' }}>{n}</div>
                </div>
              );
            })}
          </div>
          <p className="subtitle" style={{ textAlign: 'left', marginTop: 10 }}>
            Grades are based on the average of recorded evaluations.
          </p>
        </div>
      )}

      {stats && Array.isArray(stats.unavailableJuryEmails) && stats.unavailableJuryEmails.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h3 className="title" style={{ fontSize: 16, textAlign: 'left' }}>
            Unavailable juries (conflicts)
          </h3>
          <p className="subtitle" style={{ textAlign: 'left' }}>
            {stats.unavailableJuryEmails.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

