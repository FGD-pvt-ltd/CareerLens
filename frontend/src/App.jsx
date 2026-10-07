import React, { useState } from 'react';
import HeroWordMorph from './components/HeroWordMorph';
import HeroShowcaseDock from './components/HeroShowcaseDock';
import EditorialFeatureTrio from './components/EditorialFeatureTrio';
import PipelineFlowBar from './components/PipelineFlowBar';
import CareerReadinessStudio from './components/CareerReadinessStudio';
import DashboardView from './components/DashboardView';
import ProfileAnalysisModal from './components/ProfileAnalysisModal';
import { ArrowRight, LayoutDashboard, Star, Sparkles, ShieldCheck } from 'lucide-react';
import './index.css';

export default function App() {
  const [activeView, setActiveView] = useState('home'); // 'home' | 'dashboard'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleCompleteAudit = () => {
    setActiveView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToStudio = () => {
    if (activeView !== 'home') {
      setActiveView('home');
      setTimeout(() => {
        const el = document.getElementById('readiness-studio');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      const el = document.getElementById('readiness-studio');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="profiq-root">
      {/* Top Navigation (SayBriefly-style clean bar) */}
      <header className="site-nav">
        <div className="site-nav-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <a 
              href="#" 
              className="brand-mark"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              PROFIQ
              <span className="brand-dot" />
            </a>
            <span className="mono-token" style={{
              fontSize: '0.68rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-warm)',
              padding: '2px 8px',
              borderRadius: '9999px',
              border: '1px solid var(--border-soft)',
              fontWeight: 600
            }}>
              VERIFIED WITH REAL CODE
            </span>
          </div>

          <nav>
            <ul className="nav-links">
              <li>
                <button 
                  className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveView('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Overview
                </button>
              </li>
              <li>
                <button 
                  className="nav-item"
                  onClick={scrollToStudio}
                >
                  Readiness Studio
                </button>
              </li>
              <li>
                <button
                  className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={() => {
                    setActiveView('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </button>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            <button 
              className="btn btn-primary"
              style={{ borderRadius: '9999px', padding: '0.65rem 1.35rem' }}
              onClick={handleOpenModal}
            >
              Analyse My Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Focused, Spacious & Lag-Free */}
      {activeView === 'dashboard' ? (
        <DashboardView onBackToStory={() => {
          setActiveView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} />
      ) : (
        <main>
          {/* ==================================================
              HERO SECTION (Modeled directly on SayBriefly template)
              ================================================== */}
          <section className="hero-section" style={{ textAlign: 'center', padding: '4.5rem 0 3rem' }}>
            <div className="container">
              {/* Top Trust Pill Badge */}
              <div>
                <span className="template-top-pill">
                  <Star size={13} fill="#B76E52" color="#B76E52" />
                  91% precision rate across 1,420 senior engineering audits
                </span>
              </div>

              {/* Large Display Headline with signature word transition */}
              <div style={{ maxWidth: '920px', margin: '0 auto' }}>
                <h1 className="template-display-headline">
                  One instrument, that's all your career readiness needs.
                </h1>
                
                <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.75rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                  KNOW WHERE YOU <HeroWordMorph />
                </div>

                <p className="editorial-subhead" style={{ margin: '1.25rem auto 0', maxWidth: '680px' }}>
                  Turn resume bullets into verified evidence, match your skills to real roles, 
                  and follow a clear step-by-step roadmap in one beautiful app.
                </p>

                {/* Dual Pill Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2.25rem', flexWrap: 'wrap' }}>
                  <button className="btn-pill-primary" onClick={handleOpenModal}>
                    It's Free → Analyse My Profile!
                  </button>
                  <button 
                    className="btn-pill-outline"
                    onClick={scrollToStudio}
                  >
                    Try the Studio ↓
                  </button>
                </div>

                <div className="mono-token" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
                  no resume exaggeration required • backed by real GitHub work.
                </div>

                {/* Standards & Social Proof Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.25rem',
                  marginTop: '2.5rem',
                  paddingTop: '1.75rem',
                  borderTop: '1px solid var(--border-soft)',
                  flexWrap: 'wrap'
                }}>
                  <span className="label-caps" style={{ fontSize: '0.72rem' }}>
                    Evaluated across standards from:
                  </span>
                  <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    <span>GitHub Repositories</span>
                    <span>•</span>
                    <span>Real Codebases</span>
                    <span>•</span>
                    <span>Cloud Deployments</span>
                    <span>•</span>
                    <span>Clean Code Standards</span>
                  </div>
                </div>
              </div>

              {/* The Signature Showcase & 5-Tile Attached Dock Container */}
              <HeroShowcaseDock onOpenModal={handleOpenModal} />
            </div>
          </section>

          {/* Sequential Pipeline Flow Indicator */}
          <PipelineFlowBar onSelectView={scrollToStudio} />

          {/* ==================================================
              EDITORIAL FEATURE TRIO SECTION
              "Condense weeks of interview guesswork into verifiable proof"
              ================================================== */}
          <EditorialFeatureTrio onOpenModal={handleOpenModal} />

          {/* ==================================================
              THE UNIFIED CAREER READINESS STUDIO
              (Contains ONLY what is really important: Skills, Roles, Plan)
              ================================================== */}
          <CareerReadinessStudio onOpenModal={handleOpenModal} />

          {/* Pre-Footer Action Banner */}
          <section style={{ padding: '6rem 0', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-soft)', textAlign: 'center' }}>
            <div className="container-narrow">
              <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                EXPERIENCE THE DIFFERENCE
              </span>
              <h2 className="editorial-headline" style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>
                READY TO AUDIT YOUR PROFILE?
              </h2>
              <p className="editorial-subhead" style={{ margin: '1rem auto 2.5rem' }}>
                Connect your repository signals, review your multi-factor readiness score, 
                and receive a customized roadmap to close key gaps.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                <button className="btn-pill-primary" onClick={handleOpenModal}>
                  Analyse My Profile →
                </button>
                <button 
                  className="btn-pill-outline" 
                  onClick={() => {
                    setActiveView('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <LayoutDashboard size={16} />
                  Open Live Dashboard
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Editorial Footer */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <div>
              <div className="brand-mark" style={{ fontSize: '1.1rem' }}>
                PROFIQ
                <span className="brand-dot" />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '360px' }}>
                Evidence-backed career intelligence. Minimal, warm, precise, human.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <span className="label-caps">INSTRUMENT</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.6rem', fontSize: '0.88rem' }}>
                  <button onClick={scrollToStudio} style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                    Verified Skills
                  </button>
                  <button onClick={scrollToStudio} style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                    Role Matches
                  </button>
                  <button onClick={scrollToStudio} style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                    4-Week Growth Plan
                  </button>
                </div>
              </div>

              <div>
                <span className="label-caps">VIEWS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.6rem', fontSize: '0.88rem' }}>
                  <button onClick={() => { setActiveView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                    Editorial Overview
                  </button>
                  <button onClick={() => { setActiveView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
                    Career Dashboard
                  </button>
                  <button onClick={handleOpenModal} style={{ textAlign: 'left', color: 'var(--accent-warm)', fontWeight: 600 }}>
                    Profile Intake Audit
                  </button>
                </div>
              </div>
            </div>

            <div className="footer-copy">
              <div>© 2026 PROFIQ // Precision Career Intelligence</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                White-first editorial design system. No AI hype. Pure verified signal.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Profile Analysis Intake Modal */}
      <ProfileAnalysisModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCompleteAudit={handleCompleteAudit}
      />
    </div>
  );
}
