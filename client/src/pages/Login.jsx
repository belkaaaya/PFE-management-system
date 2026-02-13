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
  const [remember, setRemember] = useState(false);

  async function onSubmit(ev) {
    ev.preventDefault();
    const e = [];
    if (!emailValid(email)) e.push('Invalid email address');
    if (!password || password.length < 8) e.push('Password must be at least 8 characters');
    setErrors(e);
    if (e.length) return;

    setBusy(true);
    try {
      const r = await login({ email: email.trim(), password, role });
      if (!r.ok) {
        setErrors(r.data.errors || ['Incorrect credentials']);
        return;
      }

      setErrors([]);
      const normalizedEmail = email.trim().toLowerCase();
      if (typeof onLoggedIn === 'function') {
        onLoggedIn({ id: r.data.id, role: r.data.role, name: r.data.name, email: normalizedEmail });
        return;
      }
      alert('Signed in as ' + r.data.role);
    } catch {
      try {
        const user = await getUserByEmail(email);
        if (!user) {
          setErrors(['User not found (local)']);
          return;
        }
        if (user.role !== role) {
          setErrors(['Wrong role (local)']);
          return;
        }
        setErrors([]);
        if (typeof onLoggedIn === 'function') {
          onLoggedIn({ role: user.role, name: user.name, email: user.email });
        } else {
          alert('Signed in locally (IndexedDB)');
        }
      } catch {
        setErrors(['Login error']);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopLeftBack onClick={goWelcome} label="Retour" />
      <div className="auth-screen">
        <section className="auth-shell" aria-label="Login">
          <header className="auth-shell-header">
            <div className="auth-brand">
              <img className="auth-brand-logo" src="/logo.png" alt="University logo" />
            </div>
            <h1 className="auth-shell-title">Connexion</h1>
            <p className="auth-shell-subtitle">University of Algiers 1</p>
          </header>

          <div className="auth-form-card">
            <div className="auth-field">
              <div className="auth-label">Rôle</div>
              <RoleSelector value={role} onChange={setRole} />
            </div>

            <form onSubmit={onSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-email">
                  Email
                </label>
                <div className="field">
                  <span className="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 13L2 6.5v11A2.5 2.5 0 0 0 4.5 20h15A2.5 2.5 0 0 0 22 17.5v-11L12 13zm0-2.2L21.4 5H2.6L12 10.8z" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
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
                <label className="auth-label" htmlFor="login-password">
                  Mot de passe
                </label>
                <div className="field field-reveal">
                  <span className="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={show ? 'text' : 'password'}
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e2) => setPassword(e2.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="reveal reveal-text"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>

              <div className="auth-row">
                <label className="auth-checkbox">
                  <input type="checkbox" checked={remember} onChange={(e2) => setRemember(e2.target.checked)} />
                  <span>Se souvenir de moi</span>
                </label>
                <a
                  className="auth-link"
                  href="#"
                  onClick={(ev) => {
                    ev.preventDefault();
                  }}
                >
                  Mot de passe oublié ?
                </a>
              </div>

              <button className="primary auth-primary" type="submit" disabled={busy}>
                Se connecter
              </button>

              <p className="auth-switch">
                Vous n&apos;avez pas de compte ?{' '}
                <a
                  href="#"
                  onClick={(ev) => {
                    ev.preventDefault();
                    goSignup();
                  }}
                >
                  Créer un compte
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
