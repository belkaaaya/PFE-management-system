import React from 'react';

function firstNameFromName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts[0] || '';
}

function initialsFromSession(session) {
  const name = String(session && session.name ? session.name : '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0] ? parts[0][0] : '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || 'U';
  }
  const email = String(session && session.email ? session.email : '').trim();
  if (email) return email[0].toUpperCase();
  return 'U';
}

export default function SpaceHeader({ kicker, subtitle, session, actions = [] }) {
  const firstName = firstNameFromName(session && session.name);
  const greeting = firstName ? `Hello ${firstName}` : 'Hello';
  const name = String(session && session.name ? session.name : '').trim();
  const email = String(session && session.email ? session.email : '').trim();
  const initials = initialsFromSession(session);
  const quickActions = Array.isArray(actions) ? actions.slice(0, 3) : [];

  return (
    <header className="space-header">
      <div>
        {kicker ? <p className="space-kicker">{kicker}</p> : null}
        <h1 className="space-greeting">{greeting}</h1>
        {subtitle ? <p className="space-subtitle">{subtitle}</p> : null}
      </div>

      <div className="space-actions">
        <button className="icon-chip ghost" type="button" aria-label="Search" title="Search">
          <span className="icon-chip-icon" aria-hidden="true">🔎</span>
        </button>

        <span className="space-actions-sep" aria-hidden="true" />

        {quickActions.map((a, idx) => (
          <button
            key={a.id || idx}
            className="icon-chip"
            type="button"
            onClick={a.onClick}
            title={a.label}
            aria-label={a.label}
          >
            <span className="icon-chip-icon" aria-hidden="true">{a.icon}</span>
            {a.badge ? <span className="icon-badge">{a.badge}</span> : null}
          </button>
        ))}

        <div className="user-chip">
          <div className="avatar" aria-hidden="true">{initials}</div>
          <div className="user-meta">
            <div className="user-name">{name || kicker || 'User'}</div>
            <div className="user-email">{email}</div>
          </div>
        </div>

        <button className="user-caret" type="button" aria-label="Open account menu" title="Account">
          <span aria-hidden="true">▾</span>
        </button>
      </div>
    </header>
  );
}
