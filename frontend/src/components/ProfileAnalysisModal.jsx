import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, Loader2, GitBranch, FileText, Layers, Check } from 'lucide-react';

/**
 * Interactive Profile Analysis Modal
 * Guides user through: CLAIM → EVIDENCE → ANALYSIS → READINESS → GAP → PROGRESS
 */
const DEMO_PROFILES = [
  {
    name: 'Alex Morgan',
    role: 'Full Stack Developer',
    github: 'alex-morgan-dev',
    claimed: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    score: 78,
    repos: 4,
    commits: 127
  },
  {
    name: 'Priya Sharma',
    role: 'Frontend Developer',
    github: 'priyasharma-ui',
    claimed: ['React', 'CSS Architecture', 'Next.js', 'Web Performance'],
    score: 91,
    repos: 6,
    commits: 214
  },
  {
    name: 'Marcus Vance',
    role: 'Backend Developer',
    github: 'mvance-systems',
    claimed: ['Node.js', 'Go', 'Distributed Databases', 'Kafka'],
    score: 74,
    repos: 5,
    commits: 182
  }
];

export default function ProfileAnalysisModal({ isOpen, onClose, onCompleteAudit }) {
  const [candidateName, setCandidateName] = useState('Alex Morgan');
  const [githubUser, setGithubUser] = useState('alex-morgan-dev');
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [status, setStatus] = useState('idle'); // 'idle' | 'analyzing' | 'done'
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const pipelineSteps = [
    'Parsing resume claims & extracting stated competencies',
    'Ingesting GitHub repositories, commit logs, and AST structures',
    'Reconciling claims with verifiable code depth',
    'Calculating multi-factor Job Readiness Index',
    'Detecting role-specific skill gaps and blind spots',
    'Generating milestone trajectory roadmap'
  ];

  const handleStartAnalysis = () => {
    setStatus('analyzing');
    setCurrentStep(0);

    // Step through the pipeline
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= pipelineSteps.length - 1) {
          clearInterval(interval);
          setStatus('done');
          return prev;
        }
        return prev + 1;
      });
    }, 600);
  };

  const handleSelectPreset = (profile) => {
    setCandidateName(profile.name);
    setGithubUser(profile.github);
    setTargetRole(profile.role);
    setStatus('idle');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
          PROFIQ TELEMETRY INTAKE
        </span>
        <h2 style={{ fontSize: '1.6rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
          Analyse Profile Readiness
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
          Evaluate engineering claims against ground-truth evidence across repositories, commit cadence, and role specifications.
        </p>

        {status === 'idle' && (
          <div>
            {/* Quick Presets */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="label-caps">Select Evaluation Profile</span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {DEMO_PROFILES.map((p) => (
                  <button
                    key={p.name}
                    className={`btn btn-sm ${candidateName === p.name ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleSelectPreset(p)}
                  >
                    {p.name} ({p.role.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name / Identifier</label>
              <input
                type="text"
                className="form-input"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Morgan"
              />
            </div>

            <div className="form-group">
              <label className="form-label">GitHub Username or Repository URL</label>
              <input
                type="text"
                className="form-input"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
                placeholder="e.g. github.com/username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Role Archetype</label>
              <select
                className="form-input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="ML Engineer">ML Engineer</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={handleStartAnalysis}
            >
              Initiate Career Intelligence Audit →
            </button>
          </div>
        )}

        {status === 'analyzing' && (
          <div style={{ padding: '2rem 0', textAlign: 'center' }}>
            <Loader2 size={36} color="var(--accent-warm)" style={{ animation: 'spin 1.2s linear infinite', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Running Intelligence Engine...
            </h3>
            <p className="mono-token" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
              {pipelineSteps[currentStep]}
            </p>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              {pipelineSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', color: idx <= currentStep ? 'var(--text-primary)' : 'var(--text-light)' }}>
                  {idx < currentStep ? (
                    <Check size={14} color="var(--accent-sage)" />
                  ) : idx === currentStep ? (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-warm)' }} />
                  ) : (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--border-medium)' }} />
                  )}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'done' && (
          <div style={{ padding: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-sage)', marginBottom: '1.5rem' }}>
              <CheckCircle size={24} />
              <strong style={{ fontSize: '1.1rem' }}>Audit Completed & Reconciled</strong>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--border-soft)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span className="label-caps">Composite Score</span>
                  <div className="mono-token" style={{ fontSize: '2.5rem', fontWeight: 800 }}>
                    {candidateName === 'Priya Sharma' ? '91' : candidateName === 'Marcus Vance' ? '74' : '78'}
                    <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="label-caps">Target Role</span>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{targetRole}</div>
                  <span className="label-caps" style={{ color: 'var(--accent-sage)' }}>
                    {candidateName === 'Priya Sharma' ? '91% Role Fit' : candidateName === 'Marcus Vance' ? '74% Role Fit' : '79% Role Fit'}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                onClose();
                onCompleteAudit();
              }}
            >
              Open Full Intelligence Dashboard →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
