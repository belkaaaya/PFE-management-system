import React, { useState } from 'react';
import TopLeftBack from '../components/TopLeftBack.jsx';
import JuryStudents from './jury/Students.jsx';

export default function JurySpace({ session, goWelcome, goProfessor }) {
  const teacherEmail = session && session.email;
  const [page, setPage] = useState('jury');

  if (!teacherEmail) {
    return (
      <>
        <TopLeftBack onClick={goWelcome} label="Accueil" />
        <h1 className="title">Espace Jury</h1>
        <p className="subtitle">Session manquante. Veuillez vous reconnecter.</p>
        <p className="signin" style={{ marginTop: 8 }}>
          <a href="#" onClick={(ev)=>{ev.preventDefault(); goWelcome();}}>Retour</a>
        </p>
      </>
    );
  }

  return (
    <>
      <TopLeftBack onClick={goProfessor} label="Encadrant" />
      <div className="top-right-actions">
        <button className="back-btn" type="button" onClick={goWelcome}>
          <span aria-hidden="true">🏠</span>
          <span>Accueil</span>
        </button>
      </div>
      <h1 className="title">Espace Jury</h1>
      <p className="subtitle">Interface simplifiée — accès restreint aux étudiants dont vous êtes jury</p>
      <div className="layout">
        <nav className="admin-nav">
          <div className="admin-nav-list">
            <button
              className={'admin-nav-btn' + (page === 'jury' ? ' active' : '')}
              onClick={() => setPage('jury')}
            >
              <span className="admin-nav-icon" aria-hidden="true">🧑‍⚖️</span>
              Notation jury
            </button>
          </div>
        </nav>
        <div className="panel">
          <JuryStudents teacherEmail={teacherEmail} />
        </div>
      </div>
    </>
  );
}
