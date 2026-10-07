import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

/**
 * Section: READINESS SCORE
 * Clean, spacious, friendly, and 100% lag-free (pure lightweight SVG & CSS).
 * Friendly language: No robotic jargon.
 */
export default function ReadinessScoreSection({ onOpenModal }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [selectedRole, setSelectedRole] = useState('fullstack');

  const roleScores = {
    fullstack: { score: 78, label: 'Full Stack Engineer', fit: 'Strong Match (79%)', next: 'Add Docker container' },
    frontend: { score: 91, label: 'Frontend Engineer', fit: 'Ready to Apply (91%)', next: 'Profile is interview-ready' },
    backend: { score: 74, label: 'Backend Engineer', fit: 'Solid Foundation (74%)', next: 'Add message queue demo' },
  };

  const current = roleScores[selectedRole];

  const breakdown = [
    { label: 'Technical Depth (Code Quality)', val: 82, note: 'Clean TypeScript, hooks & architecture', color: 'var(--accent-sage)' },
    { label: 'Project Experience', val: 76, note: '4 working apps deployed', color: 'var(--accent-gold)' },
    { label: 'Role Alignment', val: current.score >= 85 ? 91 : current.score, note: current.fit, color: 'var(--accent-gold)' },
    { label: 'Recent Consistency', val: 63, note: '127 commits in past 6 months', color: 'var(--accent-warm)' }
  ];

  useEffect(() => {
    let startTimestamp = null;
    const duration = 900;
    const target = current.score;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(target * eased));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [selectedRole, current.score]);

  // SVG Gauge calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (animatedScore / 100)) * 0.75; // 270 degree arc

  return (
    <section className="section-readiness" id="readiness-section">
      <div className="readiness-container">
        {/* Section Header with Friendly Wording */}
        <div className="readiness-header">
          <div>
            <span className="template-top-pill" style={{ background: '#252523', border: '1px solid #3E3E3A', color: '#F6E79D' }}>
              <Sparkles size={13} color="#F6E79D" />
              Clear, honest feedback on your readiness
            </span>
            <h2 className="readiness-title" style={{ marginTop: '0.5rem' }}>
              Your Overall Readiness Score
            </h2>
          </div>
          <p style={{ color: 'var(--charcoal-text-secondary)', fontSize: '0.95rem', maxWidth: '420px', lineHeight: '1.6' }}>
            We look at your real code, projects, and target role expectations to give you an objective score—with zero guesswork.
          </p>
        </div>

        {/* Role Selector Tabs (Interactive & Fast) */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-text-secondary)', alignSelf: 'center', marginRight: '0.5rem' }}>
            Target role:
          </span>
          {Object.entries(roleScores).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setSelectedRole(key)}
              style={{
                background: selectedRole === key ? '#2A2A28' : 'transparent',
                border: selectedRole === key ? '1px solid var(--accent-warm)' : '1px solid #383834',
                color: selectedRole === key ? '#FFFFFF' : 'var(--charcoal-text-secondary)',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {data.label} ({data.score})
            </button>
          ))}
        </div>

        {/* 2-Column Split: Gauge on Left, Clear Breakdown on Right */}
        <div className="readiness-split">
          {/* Left: Ultra-Smooth SVG Gauge Block (Zero Lag) */}
          <div className="readiness-big-score" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto' }}>
              <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-135deg)' }}>
                {/* Background Track */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="#2D2D2A"
                  strokeWidth="14"
                  strokeDasharray={`${circumference * 0.75} ${circumference}`}
                  strokeLinecap="round"
                />
                {/* Active Score Arc */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="var(--accent-warm)"
                  strokeWidth="14"
                  strokeDasharray={`${circumference * 0.75} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s var(--ease-cinematic)' }}
                />
              </svg>

              {/* Number Center Display */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '3.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', lineHeight: 1, color: '#FFFFFF' }}>
                  {animatedScore}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--charcoal-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>
                  out of 100
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <span className="mono-token" style={{ color: 'var(--accent-sage)', fontWeight: 600, fontSize: '0.88rem' }}>
                {current.fit}
              </span>
              <div style={{ fontSize: '0.82rem', color: 'var(--charcoal-text-secondary)', marginTop: '0.35rem' }}>
                Market Average: 72 • Top 15% Percentile
              </div>
            </div>
          </div>

          {/* Right: Clean, Human Breakdown */}
          <div className="readiness-metrics-stack" style={{ gap: '1.5rem' }}>
            {breakdown.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.92rem' }}>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{item.label}</span>
                  <span className="mono-token" style={{ fontWeight: 700, color: '#FFFFFF' }}>{item.val}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: '#2D2D2A', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${item.val}%`,
                      backgroundColor: item.color,
                      transition: 'width 0.8s var(--ease-cinematic)'
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--charcoal-text-secondary)' }}>
                  {item.note}
                </span>
              </div>
            ))}

            {/* Next Recommendation Box */}
            <div style={{
              background: '#242422',
              border: '1px solid #383834',
              borderRadius: '6px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-warm)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 600 }}>
                  RECOMMENDED NEXT STEP
                </span>
                <div style={{ color: '#FFFFFF', fontSize: '0.92rem', fontWeight: 600, marginTop: '2px' }}>
                  {current.next}
                </div>
              </div>

              <button
                className="btn-pill-primary btn-sm"
                onClick={onOpenModal}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
              >
                Analyze My Code →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
