import React, { useState } from 'react';
import { FileText, GitBranch, FolderGit2, Activity, Layers, ArrowDown } from 'lucide-react';

/**
 * Section 02: EVIDENCE
 * Shows Resume, GitHub, Projects, Activity slowly converging into:
 * 4 PROJECTS • 127 COMMITS • RECENT ACTIVITY
 */
export default function EvidenceConvergence() {
  const [activeStream, setActiveStream] = useState('all');

  const streams = [
    {
      id: 'resume',
      title: 'Resume Skills',
      icon: <FileText size={18} />,
      badge: 'RESUME FILE',
      description: 'Extracted 18 skill bullets and work experience from your resume.',
      signal: 'Self-Reported'
    },
    {
      id: 'github',
      title: 'GitHub Commits',
      icon: <GitBranch size={18} />,
      badge: 'GITHUB API',
      description: 'Analyzed commit history, pull requests, and code lines across repositories.',
      signal: 'Code Frequency'
    },
    {
      id: 'projects',
      title: 'Working Projects',
      icon: <FolderGit2 size={18} />,
      badge: 'LIVE APPS',
      description: 'Evaluated system complexity, dependencies, and deployed applications.',
      signal: 'Project Depth'
    },
    {
      id: 'activity',
      title: 'Recent Activity',
      icon: <Activity size={18} />,
      badge: 'CONSISTENCY',
      description: 'Verified continuous engineering activity over the last 6 months.',
      signal: 'Recent Cadence'
    }
  ];

  return (
    <section className="section-evidence" id="evidence-section">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">Evidence Convergence // 4 Signal Sources</div>
          <h2 className="editorial-headline">
            ALL YOUR WORK.<br />
            ONE VERIFIED PROFILE.
          </h2>
          <p className="editorial-subhead">
            ProfiQ brings together your resume, GitHub commits, deployed apps, and recent contributions 
            into a single clear profile that speaks for itself.
          </p>
        </div>

        {/* The 4 Evidence Inputs */}
        <div className="evidence-converge-grid">
          {streams.map((item) => (
            <div 
              key={item.id} 
              className={`evidence-card ${activeStream === item.id ? 'active' : ''}`}
              onClick={() => setActiveStream(activeStream === item.id ? 'all' : item.id)}
            >
              <div className="evidence-icon">
                {item.icon}
              </div>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span className="evidence-tag">{item.badge}</span>
                <span className="label-caps" style={{ fontSize: '0.68rem' }}>{item.signal}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Convergence Indicator */}
        <div style={{ textAlign: 'center', margin: '2.5rem 0 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <span style={{ height: '1px', width: '32px', backgroundColor: 'var(--border-medium)' }}></span>
            <span className="label-caps">Convergence Point</span>
            <ArrowDown size={14} color="var(--accent-warm)" />
            <span style={{ height: '1px', width: '32px', backgroundColor: 'var(--border-medium)' }}></span>
          </div>
        </div>

        {/* The Converged Outcome Banner */}
        <div className="evidence-outcome-banner">
          <div className="outcome-stat-block">
            <span className="outcome-number">4</span>
            <span className="outcome-label">Verified Projects</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Full production repositories
            </span>
          </div>

          <div className="outcome-stat-block">
            <span className="outcome-number">127</span>
            <span className="outcome-label">Scored Commits</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Syntactically analyzed diffs
            </span>
          </div>

          <div className="outcome-stat-block">
            <span className="outcome-number">36h</span>
            <span className="outcome-label">Recent Activity</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-sage)', fontWeight: '600', marginTop: '0.25rem' }}>
              Active weekly streak maintained
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
