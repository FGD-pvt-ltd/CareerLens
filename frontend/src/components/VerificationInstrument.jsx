import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, CornerDownRight } from 'lucide-react';

/**
 * Section 03: VERIFICATION
 * React
 * 91% confidence (smooth count-up)
 * Resume claim ✓
 * GitHub evidence ✓
 * Project evidence ✓
 * Recent activity ✓
 */
const SKILL_DATA = {
  react: {
    name: 'React',
    targetScore: 91,
    tagline: 'Component architecture, custom hooks, reconciler lifecycle',
    checks: [
      { label: 'Resume claim', proof: 'Listed under 3 years experience & lead frontend engineer' },
      { label: 'GitHub evidence', proof: '14,200 lines in production repository (Vite + React 18)' },
      { label: 'Project evidence', proof: 'Architected state management & complex canvas views' },
      { label: 'Recent activity', proof: '22 commits merged within the last 14 days' }
    ]
  },
  typescript: {
    name: 'TypeScript',
    targetScore: 84,
    tagline: 'Strict mode generics, discriminated unions, AST utility types',
    checks: [
      { label: 'Resume claim', proof: 'Primary language specified in core stack' },
      { label: 'GitHub evidence', proof: '98% TS coverage with zero "any" escapes in audited repos' },
      { label: 'Project evidence', proof: 'Published typed SDK package on npm' },
      { label: 'Recent activity', proof: 'Pull request review & type refactor merged 4 days ago' }
    ]
  },
  node: {
    name: 'Node.js',
    targetScore: 76,
    tagline: 'Express REST APIs, streaming I/O, middleware pipelines',
    checks: [
      { label: 'Resume claim', proof: 'Backend service development tenure' },
      { label: 'GitHub evidence', proof: 'Modular microservice with clean controller architecture' },
      { label: 'Project evidence', proof: 'Database migrations and JWT authentication flow' },
      { label: 'Recent activity', proof: 'Active API endpoints verified in staging logs' }
    ]
  },
  systemDesign: {
    name: 'System Design',
    targetScore: 52,
    tagline: 'Scalability, caching topologies, distributed state consistency',
    checks: [
      { label: 'Resume claim', proof: 'Claimed high-level distributed systems design' },
      { label: 'GitHub evidence', proof: 'Single-node database with partial caching implementation' },
      { label: 'Project evidence', proof: 'Lacks documented load testing or sharding benchmarks' },
      { label: 'Recent activity', proof: 'No architectural ADRs committed in last 90 days' }
    ]
  }
};

export default function VerificationInstrument() {
  const [selectedSkillKey, setSelectedSkillKey] = useState('react');
  const [displayedScore, setDisplayedScore] = useState(0);

  const activeSkill = SKILL_DATA[selectedSkillKey];

  // Smooth count-up animation when skill changes or mounts
  useEffect(() => {
    let startTimestamp = null;
    const duration = 1200; // ms
    const target = activeSkill.targetScore;
    const initial = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedScore(Math.round(initial + (target - initial) * eased));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [selectedSkillKey, activeSkill.targetScore]);

  return (
    <section className="section-verification" id="verification-section">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">Skill Verification // Real Code Proof</div>
          <h2 className="editorial-headline">
            SKILLS BACKED BY REAL CODE,<br />
            NOT BUZZWORDS.
          </h2>
          <p className="editorial-subhead">
            Every skill receives an honest confidence score based on your actual repositories, 
            commit cadence, and working code projects.
          </p>
        </div>

        {/* Skill selector tabs */}
        <div className="skill-selector-tabs">
          {Object.entries(SKILL_DATA).map(([key, item]) => (
            <button
              key={key}
              className={`skill-tab-btn ${selectedSkillKey === key ? 'active' : ''}`}
              onClick={() => setSelectedSkillKey(key)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="verification-split">
          {/* Main Verification Panel */}
          <div className="verification-inspect-panel">
            <div className="verification-main-metric">
              <div>
                <span className="label-caps">Verified Skill</span>
                <div className="verification-skill-title">{activeSkill.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {activeSkill.tagline}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="label-caps">Confidence</span>
                <div 
                  className="verification-confidence-value"
                  style={{ 
                    color: activeSkill.targetScore >= 80 
                      ? 'var(--accent-sage)' 
                      : activeSkill.targetScore >= 50 
                      ? 'var(--accent-gold)' 
                      : 'var(--accent-warm)' 
                  }}
                >
                  {displayedScore}%
                </div>
              </div>
            </div>

            {/* Checklist */}
            <ul className="verification-checklist">
              {activeSkill.checks.map((check, idx) => (
                <li key={idx} className="checklist-item">
                  <div className="checklist-left">
                    <span className="check-icon">
                      <Check size={16} strokeWidth={2.5} />
                    </span>
                    <span>{check.label}</span>
                  </div>
                  <span className="check-status-pill">
                    VERIFIED ✓
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contextual Narrative on the Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ borderLeft: '2px solid var(--accent-sage)', paddingLeft: '1.25rem' }}>
              <span className="label-caps" style={{ color: 'var(--accent-sage)' }}>VERIFIED PROOF // NO GUESSWORK</span>
              <h3 style={{ fontSize: '1.35rem', marginTop: '0.4rem', marginBottom: '0.6rem' }}>
                Backed by your actual code repositories.
              </h3>
              <p style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
                When you say you know <strong>{activeSkill.name}</strong>, ProfiQ doesn't just read the word on your resume. 
                We inspect how often you commit to {activeSkill.name} projects, evaluate your app architecture, 
                and verify that your code works.
              </p>
            </div>

            <div style={{ background: 'var(--bg-warm)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--border-soft)' }}>
              <span className="label-caps">Proof Breakdown for {activeSkill.name}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                {activeSkill.checks.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <CornerDownRight size={14} color="var(--accent-warm)" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.label}:</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{item.proof}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
