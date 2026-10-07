import React from 'react';

/**
 * Pipeline Flow Bar
 * Communicates: CLAIM → EVIDENCE → ANALYSIS → READINESS → GAP → PROGRESS
 * The core career intelligence instrument sequence.
 */
export default function PipelineFlowBar({ onSelectView, activeView }) {
  const steps = [
    { num: '01', name: 'RESUME CHECK', view: 'skills' },
    { num: '02', name: 'CODE EVIDENCE', view: 'skills' },
    { num: '03', name: 'ROLE MATCHES', view: 'roles' },
    { num: '04', name: 'SKILL GAPS', view: 'roles' },
    { num: '05', name: 'ACTION PLAN', view: 'roadmap' }
  ];

  return (
    <div className="pipeline-bar">
      <div className="pipeline-items">
        {steps.map((step, idx) => {
          const isActive = activeView === step.view;
          return (
            <React.Fragment key={step.name}>
              <button
                type="button"
                onClick={() => onSelectView && onSelectView(step.view)}
                className={`pipeline-step ${isActive ? 'active' : ''}`}
                style={{
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--accent-warm)' : 'var(--text-secondary)'
                }}
              >
                <span className="step-num" style={{
                  background: isActive ? 'var(--accent-warm)' : 'var(--border-soft)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '0.7rem'
                }}>
                  {step.num}
                </span>
                <span>{step.name}</span>
              </button>
              {idx < steps.length - 1 && (
                <span className="pipeline-arrow" style={{ color: 'var(--text-muted)' }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
