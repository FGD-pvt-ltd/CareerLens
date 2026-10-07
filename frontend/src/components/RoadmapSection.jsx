import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight, Trophy } from 'lucide-react';

/**
 * Section: ROADMAP / ACTION PLAN
 * Interactive milestone tracker where users can check off items and watch their score climb!
 * 100% lag-free (pure React + SVG).
 */
export default function RoadmapSection({ onOpenModal }) {
  const [completedSteps, setCompletedSteps] = useState([0]); // first step completed

  const milestones = [
    {
      title: 'Current Baseline',
      desc: 'Frontend architecture & React mastery verified. Baseline score: 78/100.',
      time: 'Completed',
      points: '+0'
    },
    {
      title: 'Add Docker & Compose',
      desc: 'Build clean Dockerfiles for frontend Vite & backend Express API.',
      time: '1 week',
      points: '+4 pts'
    },
    {
      title: 'Deploy to Cloud (AWS or Cloud Run)',
      desc: 'Set up live container deployment with environment secrets and health checks.',
      time: '1 week',
      points: '+3 pts'
    },
    {
      title: 'Set up GitHub Actions CI/CD',
      desc: 'Automate linting, unit tests, and deploy on pull request merge.',
      time: '4 days',
      points: '+4 pts'
    }
  ];

  const toggleStep = (idx) => {
    if (idx === 0) return; // cannot uncheck baseline
    if (completedSteps.includes(idx)) {
      setCompletedSteps(completedSteps.filter((i) => i !== idx));
    } else {
      setCompletedSteps([...completedSteps, idx]);
    }
  };

  const calculatedScore = 78 + (completedSteps.includes(1) ? 4 : 0) + (completedSteps.includes(2) ? 3 : 0) + (completedSteps.includes(3) ? 4 : 0);

  return (
    <section className="section-roadmap" id="roadmap-section" style={{ padding: '6rem 0' }}>
      <div className="container">
        {/* Header with Plain English */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
          <span className="template-top-pill">
            <Sparkles size={13} color="var(--accent-warm)" />
            Your step-by-step growth path
          </span>
          <h2 className="template-display-headline" style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>
            Turn skill gaps into real progress.
          </h2>
          <p className="editorial-subhead" style={{ margin: '1rem auto 0' }}>
            Instead of wondering what to study, follow a targeted project checklist. 
            Check off steps below to see how your readiness score will climb.
          </p>
        </div>

        {/* 2-Column Spacious Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3.5rem', alignItems: 'flex-start' }}>
          {/* Left: Interactive Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {milestones.map((step, idx) => {
              const isDone = completedSteps.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  style={{
                    background: isDone ? 'var(--bg-secondary)' : '#FFFFFF',
                    border: isDone ? '1px solid var(--accent-sage-border)' : '1px solid var(--border-soft)',
                    borderRadius: '8px',
                    padding: '1.4rem 1.5rem',
                    cursor: idx === 0 ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.2rem',
                    transition: 'all 0.2s ease',
                    boxShadow: isDone ? 'none' : 'var(--shadow-subtle)'
                  }}
                >
                  {/* Custom Checkbox */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: isDone ? '2px solid var(--accent-sage)' : '2px solid var(--border-medium)',
                      backgroundColor: isDone ? 'var(--accent-sage)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isDone && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                  </div>

                  {/* Step Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.05rem', color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {step.title}
                      </strong>
                      <span className="mono-token" style={{ fontSize: '0.8rem', color: isDone ? 'var(--accent-sage)' : 'var(--accent-warm)', fontWeight: 700 }}>
                        {step.points}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: '1.5' }}>
                      {step.desc}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>TIMELINE: {step.time}</span>
                      {idx > 0 && <span>{isDone ? 'COMPLETED ✓' : 'CLICK TO SIMULATE'}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Interactive Score Projection Card */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-soft)',
              borderRadius: '12px',
              padding: '2.25rem',
              boxShadow: 'var(--shadow-card)',
              position: 'sticky',
              top: '100px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-warm)' }}>
              <Trophy size={18} />
              <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                PROJECTED TARGET SCORE
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '1rem 0 0.5rem' }}>
              <span className="mono-token" style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {calculatedScore}
              </span>
              <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/100</span>
              {calculatedScore > 78 && (
                <span className="mono-token" style={{ fontSize: '0.88rem', color: 'var(--accent-sage)', fontWeight: 700, marginLeft: '0.5rem' }}>
                  (+{calculatedScore - 78} pts unlocked!)
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {calculatedScore >= 89
                ? '🎉 Congratulations! At 89/100, your profile meets senior criteria for 95% of top tech companies.'
                : 'Complete the remaining checklist milestones to reach senior qualification (85+ target).'}
            </p>

            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                className="btn-pill-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onOpenModal}
              >
                Generate My Custom Roadmap →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
