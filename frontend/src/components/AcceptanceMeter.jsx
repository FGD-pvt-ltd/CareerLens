import React from 'react';
import { AlertTriangle, CheckCircle2, ThumbsUp, Star, XCircle } from 'lucide-react';

/**
 * ACCEPTANCE METER
 * Measures and visualizes candidate employability & resume acceptance:
 * - Rejected (< 50)
 * - Needs Improvement (50 - 64)
 * - Good (65 - 79)
 * - Great (80 - 89)
 * - Excellent (90 - 100)
 */
export default function AcceptanceMeter({ score = 75, verdict = null, feedback = null, compact = false }) {
  // Determine verdict tier based on calculated score
  const getTier = (s) => {
    if (s < 50) {
      return {
        level: 1,
        title: 'Rejected',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#F87171',
        icon: XCircle,
        subtext: 'High Screening Risk • Major Core Deficits',
        defaultFeedback: 'The profile exhibits critical missing technical requirements or unverified signals. Foundational upskilling is necessary before submitting applications.',
      };
    }
    if (s < 65) {
      return {
        level: 2,
        title: 'Needs Improvement',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FCD34D',
        icon: AlertTriangle,
        subtext: 'Developing Candidate • Gaps in Core Stack / DSA',
        defaultFeedback: 'Basic qualifications present, but project depth and competitive coding evidence require improvement to pass competitive ATS screening.',
      };
    }
    if (s < 80) {
      return {
        level: 3,
        title: 'Good',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#93C5FD',
        icon: ThumbsUp,
        subtext: 'Standard Hireable • Meets Job Baseline',
        defaultFeedback: 'Solid candidate profile meeting standard entry-to-mid requirements with proven capability and clean foundational signals.',
      };
    }
    if (s < 90) {
      return {
        level: 4,
        title: 'Great',
        color: '#059669',
        bg: '#ECFDF5',
        border: '#6EE7B7',
        icon: CheckCircle2,
        subtext: 'High Readiness • Top Quartile Candidate',
        defaultFeedback: 'High readiness profile exceeding market averages with strong cross-source verification across projects and problem solving.',
      };
    }
    return {
      level: 5,
      title: 'Excellent',
      color: '#16A34A',
      bg: '#F0FDF4',
      border: '#86EFAC',
      icon: Star,
      subtext: 'Top Tier • Outstanding Employability',
      defaultFeedback: 'Exceptional profile demonstrating industry-ready codebases, verified algorithmic rigor, and top-tier problem solving capability.',
    };
  };

  const tier = getTier(score);
  const activeVerdict = verdict || tier.title;
  const activeFeedback = feedback || tier.defaultFeedback;
  const IconComponent = tier.icon;

  const tiers = [
    { label: 'Rejected', range: '<50', color: '#DC2626', level: 1 },
    { label: 'Needs Improvement', range: '50-64', color: '#D97706', level: 2 },
    { label: 'Good', range: '65-79', color: '#2563EB', level: 3 },
    { label: 'Great', range: '80-89', color: '#059669', level: 4 },
    { label: 'Excellent', range: '90-100', color: '#16A34A', level: 5 },
  ];

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-medium)',
        borderRadius: '6px',
        padding: compact ? '1rem' : '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Top Banner / Verdict Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <span className="label-caps" style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            METER OF ACCEPTANCE // EMPLOYABILITY VERDICT
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: tier.color,
                background: tier.bg,
                border: `1px solid ${tier.border}`,
              }}
            >
              <IconComponent size={15} />
              {activeVerdict.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              ({tier.subtext})
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="label-caps" style={{ fontSize: '0.72rem' }}>VERDICT INDEX</span>
          <div className="mono-token" style={{ fontSize: '1.25rem', fontWeight: 800, color: tier.color }}>
            {score} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
        </div>
      </div>

      {/* Segmented Meter Track */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '4px',
            background: 'var(--bg-secondary)',
            padding: '4px',
            borderRadius: '6px',
            border: '1px solid var(--border-soft)',
          }}
        >
          {tiers.map((t) => {
            const isActive = t.level === tier.level;
            const isPassed = t.level <= tier.level;

            return (
              <div
                key={t.label}
                style={{
                  height: '14px',
                  borderRadius: '3px',
                  backgroundColor: isActive
                    ? t.color
                    : isPassed
                    ? `${t.color}33`
                    : 'var(--border-medium)',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? `0 0 8px ${t.color}88` : 'none',
                }}
                title={`${t.label} (${t.range})`}
              />
            );
          })}
        </div>

        {/* Labels below the track */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '4px',
            marginTop: '0.45rem',
            textAlign: 'center',
          }}
        >
          {tiers.map((t) => {
            const isActive = t.level === tier.level;
            return (
              <div key={t.label}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? t.color : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.label}
                </div>
                <div
                  className="mono-token"
                  style={{
                    fontSize: '0.65rem',
                    color: isActive ? t.color : 'var(--text-muted)',
                  }}
                >
                  {t.range}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editorial Feedback / Justification */}
      {!compact && (
        <div
          style={{
            marginTop: '0.85rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.5',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Screening Rationale: </strong>
          {activeFeedback}
        </div>
      )}
    </div>
  );
}
