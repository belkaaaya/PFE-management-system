import React, { useState, useEffect } from 'react';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Welcome from './pages/Welcome.jsx';
import StudentSpace from './pages/StudentSpace.jsx';
import AdminSpace from './pages/AdminSpace.jsx';
import ProfessorSpace from './pages/ProfessorSpace.jsx';
import JurySpace from './pages/JurySpace.jsx';

export default function App() {
  const [page, setPage] = useState('welcome');
  const [session, setSession] = useState(null);
  useEffect(() => {
    const noScroll = page === 'welcome' || page.endsWith('-space');
    document.body.classList.toggle('no-scroll', noScroll);
    return () => document.body.classList.remove('no-scroll');
  }, [page]);

  function logout() {
    setSession(null);
    setPage('welcome');
  }

  function onLoggedIn(s) {
    setSession(s);
    if (s && s.role === 'student') setPage('student-space');
    else if (s && s.role === 'administrator') setPage('admin-space');
    else if (s && s.role === 'professor') setPage('professor-space');
    else setPage('welcome');
  }

  return (
    <>
      {(page === 'welcome' || page === 'login' || page === 'signup') && <div className="bg"></div>}
      {(page === 'student-space' || page === 'admin-space' || page === 'professor-space' || page === 'jury-space') && <div className="bg-left"></div>}
      <main className="container">
        <section className={'app' + (page.endsWith('-space') ? ' app-space' : '')}>
          {(page === 'student-space' || page === 'admin-space' || page === 'professor-space' || page === 'jury-space') && (
            <img className="logo app-logo" src="/logo.png" alt="Université d’Alger 1" />
          )}
          {page === 'welcome' ? (
            <Welcome goLogin={() => setPage('login')} goSignup={() => setPage('signup')} />
          ) : page === 'login' ? (
            <Login goSignup={() => setPage('signup')} goWelcome={() => setPage('welcome')} onLoggedIn={onLoggedIn} />
          ) : page === 'signup' ? (
            <Signup goLogin={() => setPage('login')} goWelcome={() => setPage('welcome')} />
          ) : page === 'student-space' ? (
            <StudentSpace session={session} goWelcome={logout} />
          ) : page === 'admin-space' ? (
            <AdminSpace session={session} goWelcome={logout} />
          ) : page === 'professor-space' ? (
            <ProfessorSpace session={session} goWelcome={logout} goJury={() => setPage('jury-space')} />
          ) : (
            <JurySpace session={session} goWelcome={logout} goProfessor={() => setPage('professor-space')} />
          )}
        </section>
      </main>
    </>
  );
}
