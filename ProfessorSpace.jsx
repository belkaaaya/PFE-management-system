import React, { useState } from 'react';
import TopLeftBack from '../components/TopLeftBack.jsx';
import ProfDashboard from './professor/Dashboard.jsx';
import ProfStudents from './professor/Students.jsx';
import ProfSchedule from './professor/Schedule.jsx';
import ProfMessaging from './professor/Messaging.jsx';
import ProfCriteria from './professor/SimulatorCriteria.jsx';

export default function ProfessorSpace({ session, goWelcome, goJury }) {
  const teacherEmail = session && session.email;
  const [page, setPage] = useState('students');
  const [chatPeer, setChatPeer] = useState(null);

  const items = [
    { id: 'students', label: 'Mes étudiants', icon: '🎓' },
    { id: 'schedule', label: 'Planning', icon: '🗓️' },
    { id: 'messaging', label: 'Messagerie', icon: '💬' },
    { id: 'criteria', label: 'Critères simulateur', icon: '⚖️' },
    { id: 'dashboard', label: 'Aperçu', icon: '📊' },
  ];

  function openChat(peer) {
    setChatPeer(peer);
    setPage('messaging');
  }

  if (!teacherEmail) {
    return (
      <>
        <TopLeftBack onClick={goWelcome} label="Accueil" />
        <h1 className="title">Espace Enseignant</h1>
        <p className="subtitle">Session manquante. Veuillez vous reconnecter.</p>
        <p className="signin" style={{ marginTop: 8 }}>
          <a href="#" onClick={(ev)=>{ev.preventDefault(); goWelcome();}}>Retour</a>
        </p>
      </>
    );
  }

  return (
    <>
      <TopLeftBack onClick={goWelcome} label="Accueil" />
      <div className="top-right-actions">
        <button className="back-btn" type="button" onClick={goJury}>
          <span aria-hidden="true">🧑‍⚖️</span>
          <span>Accès Jury</span>
        </button>
      </div>
      <h1 className="title">Espace Enseignant (Encadrant)</h1>
      <p className="subtitle">Encadrer, planifier, communiquer et noter</p>
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
          {page === 'dashboard' ? <ProfDashboard teacherEmail={teacherEmail} /> :
           page === 'students' ? <ProfStudents teacherEmail={teacherEmail} onMessage={openChat} /> :
           page === 'schedule' ? <ProfSchedule teacherEmail={teacherEmail} /> :
           page === 'criteria' ? <ProfCriteria teacherEmail={teacherEmail} /> :
           <ProfMessaging teacherEmail={teacherEmail} initialPeer={chatPeer} />}
        </div>
      </div>
    </>
  );
}
