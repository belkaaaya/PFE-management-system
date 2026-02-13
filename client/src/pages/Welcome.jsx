import React, { useMemo, useState } from 'react';
import plannerPreview from '../../planner.png';

function Icon({ children }) {
  return (
    <span className="landing-icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}

export default function Welcome({ goLogin, goSignup }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasLogo, setHasLogo] = useState(true);
  const year = useMemo(() => new Date().getFullYear(), []);

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  }

  function NavLink({ id, children }) {
    return (
      <a
        className="landing-nav-link"
        href={'#' + id}
        onClick={(ev) => {
          ev.preventDefault();
          scrollToId(id);
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <div className="landing">
      <header className="landing-header" role="banner">
        <button className="landing-brand" type="button" onClick={() => scrollToId('accueil')}>
          {hasLogo ? (
            <img className="landing-brand-logo" src="/logo.png" alt="Planner logo" onError={() => setHasLogo(false)} />
          ) : (
            <div className="landing-brand-fallback" aria-hidden="true">
              P
            </div>
          )}
          <span className="landing-brand-name">Planner</span>
        </button>

        <nav className={'landing-nav' + (menuOpen ? ' open' : '')} aria-label="Main navigation">
          <NavLink id="accueil">Home</NavLink>
          <NavLink id="fonctionnalites">Features</NavLink>
          <NavLink id="comment">How it works</NavLink>
          <NavLink id="contact">Contact</NavLink>
        </nav>

        <div className="landing-actions">
          <button className="landing-action-btn landing-action-secondary" type="button" onClick={goLogin}>
            Login
          </button>
          <button className="landing-action-btn" type="button" onClick={goSignup}>
            Create account
          </button>
          <button
            className="landing-burger"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      <section id="accueil" className="landing-hero">
        <div className="landing-hero-left">
          <h1 className="landing-title">Smart management for final-year defenses</h1>
          <p className="landing-subtitle">Plan, track, and organize your defense without administrative hassle.</p>

          <ul className="landing-list">
            <li>
              <Icon>
                <path d="M8 2v2M16 2v2M3.5 8.5h17" />
                <path d="M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
                <path d="M7.5 12h3M7.5 16h3M13.5 12h3M13.5 16h3" />
              </Icon>
              <span>View date, room, and jury</span>
            </li>
            <li>
              <Icon>
                <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                <path d="M14 3v4h4" />
                <path d="M8 13h8M8 17h8" />
              </Icon>
              <span>Upload thesis PDF</span>
            </li>
            <li>
              <Icon>
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </Icon>
              <span>Automatic notifications</span>
            </li>
            <li>
              <Icon>
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                <path d="M7 9h10M7 12h7" />
              </Icon>
              <span>Messaging with your supervisor</span>
            </li>
            <li>
              <Icon>
                <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                <path d="M9 9h6M9 12h6M9 15h6" />
              </Icon>
              <span>Smart grading simulator</span>
            </li>
          </ul>

          <div className="landing-cta">
            <button className="landing-btn landing-btn-primary" type="button" onClick={goLogin}>
              Sign in
            </button>
            <button className="landing-btn" type="button" onClick={() => scrollToId('fonctionnalites')}>
              See a demo
            </button>
          </div>
        </div>

        <div className="landing-hero-right">
          <div className="landing-preview landing-preview-image">
            <img className="landing-preview-img" src={plannerPreview} alt="Planner UI preview" loading="eager" decoding="async" />
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="landing-section">
        <h2 className="landing-h2">Discover Planner features</h2>
        <div className="landing-cards">
          <article className="landing-card">
            <div className="landing-card-title">
              <Icon>
                <path d="M8 2v2M16 2v2M3.5 8.5h17" />
                <path d="M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
              </Icon>
              <span>Defense management</span>
            </div>
            <p>View the date, time, room, and jury members for your defense.</p>
          </article>

          <article className="landing-card">
            <div className="landing-card-title">
              <Icon>
                <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                <path d="M14 3v4h4" />
              </Icon>
              <span>Thesis upload</span>
            </div>
            <p>Upload your thesis in PDF format with automatic validation and deadline reminders.</p>
          </article>

          <article className="landing-card">
            <div className="landing-card-title">
              <Icon>
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </Icon>
              <span>Smart notifications</span>
            </div>
            <p>Get important notifications: invitation ready, jury confirmed, reminders, and more.</p>
          </article>

          <article className="landing-card">
            <div className="landing-card-title">
              <Icon>
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </Icon>
              <span>Built-in messaging</span>
            </div>
            <p>Communicate directly with your supervisor through an integrated messaging system.</p>
          </article>
        </div>
      </section>

      <section id="comment" className="landing-section">
        <h2 className="landing-h2">See how it works</h2>
        <div className="landing-steps">
          <div className="landing-step">
            <Icon>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </Icon>
            <div className="landing-step-text">The student creates an account</div>
          </div>
          <div className="landing-step">
            <Icon>
              <path d="M4 19V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12" />
              <path d="M8 3h8" />
              <path d="M8 19h8" />
            </Icon>
            <div className="landing-step-text">Administration schedules the defense</div>
          </div>
          <div className="landing-step">
            <Icon>
              <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
              <path d="M14 3v4h4" />
            </Icon>
            <div className="landing-step-text">The student uploads the thesis</div>
          </div>
          <div className="landing-step">
            <Icon>
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </Icon>
            <div className="landing-step-text">The system notifies and guides</div>
          </div>
        </div>
      </section>

      <section id="contact" className="landing-section">
        <div className="landing-contact">
          <div className="landing-contact-title">Contact</div>
          <div className="landing-contact-text">Questions? Send us an email — we reply quickly.</div>
          <div className="landing-contact-actions">
            <a className="landing-contact-link" href="mailto:planner@univ.dz">
              planner@univ.dz
            </a>
            <button className="landing-contact-btn" type="button" onClick={goSignup}>
              Get started
            </button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">© {year} Planner — All rights reserved</footer>
    </div>
  );
}

