import React from 'react';

export default function RoleSelector({ value, onChange }) {
  const roles = [
    { id: 'student', label: 'Student', icon: '🎓' },
    { id: 'professor', label: 'Professor', icon: '👨‍🏫' },
    { id: 'administrator', label: 'Administrator', icon: '⚙️' }
  ];

  return (
    <div className="role-group">
      {roles.map((r) => (
        <button
          key={r.id}
          type="button"
          className={'role' + (value === r.id ? ' active' : '')}
          onClick={() => onChange(r.id)}
        >
          <span className="role-icon">{r.icon}</span>
          <span>{r.label}</span>
        </button>
      ))}
    </div>
  );
}

