import React from 'react';

export default function TopLeftBack({ onClick, label = 'Back' }) {
  if (typeof onClick !== 'function') return null;
  return (
    <div className="top-left-actions">
      <button className="back-btn" type="button" onClick={onClick}>
        <span aria-hidden="true">←</span>
        <span>{label}</span>
      </button>
    </div>
  );
}

