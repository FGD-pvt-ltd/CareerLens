import React, { useState } from 'react';
import DeskSceneIllustration from './DeskSceneIllustration';
import { FileText, GitBranch, Gauge, Compass, Route } from 'lucide-react';

/**
 * HeroShowcaseDock
 * Faithful recreation of the reference template:
 * - Top Stage: Displays ONLY the signature illustrated meeting/desk scene with dynamic brief card & colleagues.
 * - Bottom Dock: Attached 5-tile forest green dock that updates the brief card in real time.
 * - 100% lag-free SVG & zero 3D overhead.
 */
export default function HeroShowcaseDock({ onOpenModal }) {
  const [activeTab, setActiveTab] = useState('dossier');

  const dockItems = [
    {
      id: 'dossier',
      icon: <FileText size={17} />,
      title: 'Project Briefs',
      desc: 'Convert resume bullets into clear briefs so hiring teams see verified proof.'
    },
    {
      id: 'telemetry',
      icon: <GitBranch size={17} />,
      title: 'Code Evidence',
      desc: 'Review real GitHub commits and project architecture in seconds.'
    },
    {
      id: 'readiness',
      icon: <Gauge size={17} />,
      title: 'Readiness Score',
      desc: 'An honest, objective score grounded in real code—zero guesswork.'
    },
    {
      id: 'rolefit',
      icon: <Compass size={17} />,
      title: 'Role Matches',
      desc: 'See your alignment across Full-Stack, Frontend, Backend, and ML jobs.'
    },
    {
      id: 'roadmap',
      icon: <Route size={17} />,
      title: 'Growth Plan',
      desc: 'A 4-week step-by-step checklist to level up your score and skills.'
    }
  ];

  return (
    <div className="showcase-dock-container">
      {/* Top Stage Area */}
      <div className="showcase-stage-card">
        {/* Subtle, Clean Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid var(--border-soft)',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(8px)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-warm)' }} />
            <span className="mono-token" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              LIVE CANDIDATE BRIEF // {(dockItems.find(d => d.id === activeTab)?.title || activeTab).toUpperCase()}
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            INTERACTIVE DOCK // SELECT A TILE BELOW
          </span>
        </div>

        {/* Live Illustrated Scene (100% SVG, Zero Lag) */}
        <div className="showcase-stage-inner" style={{ padding: '0.5rem 1.5rem 0' }}>
          <DeskSceneIllustration activeTab={activeTab} onInspectBrief={onOpenModal} />
        </div>
      </div>

      {/* Bottom Attached 5-Tile Feature Dock (Directly from template) */}
      <div className="showcase-bottom-dock">
        {dockItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`dock-tile-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="dock-tile-icon-row">
                <span className="dock-icon">{item.icon}</span>
                <span className="dock-title">{item.title}</span>
              </div>
              <p className="dock-desc">{item.desc}</p>
              {isActive && <div className="dock-active-indicator" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
