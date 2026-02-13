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
  const isSpace = page.endsWith('-space');
  const isAuth = page === 'login' || page === 'signup';
  useEffect(() => {
    const noScroll = page.endsWith('-space') || page === 'login' || page === 'signup';
    document.body.classList.toggle('no-scroll', noScroll);
    window.scrollTo(0, 0);
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
      <div className="bg"></div>
      {isSpace && <div className="space-overlay"></div>}
      <main className={'container' + (isSpace ? ' container-fixed' : '')}>
        <section
          className={
            'app' +
            (isSpace ? ' app-space' : '') +
            (page === 'welcome' ? ' app-welcome' : '') +
            (isAuth ? ' app-auth' : '')
          }
        >
          {isSpace && <img className="logo app-logo" src="/logo.png" alt="University logo" />}
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
