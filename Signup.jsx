import React, { useState } from 'react';
import TopLeftBack from '../components/TopLeftBack.jsx';
import { signup } from '../lib/api.js';
import { getUserByEmail, addUser } from '../lib/db-web.js';

function emailValid(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
}
function passwordValid(v) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v || '');
}

export default function Signup({ goLogin, goWelcome }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  function validate() {
    const e = [];
    if (!name || name.trim().length < 2) e.push('Nom Prénom invalide');
    if (!emailValid(email)) e.push('Adresse e‑mail invalide');
    if (!passwordValid(password)) e.push('Mot de passe trop faible');
    if (password !== confirm) e.push('Les mots de passe ne correspondent pas');
    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length) return;
    setBusy(true);
    try {
      const r = await signup({ name: name.trim(), email: email.trim(), role, password });
      if (!r.ok) {
        setErrors(r.data.errors || ['Erreur inconnue']);
        return;
      }
      setErrors([]);
      setName(''); setEmail(''); setPassword(''); setConfirm('');
      alert('Compte créé (id ' + r.data.id + ')');
    } catch {
      try {
        const existing = await getUserByEmail(email);
        if (existing) {
          setErrors(['Email déjà utilisé (local)']);
        } else {
          await addUser({ name, email, role });
          setErrors([]);
          setName(''); setEmail(''); setPassword(''); setConfirm('');
          alert('Compte créé en local (IndexedDB)');
        }
      } catch {
        setErrors(['Une erreur est survenue']);
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
          <p className="card-subtitle">Créer un compte Planner</p>
          <form onSubmit={onSubmit} noValidate>
          <div className="field select">
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-7 9a7 7 0 0 1 14 0v1H5v-1z"/></svg>
            </span>
            <select value={role} onChange={e=>setRole(e.target.value)} required>
              <option value="student">Student</option>
              <option value="professor">Professor</option>
              <option value="administrator">Administrator</option>
            </select>
            <span className="chevron" aria-hidden="true">▾</span>
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-4.33 0-8 2.17-8 5v2h16v-2c0-2.83-3.67-5-8-5z"/></svg>
            </span>
            <input type="text" placeholder="Nom Prénom" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
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
            <input type="password" placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <div className="field">
            <span className="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z"/></svg>
            </span>
            <input type="password" placeholder="Confirmer le mot de passe" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
          </div>
          <button className="primary" type="submit" disabled={busy}>Créer un compte</button>
          <p className="terms">En créant un compte, vous acceptez nos <a href="#">Conditions d’utilisation</a></p>
          <p className="signin">Vous avez déjà un compte ? <a href="#" onClick={ev=>{ev.preventDefault(); goLogin();}}>Se connecter</a></p>
          </form>
          <div className="errors">{errors.join('\n')}</div>
        </section>
      </div>
    </>
  );
}
