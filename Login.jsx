import React, { useState } from 'react';
import RoleSelector from '../components/RoleSelector.jsx';
import TopLeftBack from '../components/TopLeftBack.jsx';
import { login } from '../lib/api.js';
import { getUserByEmail } from '../lib/db-web.js';

function emailValid(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
}

export default function Login({ goSignup, goWelcome, onLoggedIn }) {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(ev) {
    ev.preventDefault();
    const e = [];
    if (!emailValid(email)) e.push('Adresse e‑mail invalide');
    if (!password || password.length < 8) e.push('Mot de passe invalide');
    setErrors(e);
    if (e.length) return;
    setBusy(true);
    try {
      const r = await login({ email: email.trim(), password, role });
      if (!r.ok) {
        setErrors(r.data.errors || ['Identifiants incorrects']);
        return;
      }
      setErrors([]);
      const normalizedEmail = email.trim().toLowerCase();
      if (typeof onLoggedIn === 'function') {
        onLoggedIn({ id: r.data.id, role: r.data.role, name: r.data.name, email: normalizedEmail });
        return;
      }
      alert('Connecté en tant que ' + r.data.role);
    } catch {
      try {
        const user = await getUserByEmail(email);
        if (!user) {
          setErrors(['Utilisateur introuvable (local)']);
          return;
        }
        if (user.role !== role) {
          setErrors(['Rôle incorrect (local)']);
          return;
        }
        setErrors([]);
        if (typeof onLoggedIn === 'function') {
          onLoggedIn({ role: user.role, name: user.name, email: user.email });
        } else {
          alert('Connecté en local (IndexedDB)');
        }
      } catch {
        setErrors(['Erreur de connexion']);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopLeftBack onClick={goWelcome} label="Retour" />
      <div className="center">
        <section className="card auth-card" style={{ maxWidth: 620 }}>
          <img className="logo-top" src="/logo.png" alt="Logo" />
          <h1 className="card-title">Université d’Alger 1</h1>
          <p className="card-subtitle">Bienvenue sur Planner</p>
          <RoleSelector value={role} onChange={setRole} />
          <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 13L2 6.5v11A2.5 2.5 0 0 0 4.5 20h15A2.5 2.5 0 0 0 22 17.5v-11L12 13zm0-2.2L21.4 5H2.6L12 10.8z"/></svg>
            </span>
            <input type="email" placeholder="Adresse e‑mail" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z"/></svg>
            </span>
            <input type={show ? 'text' : 'password'} placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} required />
            <button type="button" className="reveal" onClick={() => setShow(s=>!s)}>👁️</button>
          </div>
          <button className="primary" type="submit" disabled={busy}>Se connecter</button>
          <p className="terms"><a href="#">Mot de passe oublié ?</a></p>
          <p className="signin">Pas encore de compte ? <a href="#" onClick={ev=>{ev.preventDefault(); goSignup();}}>Créer un compte</a></p>
          </form>
          <div className="errors">{errors.join('\n')}</div>
        </section>
      </div>
    </>
  );
}
