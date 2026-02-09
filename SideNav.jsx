import React from 'react';

export default function SideNav({ current, onSelect }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: '⬛' },
    { id: 'report', label: 'Report', icon: '📝' },
    { id: 'messaging', label: 'Messaging', icon: '💬' },
    { id: 'simulator', label: 'Simulator', icon: '🤖' }
  ];
  return (
    <nav style={{ width: 200, paddingRight: 16 }}>
      {items.map(it => (
        <button
          key={it.id}
          className={'btn' + (current === it.id ? ' primary' : '')}
          style={{ width: '100%', marginBottom: 14, display: 'grid', gridAutoFlow: 'column', gap: 10, placeItems: 'center', height: 56 }}
          onClick={() => onSelect(it.id)}
        >
          <span aria-hidden="true">{it.icon}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
