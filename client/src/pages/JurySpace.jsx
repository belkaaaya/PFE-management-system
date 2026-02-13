import React, { useState } from 'react';
import TopLeftBack from '../components/TopLeftBack.jsx';
import JuryStudents from './jury/Students.jsx';
import NotificationsPanel from '../components/NotificationsPanel.jsx';
import SpaceHeader from '../components/SpaceHeader.jsx';

export default function JurySpace({ session, goWelcome, goProfessor }) {
  const teacherEmail = session && session.email;
  const [page, setPage] = useState('jury');

  if (!teacherEmail) {
    return (
      <>
        <TopLeftBack onClick={goWelcome} label="Home" />
        <h1 className="title">Jury Space</h1>
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
        kicker="Jury Space"
        subtitle="Simplified interface - restricted to students you are assigned to as a jury member."
        session={session}
        actions={[
          { id: 'prof', label: 'Professor', icon: 'PR', onClick: goProfessor },
          { id: 'home', label: 'Home', icon: 'HM', onClick: goWelcome },
          { id: 'notifications', label: 'Notifications', icon: 'NTF', onClick: () => setPage('notifications') }
        ]}
      />

      <div className="layout">
        <nav className="admin-nav">
          <div className="nav-brand">
            <div>
              <div className="nav-brand-title">Planner</div>
              <div className="nav-brand-sub">Jury</div>
            </div>
          </div>
          <div className="nav-sep" />

          <div className="admin-nav-list">
            <button className={'admin-nav-btn' + (page === 'jury' ? ' active' : '')} type="button" onClick={() => setPage('jury')}>
              <span className="admin-nav-icon" aria-hidden="true">
                JY
              </span>
              Jury grading
            </button>
            <button
              className={'admin-nav-btn' + (page === 'notifications' ? ' active' : '')}
              type="button"
              onClick={() => setPage('notifications')}
            >
              <span className="admin-nav-icon" aria-hidden="true">
                NTF
              </span>
              Notifications
            </button>
          </div>

          <div className="admin-nav-footer">
            <button className="admin-nav-btn nav-footer-btn" type="button" onClick={goProfessor}>
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
          {page === 'jury' ? <JuryStudents teacherEmail={teacherEmail} /> : <NotificationsPanel email={teacherEmail} />}
        </div>
      </div>
    </>
  );
}
