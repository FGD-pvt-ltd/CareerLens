import React from 'react';

/**
 * Section 06: SKILL GAPS
 * Headline: KNOW WHAT TO WORK ON.
 * Elegant horizontal progress indicators:
 * Docker 34% (Terracotta → attention)
 * Testing 41% (Terracotta → attention)
 * Cloud 38% (Terracotta → attention)
 * System Design 52% (Gold → developing)
 * React / Core Web 91% (Sage → strong)
 * Do not use aggressive red warning colors.
 */
const GAPS = [
  {
    name: 'Docker & Containerization',
    percentage: 34,
    status: 'Next Step',
    theme: 'terracotta',
    note: 'Basic Dockerfile found. Adding a multi-container Docker Compose setup will earn +4 pts.'
  },
  {
    name: 'Cloud Infrastructure (AWS or Cloud Run)',
    percentage: 38,
    status: 'Next Step',
    theme: 'terracotta',
    note: 'Manual deploys only. Setting up a live container deployment with secrets will earn +3 pts.'
  },
  {
    name: 'Automated Testing (Unit & Integration)',
    percentage: 41,
    status: 'Next Step',
    theme: 'terracotta',
    note: 'Test coverage below 25%. Adding automated Jest/Vitest pull request tests will earn +4 pts.'
  },
  {
    name: 'System Design & Architecture',
    percentage: 52,
    status: 'In Progress',
    theme: 'gold',
    note: 'Solid component architecture. Documenting an API caching layer will reinforce this skill.'
  },
  {
    name: 'React & Modern Frontend',
    percentage: 91,
    status: 'Verified Strong',
    theme: 'sage',
    note: 'Verified in production. Advanced custom hooks, clean state management, and accessible UI.'
  }
];

export default function SkillGapsSection() {
  return (
    <section className="section-skillgaps" id="skillgaps-section">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">High-Impact Skills // Quick Wins</div>
          <h2 className="editorial-headline">
            THE SKILLS THAT MAKE<br />
            THE BIGGEST DIFFERENCE
          </h2>
          <p className="editorial-subhead">
            Don't waste time studying random topics. Here are the exact skills that will give 
            your profile the highest score gain and unlock interview callbacks.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--accent-warm)' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Terracotta:</strong> Focus Area (Next Step)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--accent-gold)' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Gold:</strong> In Progress</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--accent-sage)' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Sage:</strong> Verified Strong</span>
          </div>
        </div>

        {/* Indicators */}
        <div className="gap-indicators-wrap">
          {GAPS.map((item, idx) => (
            <div key={idx} className="gap-indicator-row">
              <div className="gap-row-meta">
                <span className="gap-skill-name">{item.name}</span>
                <div className="gap-percentage-wrap">
                  <span className={`gap-status-badge status-${item.theme}`}>
                    {item.status}
                  </span>
                  <span className="gap-percentage-num mono-token">{item.percentage}%</span>
                </div>
              </div>

              <div className="gap-progress-track">
                <div 
                  className={`gap-progress-fill ${item.theme}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
