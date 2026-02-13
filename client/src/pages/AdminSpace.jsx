import React, { useState } from 'react';
import AdminDashboard from './admin/Dashboard.jsx';
import AdminStudents from './admin/Students.jsx';
import AdminTeachers from './admin/Teachers.jsx';
import AdminRooms from './admin/Rooms.jsx';
import AdminSchedule from './admin/Schedule.jsx';
import AdminReports from './admin/Reports.jsx';
import AdminNotifications from './admin/Notifications.jsx';
import AdminExports from './admin/Exports.jsx';
import SpaceHeader from '../components/SpaceHeader.jsx';

export default function AdminSpace({ session, goWelcome }) {
  const [page, setPage] = useState('dashboard');
  const adminEmail = session && session.email;

  const actions = [
    { id: 'notifications', label: 'Notifications', icon: 'NTF', onClick: () => setPage('notifications') },
    { id: 'exports', label: 'Export PDF / Excel', icon: 'EXP', onClick: () => setPage('exports') },
    { id: 'logout', label: 'Log out', icon: 'OUT', onClick: goWelcome }
  ];

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
    { id: 'students', label: 'Students', icon: 'STD' },
    { id: 'teachers', label: 'Professors & Juries', icon: 'PRF' },
    { id: 'rooms', label: 'Rooms', icon: 'RM' },
    { id: 'schedule', label: 'Schedule', icon: 'SCH' },
    { id: 'reports', label: 'Reports', icon: 'RPT' },
    { id: 'notifications', label: 'Notifications', icon: 'NTF' },
    { id: 'exports', label: 'Export PDF / Excel', icon: 'EXP' }
  ];

  return (
    <>
      <SpaceHeader
        kicker="Administrator Space"
        subtitle="Manage students, professors/juries, rooms, schedules, reports, notifications, stats, and exports."
        session={session}
        actions={actions}
      />

      <div className="layout">
        <nav className="admin-nav">
          <div className="nav-brand">
            <div>
              <div className="nav-brand-title">Planner</div>
              <div className="nav-brand-sub">Administration</div>
            </div>
          </div>
          <div className="nav-sep" />

          <div className="admin-nav-list">
            {items.map((it) => (
              <button
                key={it.id}
                className={'admin-nav-btn' + (page === it.id ? ' active' : '')}
                type="button"
                onClick={() => setPage(it.id)}
              >
                <span className="admin-nav-icon" aria-hidden="true">
                  {it.icon}
                </span>
                {it.label}
              </button>
            ))}
          </div>

          <div className="admin-nav-footer">
            <button className="admin-nav-btn nav-footer-btn" type="button" onClick={() => setPage('dashboard')}>
              <span className="admin-nav-icon" aria-hidden="true">
                PR
              </span>
              Profile
            </button>
            <button className="admin-nav-btn nav-footer-btn" type="button" onClick={goWelcome}>
              <span className="admin-nav-icon" aria-hidden="true">
                OUT
              </span>
              Log out
            </button>
          </div>
        </nav>

        <div className="panel">
          {page === 'dashboard' ? (
            <AdminDashboard />
          ) : page === 'students' ? (
            <AdminStudents />
          ) : page === 'teachers' ? (
            <AdminTeachers />
          ) : page === 'rooms' ? (
            <AdminRooms />
          ) : page === 'schedule' ? (
            <AdminSchedule adminEmail={adminEmail} />
          ) : page === 'reports' ? (
            <AdminReports />
          ) : page === 'notifications' ? (
            <AdminNotifications adminEmail={adminEmail} />
          ) : (
            <AdminExports />
          )}
        </div>
      </div>
    </>
  );
}
