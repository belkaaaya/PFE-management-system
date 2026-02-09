import React, { useState } from 'react';

export default function Welcome({ goLogin, goSignup }) {
  const [hasLogo, setHasLogo] = useState(true);
  return (
    <div className="hero">
      <div className="brand">
        {hasLogo ? (
          <img className="logo" src="/logo.png" alt="Algiers University Logo" onError={() => setHasLogo(false)} />
        ) : (
          <div className="logo" aria-hidden="true">🏛️</div>
        )}
        <span className="brand-name">University of Algiers — Computer Science Department</span>
      </div>
      <h1 className="hero-title">Welcome to<br/>Planner</h1>
      <p className="hero-subtitle">Final‑Year Project Defense Management System<br/>Schedule, Manage, and Track Thesis Defenses</p>
      <div className="hero-actions">
        <button className="pill" onClick={goLogin}>Login</button>
        <button className="pill secondary" onClick={goSignup}>Sign up</button>
      </div>
      <p className="hero-footer">© 2025 Planner — All Rights Reserved</p>
    </div>
  );
}
