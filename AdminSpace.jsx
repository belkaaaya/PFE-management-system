import React, { useState } from 'react';
import TopLeftBack from '../components/TopLeftBack.jsx';
import AdminDashboard from './admin/Dashboard.jsx';
import AdminStudents from './admin/Students.jsx';
import AdminTeachers from './admin/Teachers.jsx';
import AdminRooms from './admin/Rooms.jsx';
import AdminSchedule from './admin/Schedule.jsx';

export default function AdminSpace({ goWelcome }) {
  const [page, setPage] = useState('dashboard');
  const items = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'students', label: 'Étudiants', icon: '🎓' },
    { id: 'teachers', label: 'Enseignants & jurys', icon: '👩‍🏫' },
    { id: 'rooms', label: 'Salles', icon: '🏫' },
    { id: 'schedule', label: 'Planning final', icon: '🗓️' },
  ];
  return (
    <>
      <TopLeftBack onClick={goWelcome} label="Accueil" />
      <h1 className="title">Espace Administrateur</h1>
      <p className="subtitle">Gérer les statistiques, utilisateurs, salles et planning</p>
      <div className="layout">
        <nav className="admin-nav">
          <div className="admin-nav-list">
            {items.map(it => (
              <button
                key={it.id}
                className={'admin-nav-btn' + (page === it.id ? ' active' : '')}
                onClick={() => setPage(it.id)}
              >
                <span className="admin-nav-icon" aria-hidden="true">{it.icon}</span>
                {it.label}
              </button>
            ))}
          </div>
        </nav>
        <div className="panel">
          {page === 'dashboard' ? <AdminDashboard /> :
           page === 'students' ? <AdminStudents /> :
           page === 'teachers' ? <AdminTeachers /> :
           page === 'rooms' ? <AdminRooms /> :
           <AdminSchedule />}
        </div>
      </div>
    </>
  );
}
