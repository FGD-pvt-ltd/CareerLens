import React, { useState, useEffect } from 'react';
import './index.css';

export default function App() {
  const [healthStatus, setHealthStatus] = useState('checking');
  const [apiResponse, setApiResponse] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('API unreachable');
        return res.json();
      })
      .then((data) => {
        setHealthStatus('connected');
        setApiResponse(data);
      })
      .catch(() => {
        setHealthStatus('offline');
      });
  }, []);

  return (
    <div className="foundation-container">
      <header className="foundation-header">
        <div className="badge-pill">Hackathon Foundation • Task 1</div>
        <h1 className="brand-title">ProfiQ</h1>
        <p className="brand-tagline">
          AI-Powered Employability and Career Readiness Analyzer
        </p>
      </header>

      <main className="foundation-main">
        <section className="status-banner">
          <div className="status-indicator">
            <span className={`status-dot ${healthStatus}`}></span>
            <span className="status-text">
              Backend API Status:{' '}
              <strong>
                {healthStatus === 'connected'
                  ? 'Connected (/api/health OK)'
                  : healthStatus === 'checking'
                  ? 'Checking connection...'
                  : 'Offline (Start backend at :5000)'}
              </strong>
            </span>
          </div>
          {apiResponse && (
            <div className="api-badge">
              <span>{apiResponse.service}</span> • <span>v{apiResponse.version || '1.0.0'}</span>
            </div>
          )}
        </section>

        <section className="modules-grid">
          <div className="module-card">
            <div className="module-icon">💻</div>
            <h3>Frontend Client</h3>
            <p className="module-tech">React 18 + Vite</p>
            <p className="module-desc">
              Scaffolded structure ready for pages, components, services, custom hooks, and utilities.
            </p>
            <span className="module-status active">Ready</span>
          </div>

          <div className="module-card">
            <div className="module-icon">⚙️</div>
            <h3>Backend Server</h3>
            <p className="module-tech">Node.js + Express</p>
            <p className="module-desc">
              REST service configured with controllers, routes, models, middleware, and health check.
            </p>
            <span className="module-status active">Ready</span>
          </div>

          <div className="module-card">
            <div className="module-icon">🧠</div>
            <h3>AI Engine</h3>
            <p className="module-tech">Google Gemini + Modular Agents</p>
            <p className="module-desc">
              Modular architecture prepared for skill extraction, evidence verification, role matching, and roadmaps.
            </p>
            <span className="module-status active">Ready</span>
          </div>
        </section>

        <section className="ready-note">
          <p>
            ✨ <strong>Project foundation setup complete.</strong> Core structure verified for 3-member team collaboration.
          </p>
        </section>
      </main>

      <footer className="foundation-footer">
        <p>ProfiQ © 2026 • Monorepo Architecture</p>
      </footer>
    </div>
  );
}
