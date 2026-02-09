import React, { useState } from 'react';
import SideNav from '../components/SideNav.jsx';
import TopLeftBack from '../components/TopLeftBack.jsx';
import Dashboard from './student/Dashboard.jsx';
import Report from './student/Report.jsx';
import Messaging from './student/Messaging.jsx';
import Simulator from './student/Simulator.jsx';

export default function StudentSpace({ session, goWelcome }) {
  const [page, setPage] = useState('dashboard');
  const email = session && session.email;

  if (!email) {
    return (
      <>
        <TopLeftBack onClick={goWelcome} label="Accueil" />
        <h1 className="title">Student Space</h1>
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
      <h1 className="title">Student Space</h1>
      <p className="subtitle">Sélectionnez une section</p>
      <div className="layout">
        <SideNav current={page} onSelect={setPage} />
        <div className="panel">
          {page === 'dashboard' ? <Dashboard email={email} /> :
           page === 'report' ? <Report email={email} /> :
           page === 'messaging' ? <Messaging email={email} /> :
           <Simulator />}
        </div>
      </div>
    </>
  );
}
