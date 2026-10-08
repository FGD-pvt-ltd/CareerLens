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
  const [currentCandidate, setCurrentCandidate] = useState(null);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleCompleteAudit = (profileData) => {
    if (profileData) {
      setCurrentCandidate(profileData);
    }
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
      {/* Top Navigation (Clean, elegant bar) */}
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
              ProfiQ
              <span className="brand-dot" />
            </a>
            <span className="mono-token" style={{
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-warm)',
              padding: '2px 9px',
              borderRadius: '9999px',
              border: '1px solid var(--border-soft)',
              fontWeight: 600
            }}>
              Verified Code Intelligence
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
        <DashboardView 
          candidateProfile={currentCandidate}
          onReanalyze={handleOpenModal}
          onBackToStory={() => {
            setActiveView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
        />
      ) : (
        <main>
          {/* ==================================================
              HERO SECTION (Punchy copy & smooth animation flow)
              ================================================== */}
          <section className="hero-section" style={{ textAlign: 'center', padding: '4.25rem 0 2.5rem' }}>
            <div className="container">
              {/* Top Trust Pill Badge with subtle floating animation */}
              <div className="animate-hero-1">
                <span className="template-top-pill float-badge">
                  <Star size={13} fill="#B76E52" color="#B76E52" />
                  Verified Engineering Readiness · 1,420+ Benchmark Audits
                </span>
              </div>

              {/* Large Display Headline with signature word transition */}
              <div style={{ maxWidth: '860px', margin: '0 auto' }}>
                <h1 className="template-display-headline animate-hero-2" style={{ letterSpacing: '-0.025em' }}>
                  One instrument for your career readiness.
                </h1>
                
                <div className="animate-hero-2" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.65rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  KNOW WHERE YOU <HeroWordMorph />
                </div>

                <p className="editorial-subhead animate-hero-3" style={{ margin: '1rem auto 0', maxWidth: '620px', fontSize: '1.05rem', lineHeight: '1.55' }}>
                  Turn resume claims into verified evidence. Quantify role fit and follow a clear step-by-step roadmap with live GitHub telemetry.
                </p>

                {/* Dual Action Buttons */}
                <div className="animate-hero-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.85rem', flexWrap: 'wrap' }}>
                  <button className="btn-pill-primary" onClick={handleOpenModal}>
                    Analyse My Profile →
                  </button>
                  <button 
                    className="btn-pill-outline"
                    onClick={scrollToStudio}
                  >
                    Try the Studio ↓
                  </button>
                </div>

                {/* Streamlined Standards Proof Strip */}
                <div className="animate-hero-4" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.25rem',
                  marginTop: '2.25rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border-soft)',
                  flexWrap: 'wrap'
                }}>
                  <span className="label-caps" style={{ fontSize: '0.72rem' }}>
                    Standards:
                  </span>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <span>GitHub Repositories</span>
                    <span>•</span>
                    <span>Live Codebases</span>
                    <span>•</span>
                    <span>Clean Code Standards</span>
                  </div>
                </div>
              </div>

              {/* The Showcase & Attached Dock Container */}
              <div className="animate-hero-4">
                <HeroShowcaseDock onOpenModal={handleOpenModal} />
              </div>
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
          <section style={{ padding: '4.5rem 0', background: 'var(--bg-primary)', borderTop: '1px solid var(--border-soft)', textAlign: 'center' }}>
            <div className="container-narrow">
              <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                EXPERIENCE THE DIFFERENCE
              </span>
              <h2 className="editorial-headline" style={{ fontSize: '2.25rem', marginTop: '0.4rem', letterSpacing: '-0.02em' }}>
                Ready to audit your engineering readiness?
              </h2>
              <p className="editorial-subhead" style={{ margin: '0.75rem auto 2rem', maxWidth: '580px' }}>
                Connect your repository signals, review your multi-factor readiness score, 
                and receive a customized milestone roadmap.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                ProfiQ
                <span className="brand-dot" />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem', maxWidth: '360px' }}>
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
              <div>© 2026 ProfiQ // Precision Career Intelligence</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                White-first editorial design system. Pure verified signal.
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
