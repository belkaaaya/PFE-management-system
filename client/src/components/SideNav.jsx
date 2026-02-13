import React from 'react';

export default function SideNav({ current, onSelect, onLogout }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'DB' },
    { id: 'report', label: 'Documents', icon: 'DOC' },
    { id: 'messaging', label: 'Messages', icon: 'MSG' },
    { id: 'notifications', label: 'Notifications', icon: 'NTF' },
    { id: 'simulator', label: 'Simulator', icon: 'SIM' }
  ];

  return (
    <nav className="admin-nav">
      <div className="nav-brand">
        <div>
          <div className="nav-brand-title">Planner</div>
          <div className="nav-brand-sub">Student</div>
        </div>
      </div>
      <div className="nav-sep" />

      <div className="admin-nav-list">
        {items.map((it) => (
          <button
            key={it.id}
            className={'admin-nav-btn' + (current === it.id ? ' active' : '')}
            type="button"
            onClick={() => onSelect(it.id)}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              {it.icon}
            </span>
            {it.label}
          </button>
        ))}
      </div>

      <div className="admin-nav-footer">
        <button className="admin-nav-btn nav-footer-btn" type="button" onClick={() => onSelect('dashboard')}>
          <span className="admin-nav-icon" aria-hidden="true">
            PR
          </span>
          Profile
        </button>
        <button className="admin-nav-btn nav-footer-btn" type="button" onClick={onLogout}>
          <span className="admin-nav-icon" aria-hidden="true">
            OUT
          </span>
          Log out
        </button>
      </div>
    </nav>
  );
}
