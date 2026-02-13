import React, { useState } from 'react';
import SideNav from '../components/SideNav.jsx';
import TopLeftBack from '../components/TopLeftBack.jsx';
import Dashboard from './student/Dashboard.jsx';
import Report from './student/Report.jsx';
import Messaging from './student/Messaging.jsx';
import StudentNotifications from './student/Notifications.jsx';
import Simulator from './student/Simulator.jsx';
import SpaceHeader from '../components/SpaceHeader.jsx';

export default function StudentSpace({ session, goWelcome }) {
  const [page, setPage] = useState('dashboard');
  const email = session && session.email;

  if (!email) {
    return (
      <>
        <TopLeftBack onClick={goWelcome} label="Home" />
        <h1 className="title">Student Space</h1>
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
        kicker="Student Space"
        subtitle="Access your defense, documents, messages, and notifications."
        session={session}
        actions={[
          { id: 'notifications', label: 'Notifications', icon: '🔔', onClick: () => setPage('notifications') },
          { id: 'messaging', label: 'Messages', icon: '💬', onClick: () => setPage('messaging') },
          { id: 'logout', label: 'Log out', icon: '⎋', onClick: goWelcome }
        ]}
      />

      <div className="layout">
        <SideNav current={page} onSelect={setPage} onLogout={goWelcome} />
        <div className="panel">
          {page === 'dashboard' ? (
            <Dashboard email={email} />
          ) : page === 'report' ? (
            <Report email={email} />
          ) : page === 'messaging' ? (
            <Messaging email={email} />
          ) : page === 'notifications' ? (
            <StudentNotifications email={email} />
          ) : (
            <Simulator />
          )}
        </div>
      </div>
    </>
  );
}
