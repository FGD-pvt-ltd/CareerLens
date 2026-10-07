import React from 'react';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-logo">SkillProof</span>
      </div>
      <div className="navbar-links">
        <a href="#dashboard">Dashboard</a>
        <a href="#analysis">Analysis</a>
        <a href="#results">Results</a>
      </div>
    </nav>
  );
}
