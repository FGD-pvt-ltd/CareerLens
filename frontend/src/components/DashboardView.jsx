import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, GitCommit, FileCode, Check, TrendingUp } from 'lucide-react';

/**
 * DASHBOARD VIEW
 * White background. Very clean.
 * Navigation: Overview, Evidence, Skills, Role Fit, Roadmap
 * Main: JOB READINESS 78 / 100 (+6 since last analysis)
 * Then: Skill confidence, Project evidence, Role fit, Consistency
 * Thin charts and elegant data visualization. Avoid cards everywhere. Whitespace & sections.
 */
export default function DashboardView({ onBackToStory }) {
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Evidence', 'Skills', 'Role Fit', 'Roadmap'];

  return (
    <div className="dashboard-view-wrapper">
      <div className="container">
        {/* Editorial Sub-bar & Context */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
              INSTRUMENT DOSSIER // CANDIDATE ID #8492
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '0.2rem' }}>
              Alex Morgan — Career Intelligence Audit
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-pill-outline btn-sm" onClick={onBackToStory} style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem' }}>
              ← Back to Scroll Story
            </button>
            <button className="btn-pill-primary btn-sm" onClick={() => window.print()} style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem' }}>
              Export Audit PDF
            </button>
          </div>
        </div>

        {/* Dashboard Navigation */}
        <div className="dash-nav">
          {tabs.map((tab) => (
            <div
              key={tab}
              className={`dash-nav-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Hero Score Row: JOB READINESS 78 / 100 */}
        <div className="dash-score-hero">
          <div>
            <span className="label-caps">Composite Assessment</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.25rem', marginTop: '0.5rem' }}>
              <span className="dash-score-num mono-token">78</span>
              <span style={{ fontSize: '2rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/ 100</span>
              <span className="dash-score-diff">
                +6 since last analysis
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Evaluated against 1,420 senior engineer benchmark profiles in your geographic market.
            </div>
          </div>

          {/* Thin Trajectory Chart (SVG) */}
          <div style={{ marginLeft: 'auto', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="label-caps">30-Day Score Trajectory</span>
            <svg width="220" height="48" viewBox="0 0 220 48" style={{ marginTop: '0.5rem', overflow: 'visible' }}>
              <line x1="0" y1="40" x2="220" y2="40" stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="3 3" />
              {/* Thin warm progress line */}
              <polyline
                fill="none"
                stroke="var(--accent-warm)"
                strokeWidth="2"
                points="0,38 40,36 80,32 120,33 160,25 200,14 220,10"
              />
              <circle cx="220" cy="10" r="3" fill="var(--accent-warm)" />
            </svg>
            <span className="mono-token" style={{ fontSize: '0.75rem', color: 'var(--accent-sage)', marginTop: '0.25rem' }}>
              72 → 78 (+8.3% velocity)
            </span>
          </div>
        </div>

        {/* 4 Essential Metrics Stack: Skill confidence, Project evidence, Role fit, Consistency */}
        <div className="dash-metrics-grid">
          <div className="dash-metric-cell">
            <span className="dash-cell-label">Skill Confidence</span>
            <div className="dash-cell-value">82%</div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
              14 verified / 18 claimed
            </span>
          </div>

          <div className="dash-metric-cell">
            <span className="dash-cell-label">Project Evidence</span>
            <div className="dash-cell-value">76%</div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
              4 production codebases
            </span>
          </div>

          <div className="dash-metric-cell">
            <span className="dash-cell-label">Role Fit</span>
            <div className="dash-cell-value">79%</div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
              Full Stack Developer target
            </span>
          </div>

          <div className="dash-metric-cell">
            <span className="dash-cell-label">Consistency</span>
            <div className="dash-cell-value">63%</div>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-warm)', display: 'block', marginTop: '0.2rem' }}>
              127 commits • Active cadence
            </span>
          </div>
        </div>

        {/* Tab Specific Views: Clean Sections & Whitespace */}
        {activeTab === 'Overview' && (
          <div style={{ marginTop: '3rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3.5rem' }}>
              {/* Left Column: Evidence Highlights */}
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-soft)' }}>
                  Verified Competencies & Evidence Audit
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <strong>React 18 & Frontend Architecture</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>64 commits across 2 client applications</div>
                    </div>
                    <span className="mono-token" style={{ color: 'var(--accent-sage)', fontWeight: 700 }}>91% CONFIDENCE</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <strong>TypeScript Rigor</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Zero "any" escapes in AST scan; strict mode enabled</div>
                    </div>
                    <span className="mono-token" style={{ color: 'var(--accent-sage)', fontWeight: 700 }}>84% CONFIDENCE</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <strong>Node.js & Express REST Services</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Authenticated routes, JWT flows, controller isolation</div>
                    </div>
                    <span className="mono-token" style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>76% CONFIDENCE</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <strong>Docker & Infrastructure (Gap)</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Missing automated compose & production orchestration</div>
                    </div>
                    <span className="mono-token" style={{ color: 'var(--accent-warm)', fontWeight: 700 }}>34% ATTENTION</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Key Recommendations */}
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-soft)' }}>
                  Actionable Strategy
                </h3>
                <div style={{ background: 'var(--bg-secondary)', padding: '1.75rem', borderRadius: '4px', border: '1px solid var(--border-soft)' }}>
                  <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>HIGH LEVERAGE MILESTONE</span>
                  <h4 style={{ fontSize: '1.1rem', marginTop: '0.4rem', marginBottom: '0.5rem' }}>
                    Containerize Full-Stack Repository
                  </h4>
                  <p style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    Your code demonstrates proficient application logic, but hiring managers require automated deployment readiness. 
                    Adding a multi-stage Dockerfile and GitHub Actions CI/CD will increase your composite score from <strong>78</strong> to <strong>86</strong>.
                  </p>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: '1.25rem' }}
                    onClick={() => setActiveTab('Roadmap')}
                  >
                    View Roadmap Steps →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Evidence' && (
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Ingested Repositories & Artifacts</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0' }}>REPOSITORY / ARTIFACT</th>
                  <th style={{ padding: '0.75rem 0' }}>PRIMARY STACK</th>
                  <th style={{ padding: '0.75rem 0' }}>COMMITS</th>
                  <th style={{ padding: '0.75rem 0' }}>TEST COVERAGE</th>
                  <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>VERDICT</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem 0' }}>
                    <strong>alex-morgan/career-intelligence</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Production web platform with custom AST analysis</div>
                  </td>
                  <td>React 18, TypeScript, Vite</td>
                  <td className="mono-token">64</td>
                  <td className="mono-token">68%</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent-sage)', fontWeight: 600 }}>VERIFIED ✓</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem 0' }}>
                    <strong>alex-morgan/distributed-service</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Express REST API & authentication layer</div>
                  </td>
                  <td>Node.js, PostgreSQL, Redis</td>
                  <td className="mono-token">38</td>
                  <td className="mono-token">42%</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent-sage)', fontWeight: 600 }}>VERIFIED ✓</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem 0' }}>
                    <strong>alex-morgan/design-system-tokens</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Published CSS component library</div>
                  </td>
                  <td>Vanilla CSS, HTML5, Web API</td>
                  <td className="mono-token">25</td>
                  <td className="mono-token">85%</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent-sage)', fontWeight: 600 }}>VERIFIED ✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Skills' && (
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Competency Matrix</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
              {[
                { name: 'React', level: 'Senior', score: 91, status: 'Strong', color: 'var(--accent-sage)' },
                { name: 'TypeScript', level: 'Mid-Senior', score: 84, status: 'Strong', color: 'var(--accent-sage)' },
                { name: 'Node.js', level: 'Mid', score: 76, status: 'Developing', color: 'var(--accent-gold)' },
                { name: 'SQL & Data Modeling', level: 'Mid', score: 68, status: 'Developing', color: 'var(--accent-gold)' },
                { name: 'System Design', level: 'Junior-Mid', score: 52, status: 'Developing', color: 'var(--accent-gold)' },
                { name: 'Docker / DevOps', level: 'Novice', score: 34, status: 'Attention', color: 'var(--accent-warm)' }
              ].map((s, idx) => (
                <div key={idx} style={{ padding: '1.25rem', border: '1px solid var(--border-soft)', borderRadius: '4px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{s.name}</strong>
                    <span className="mono-token" style={{ color: s.color, fontWeight: 700 }}>{s.score}%</span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--border-subtle)', borderRadius: '2px', margin: '0.6rem 0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.score}%`, backgroundColor: s.color }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>CLASSIFICATION: {s.level}</span>
                    <span>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Role Fit' && (
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Multi-Role Cross Analysis</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { role: 'Frontend Developer', match: 91, status: 'Exceeds Qualifications', gapDays: '0 days' },
                { role: 'Full Stack Developer', match: 79, status: 'Target Role (High Fit)', gapDays: '18 days' },
                { role: 'Backend Developer', match: 74, status: 'Qualified with Minor Upskilling', gapDays: '32 days' },
                { role: 'Data Analyst', match: 48, status: 'Requires Substantial Pivot', gapDays: '60+ days' },
                { role: 'ML Engineer', match: 42, status: 'Non-matching Domain', gapDays: '90+ days' }
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', border: '1px solid var(--border-soft)', borderRadius: '4px', background: 'var(--surface-card)' }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{r.role}</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.status}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="mono-token" style={{ fontSize: '1.25rem', fontWeight: 700, color: r.match >= 80 ? 'var(--accent-sage)' : r.match >= 65 ? 'var(--accent-gold)' : 'var(--accent-warm)' }}>
                      {r.match}%
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      GAP CLOSURE: ~{r.gapDays}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Roadmap' && (
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Action Plan for Full Stack Qualification (Target: 89/100)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { step: '1', title: 'Containerize express API with Dockerfile', duration: 'Week 1', status: 'In Progress' },
                { step: '2', title: 'Compose multi-container stack with PostgreSQL', duration: 'Week 2', status: 'Next' },
                { step: '3', title: 'Deploy container image to Cloud Run / ECS', duration: 'Week 3', status: 'Planned' },
                { step: '4', title: 'Automate build & test via GitHub Actions', duration: 'Week 4', status: 'Planned' },
                { step: '5', title: 'Trigger ProfiQ Re-Analysis & Generate Dossier', duration: 'Week 5', status: 'Goal' }
              ].map((m, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', border: '1px solid var(--border-soft)', borderRadius: '4px', background: 'var(--surface-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="mono-token" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                      {m.step}
                    </span>
                    <div>
                      <strong>{m.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Timeline: {m.duration}</div>
                    </div>
                  </div>
                  <span className="label-caps" style={{ color: idx === 0 ? 'var(--accent-warm)' : 'var(--text-muted)' }}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
