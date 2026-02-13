import React, { useState } from 'react';
import ProfDashboard from './professor/Dashboard.jsx';
import ProfStudents from './professor/Students.jsx';
import ProfSchedule from './professor/Schedule.jsx';
import ProfMessaging from './professor/Messaging.jsx';
import ProfCriteria from './professor/SimulatorCriteria.jsx';
import ProfNotifications from './professor/Notifications.jsx';
import SpaceHeader from '../components/SpaceHeader.jsx';
import TopLeftBack from '../components/TopLeftBack.jsx';

export default function ProfessorSpace({ session, goWelcome, goJury }) {
  const teacherEmail = session && session.email;
  const [page, setPage] = useState('students');
  const [chatPeer, setChatPeer] = useState(null);

  const items = [
    { id: 'students', label: 'My students', icon: '🎓' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'messaging', label: 'Messages', icon: '💬' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'criteria', label: 'Simulator criteria', icon: '⚖️' },
    { id: 'dashboard', label: 'Overview', icon: '📊' }
  ];

  function openChat(peer) {
    setChatPeer(peer);
    setPage('messaging');
  }

  if (!teacherEmail) {
    return (
      <>
        <TopLeftBack onClick={goWelcome} label="Home" />
        <h1 className="title">Professor Space</h1>
        <p className="subtitle">Missing session. Please sign in again.</p>
        <p className="signin" style={{ marginTop: 8 }}>
          <a
            href="#"
            onClick={(ev) => {
              ev.preventDefault();
              goWelcome();
            }}
          >
            Back
          </a>
        </p>
      </>
    );
  }

  return (
    <>
      <SpaceHeader
        kicker="Professor Space"
        subtitle="Supervise, schedule, communicate, view notifications, and grade."
        session={session}
        actions={[
          { id: 'jury', label: 'Jury access', icon: '🧑‍⚖️', onClick: goJury },
          { id: 'notifications', label: 'Notifications', icon: '🔔', onClick: () => setPage('notifications') },
          { id: 'logout', label: 'Log out', icon: '⎋', onClick: goWelcome }
        ]}
      />

      <div className="layout">
        <nav className="admin-nav">
          <div className="nav-brand">
            <div>
              <div className="nav-brand-title">Planner</div>
              <div className="nav-brand-sub">Professor</div>
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
            <ProfDashboard teacherEmail={teacherEmail} />
          ) : page === 'students' ? (
            <ProfStudents teacherEmail={teacherEmail} onMessage={openChat} />
          ) : page === 'schedule' ? (
            <ProfSchedule teacherEmail={teacherEmail} />
          ) : page === 'notifications' ? (
            <ProfNotifications teacherEmail={teacherEmail} />
          ) : page === 'criteria' ? (
            <ProfCriteria teacherEmail={teacherEmail} />
          ) : (
            <ProfMessaging teacherEmail={teacherEmail} initialPeer={chatPeer} />
          )}
        </div>
      </div>
    </>
  );
}
