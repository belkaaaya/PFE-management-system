import React, { useState } from 'react';
import RoleSelector from '../components/RoleSelector.jsx';
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
    if (!name || name.trim().length < 2) e.push('Invalid full name');
    if (!emailValid(email)) e.push('Invalid email address');
    if (!passwordValid(password)) e.push('Password is too weak');
    if (password !== confirm) e.push('Passwords do not match');
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
        setErrors(r.data.errors || ['Unknown error']);
        return;
      }
      setErrors([]);
      setName('');
      setEmail('');
      setPassword('');
      setConfirm('');
      alert('Account created (id ' + r.data.id + ')');
    } catch {
      try {
        const existing = await getUserByEmail(email);
        if (existing) {
          setErrors(['Email already used (local)']);
        } else {
          await addUser({ name, email, role });
          setErrors([]);
          setName('');
          setEmail('');
          setPassword('');
          setConfirm('');
          alert('Account created locally (IndexedDB)');
        }
      } catch {
        setErrors(['An error occurred']);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopLeftBack onClick={goWelcome} label="Retour" />
      <div className="auth-screen">
        <section className="auth-shell" aria-label="Create account">
          <header className="auth-shell-header">
            <div className="auth-brand">
              <img className="auth-brand-logo" src="/logo.png" alt="University logo" />
            </div>
            <h1 className="auth-shell-title">Créer un compte</h1>
            <p className="auth-shell-subtitle">University of Algiers 1</p>
          </header>

          <div className="auth-form-card">
            <div className="auth-field">
              <div className="auth-label">Rôle</div>
              <RoleSelector value={role} onChange={setRole} />
            </div>

            <form onSubmit={onSubmit} noValidate>
              <div className="auth-grid">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-name">
                    Nom complet
                  </label>
                  <div className="field">
                    <span className="icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-4.33 0-8 2.17-8 5v2h16v-2c0-2.83-3.67-5-8-5z" />
                      </svg>
                    </span>
                    <input
                      id="signup-name"
                      type="text"
                      placeholder="Entrez votre nom complet"
                      value={name}
                      onChange={(e2) => setName(e2.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-email">
                    Email
                  </label>
                  <div className="field">
                    <span className="icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 13L2 6.5v11A2.5 2.5 0 0 0 4.5 20h15A2.5 2.5 0 0 0 22 17.5v-11L12 13zm0-2.2L21.4 5H2.6L12 10.8z" />
                      </svg>
                    </span>
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="Entrez votre email"
                      value={email}
                      onChange={(e2) => setEmail(e2.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-password">
                    Mot de passe
                  </label>
                  <div className="field">
                    <span className="icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z" />
                      </svg>
                    </span>
                    <input
                      id="signup-password"
                      type="password"
                      placeholder="Créez un mot de passe"
                      value={password}
                      onChange={(e2) => setPassword(e2.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="signup-confirm">
                    Confirmer le mot de passe
                  </label>
                  <div className="field">
                    <span className="icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z" />
                      </svg>
                    </span>
                    <input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirmez votre mot de passe"
                      value={confirm}
                      onChange={(e2) => setConfirm(e2.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <button className="primary auth-primary" type="submit" disabled={busy}>
                Créer un compte
              </button>

              <p className="auth-switch">
                Déjà un compte ?{' '}
                <a
                  href="#"
                  onClick={(ev) => {
                    ev.preventDefault();
                    goLogin();
                  }}
                >
                  Se connecter
                </a>
              </p>

              <div className="errors" aria-live="polite">
                {errors.join('\n')}
              </div>
            </form>
          </div>

          <footer className="auth-foot">© {new Date().getFullYear()} — Tous droits réservés</footer>
        </section>
      </div>
    </>
  );
}
