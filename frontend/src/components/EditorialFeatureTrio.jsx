import React from 'react';
import { Sparkles, FileSearch, GitPullRequest, Milestone, ArrowRight } from 'lucide-react';

/**
 * EditorialFeatureTrio
 * Directly modeled after the template's section:
 * "Condense hours long meetings into minutes" with centered badge and 3 feature cards.
 */
export default function EditorialFeatureTrio({ onOpenModal }) {
  const features = [
    {
      badge: '01 · EVIDENCE MATCHING',
      title: 'Turn Resume Claims Into Real Proof',
      description: 'Match claimed technologies against actual repository commits, code architecture, and package manifests.',
      metric: '18 Skills Checked',
      metricLabel: 'In under 30 seconds'
    },
    {
      badge: '02 · PROVEN BUILDS',
      title: 'Showcase Verifiable Output',
      description: 'Replace keyword stuffing with genuine commits and engineering consistency that speak for themselves.',
      metric: '100% Real Work',
      metricLabel: 'Zero resume guesswork'
    },
    {
      badge: '03 · MILESTONE ROADMAP',
      title: 'A Structured Plan to Level Up',
      description: 'Pinpoint exact missing dependencies and follow a prescriptive 4-week project sprint to close key gaps.',
      metric: '+12 Score Boost',
      metricLabel: 'Projected in 4 weeks'
    }
  ];

  return (
    <section className="editorial-trio-section">
      <div className="container">
        {/* Centered Pill Badge (from template) */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <span className="template-trust-pill">
            <Sparkles size={13} color="var(--accent-warm)" />
            The career instrument hiring managers & engineers trust
          </span>
        </div>

        {/* Big Editorial Headline */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 4rem' }}>
          <h2 className="template-display-headline">
            Skip weeks of interview guesswork. Show what you can actually do.
          </h2>
          <p className="editorial-subhead" style={{ margin: '1.25rem auto 0', maxWidth: '640px' }}>
            Resumes can exaggerate and coding tests feel artificial. ProfiQ connects your real work 
            to real job requirements, giving you clear feedback and a step-by-step path forward.
          </p>
        </div>

        {/* 3-Card Feature Grid */}
        <div className="trio-cards-grid">
          {features.map((item, idx) => (
            <div key={idx} className="trio-feature-card">
              <div className="trio-card-top">
                <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                  {item.badge}
                </span>
                <h3 className="trio-card-title">{item.title}</h3>
                <p className="trio-card-desc">{item.description}</p>
              </div>

              <div className="trio-card-stat-box">
                <div className="mono-token" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.metric}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.metricLabel}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
          <button className="btn-pill-primary" onClick={onOpenModal}>
            Audit Your Profile Now →
          </button>
        </div>
      </div>
    </section>
  );
}
