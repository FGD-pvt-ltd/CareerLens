import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ShieldCheck, 
  Compass, 
  Route, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  Code2,
  FolderGit2
} from 'lucide-react';

/**
 * CareerReadinessStudio
 * The unified, spacious, clutter-free Career Intelligence Instrument.
 * Combines ONLY what is really important:
 * 1. Verified Skills (Proof from real code)
 * 2. Target Role Matches (Fit & Gaps)
 * 3. 4-Week Action Plan (Checklist & Score Booster)
 */
export default function CareerReadinessStudio({ onOpenModal }) {
  const [activeTab, setActiveTab] = useState('skills'); // 'skills' | 'roles' | 'plan'
  const [selectedSkill, setSelectedSkill] = useState('react');
  const [selectedRole, setSelectedRole] = useState('fullstack');
  const [completedSteps, setCompletedSteps] = useState([0]); // Step 0 is baseline

  // ==========================================
  // DATA 1: VERIFIED SKILLS
  // ==========================================
  const SKILLS = {
    react: {
      name: 'React & Modern UI',
      score: 91,
      tagline: 'Custom hooks, state architecture, component lifecycle',
      repos: '4 Repositories Verified',
      commits: '22 commits in last 14 days',
      lines: '14,200 lines in production',
      checks: [
        { label: 'Resume Bullet', note: 'Listed under 4 years experience as Lead Frontend' },
        { label: 'GitHub Evidence', note: 'Production code with clean component trees and custom hooks' },
        { label: 'Architecture', note: 'Context providers, memoized selectors, accessible UI' },
        { label: 'Recent Cadence', note: 'Active weekly commits merged into main' }
      ]
    },
    typescript: {
      name: 'TypeScript',
      score: 84,
      tagline: 'Strict mode types, generics, discriminated unions',
      repos: '3 Repositories Verified',
      commits: '18 commits in last 30 days',
      lines: '8,400 typed lines',
      checks: [
        { label: 'Resume Bullet', note: 'Primary language across entire stack' },
        { label: 'GitHub Evidence', note: '98% strict TypeScript coverage with zero "any" shortcuts' },
        { label: 'Architecture', note: 'Type-safe API response models and utility generics' },
        { label: 'Recent Cadence', note: 'Refactor pull request merged 4 days ago' }
      ]
    },
    node: {
      name: 'Node.js & Express APIs',
      score: 76,
      tagline: 'REST endpoints, database migrations, middleware',
      repos: '2 Repositories Verified',
      commits: '14 commits in last 30 days',
      lines: '5,100 backend lines',
      checks: [
        { label: 'Resume Bullet', note: 'Backend microservice development tenure' },
        { label: 'GitHub Evidence', note: 'Modular controller architecture with input validation' },
        { label: 'Architecture', note: 'PostgreSQL migrations and JWT token auth pipeline' },
        { label: 'Recent Cadence', note: 'Active staging API endpoints verified' }
      ]
    },
    systemDesign: {
      name: 'System Design & Scalability',
      score: 52,
      tagline: 'Caching, horizontal scaling, cloud architecture',
      repos: '1 Repository Verified',
      commits: 'Occasional commits',
      lines: 'Early stage architecture',
      checks: [
        { label: 'Resume Bullet', note: 'Claimed high-level distributed architecture' },
        { label: 'GitHub Evidence', note: 'Single-node service; ready for Redis caching layer' },
        { label: 'Architecture', note: 'Solid modular code; needs documented benchmark' },
        { label: 'Recent Cadence', note: 'No deployment configs committed in last 60 days' }
      ]
    }
  };

  const activeSkillData = SKILLS[selectedSkill];

  // ==========================================
  // DATA 2: TARGET ROLES
  // ==========================================
  const ROLES = [
    {
      id: 'fullstack',
      name: 'Full Stack Developer',
      fitScore: 79,
      status: 'Strong Match (79%)',
      summary: 'Bridges frontend reactivity with robust server APIs and databases.',
      strongSkills: ['React 18', 'TypeScript', 'Node.js Express', 'PostgreSQL DB', 'REST APIs'],
      nextSkills: [
        { name: 'Docker & Compose', gain: '+4 pts' },
        { name: 'Cloud Deployment (AWS/Cloud Run)', gain: '+3 pts' },
        { name: 'CI/CD Pipeline', gain: '+4 pts' }
      ],
      recommendation: 'Strong engineering foundation. Adding a containerized cloud deployment will lift you to 89% Senior readiness.'
    },
    {
      id: 'frontend',
      name: 'Frontend Developer',
      fitScore: 91,
      status: 'Interview Ready (91%)',
      summary: 'Specialist in modern web performance, accessible UI, and clean design systems.',
      strongSkills: ['React 18 & Next.js', 'TypeScript', 'CSS & Design Tokens', 'Vite', 'Browser APIs'],
      nextSkills: [
        { name: 'Automated Visual Testing', gain: '+2 pts' },
        { name: 'Web Vitals Optimization', gain: '+2 pts' }
      ],
      recommendation: 'You exceed core market expectations for Senior Frontend engineering roles.'
    },
    {
      id: 'backend',
      name: 'Backend Developer',
      fitScore: 74,
      status: 'Solid Foundation (74%)',
      summary: 'Scalable service logic, database transactions, and high-throughput systems.',
      strongSkills: ['Node.js APIs', 'SQL & Migrations', 'Authentication', 'Microservice structure'],
      nextSkills: [
        { name: 'Redis Caching Layer', gain: '+4 pts' },
        { name: 'Message Broker (RabbitMQ)', gain: '+4 pts' }
      ],
      recommendation: 'Solid API capabilities. A high-concurrency demo or caching layer will complete this profile.'
    },
    {
      id: 'data',
      name: 'Data Analyst',
      fitScore: 48,
      status: 'Developing (48%)',
      summary: 'Statistical modeling, SQL warehousing, and executive dashboards.',
      strongSkills: ['SQL Basics', 'Data Wrangling', 'Clean Logic'],
      nextSkills: [
        { name: 'BigQuery / Snowflake', gain: '+6 pts' },
        { name: 'BI Dashboards (Looker/Tableau)', gain: '+5 pts' }
      ],
      recommendation: 'Core software skills exist. Adding data warehouse queries and dashboards will close the gap.'
    },
    {
      id: 'ml',
      name: 'ML Engineer',
      fitScore: 42,
      status: 'Developing (42%)',
      summary: 'Model training, vector databases, embeddings, and low-latency inference.',
      strongSkills: ['Python syntax', 'Code Architecture'],
      nextSkills: [
        { name: 'PyTorch Model Training', gain: '+8 pts' },
        { name: 'Vector Search & Embeddings', gain: '+6 pts' }
      ],
      recommendation: 'Solid code logic. Training and deploying an open-source model project will get you on the radar.'
    }
  ];

  const activeRoleData = ROLES.find(r => r.id === selectedRole) || ROLES[0];

  // ==========================================
  // DATA 3: 4-WEEK ACTION PLAN
  // ==========================================
  const MILESTONES = [
    {
      id: 0,
      title: 'Current Verified Baseline',
      desc: 'Frontend architecture & React mastery verified from your repositories.',
      time: 'Completed',
      points: '+0 pts',
      fixed: true
    },
    {
      id: 1,
      title: 'Containerize with Docker & Compose',
      desc: 'Write clean Dockerfiles for frontend Vite & backend Express, and link them with Docker Compose.',
      time: 'Week 1',
      points: '+4 pts',
      fixed: false
    },
    {
      id: 2,
      title: 'Deploy to Cloud (AWS or Cloud Run)',
      desc: 'Deploy the containerized service live with environment secrets and health check monitoring.',
      time: 'Week 2',
      points: '+3 pts',
      fixed: false
    },
    {
      id: 3,
      title: 'Automate GitHub Actions CI/CD',
      desc: 'Run unit tests, linting, and automated deploys on every merge request.',
      time: 'Week 3',
      points: '+4 pts',
      fixed: false
    }
  ];

  const toggleMilestone = (idx) => {
    if (idx === 0) return; // Cannot toggle baseline
    if (completedSteps.includes(idx)) {
      setCompletedSteps(completedSteps.filter(i => i !== idx));
    } else {
      setCompletedSteps([...completedSteps, idx]);
    }
  };

  // Calculate live boosted score
  const calculatedScore = 78 + 
    (completedSteps.includes(1) ? 4 : 0) + 
    (completedSteps.includes(2) ? 3 : 0) + 
    (completedSteps.includes(3) ? 4 : 0);

  // SVG Gauge calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * (calculatedScore / 100)) * 0.75;

  return (
    <section id="readiness-studio" style={{ padding: '6rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-soft)' }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
          <span className="template-top-pill">
            <Sparkles size={13} color="var(--accent-warm)" />
            The Career Readiness Studio
          </span>
          <h2 className="template-display-headline" style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>
            Everything you need. Zero clutter.
          </h2>
          <p className="editorial-subhead" style={{ margin: '1rem auto 0' }}>
            Explore your verified skills, test your fit across target engineering roles, 
            and follow an actionable checklist to boost your readiness.
          </p>

          {/* 3 Spacious Studio Tabs */}
          <div style={{
            display: 'inline-flex',
            background: '#FFFFFF',
            border: '1px solid var(--border-soft)',
            borderRadius: '9999px',
            padding: '5px',
            marginTop: '2.25rem',
            gap: '6px',
            boxShadow: 'var(--shadow-subtle)',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setActiveTab('skills')}
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'skills' ? 'var(--accent-forest)' : 'transparent',
                color: activeTab === 'skills' ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ShieldCheck size={15} />
              1. Verified Skills
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'roles' ? 'var(--accent-forest)' : 'transparent',
                color: activeTab === 'roles' ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Compass size={15} />
              2. Target Role Matches
            </button>

            <button
              onClick={() => setActiveTab('plan')}
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'plan' ? 'var(--accent-forest)' : 'transparent',
                color: activeTab === 'plan' ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Route size={15} />
              3. 4-Week Growth Plan
            </button>
          </div>
        </div>

        {/* ==================================================
            PANEL 1: VERIFIED SKILLS (PROOF)
            ================================================== */}
        {activeTab === 'skills' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.35fr',
            gap: '2.5rem',
            background: '#FFFFFF',
            border: '1px solid var(--border-soft)',
            borderRadius: '16px',
            padding: '2.75rem',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            {/* Left: Skill Selector List */}
            <div>
              <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                Select a Skill to Inspect Evidence
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
                {Object.entries(SKILLS).map(([key, item]) => {
                  const isSelected = selectedSkill === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedSkill(key)}
                      style={{
                        padding: '1.25rem 1.4rem',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid var(--accent-forest)' : '1px solid var(--border-soft)',
                        background: isSelected ? 'var(--bg-secondary)' : '#FFFFFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {item.repos}
                        </div>
                      </div>
                      <div style={{
                        background: item.score >= 80 ? 'var(--accent-sage-soft)' : item.score >= 60 ? 'var(--accent-gold-soft)' : 'var(--accent-warm-soft)',
                        color: item.score >= 80 ? 'var(--accent-sage)' : item.score >= 60 ? 'var(--accent-gold)' : 'var(--accent-warm)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        border: '1px solid currentColor'
                      }}>
                        {item.score}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Deep Dive Evidence Card */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-soft)',
              borderRadius: '12px',
              padding: '2rem 2.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-soft)', paddingBottom: '1.25rem' }}>
                  <div>
                    <span className="label-caps" style={{ color: 'var(--accent-sage)' }}>
                      VERIFIED FROM REPOSITORIES ✓
                    </span>
                    <h3 style={{ fontSize: '1.6rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                      {activeSkillData.name}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {activeSkillData.tagline}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-forest)', lineHeight: 1 }}>
                      {activeSkillData.score}%
                    </div>
                    <span className="label-caps" style={{ fontSize: '0.68rem' }}>Confidence</span>
                  </div>
                </div>

                {/* Evidence Bullets */}
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {activeSkillData.checks.map((check, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      background: '#FFFFFF',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-soft)'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-sage)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px',
                        flexShrink: 0
                      }}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{check.label}:</strong>{' '}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{check.note}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Code Telemetry Stats */}
                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border-soft)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span>• {activeSkillData.lines}</span>
                  <span>• {activeSkillData.commits}</span>
                </div>
              </div>

              <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button 
                  className="btn-pill-primary"
                  style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
                  onClick={() => setActiveTab('roles')}
                >
                  See How This Matches Target Roles →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            PANEL 2: TARGET ROLE MATCHES
            ================================================== */}
        {activeTab === 'roles' && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-soft)',
            borderRadius: '16px',
            padding: '2.75rem',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            {/* Top: 5 Role Archetype Selector Buttons */}
            <div>
              <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                Select an Engineering Role
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginTop: '1rem' }}>
                {ROLES.map((role) => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      style={{
                        padding: '1.15rem 1.2rem',
                        borderRadius: '10px',
                        border: isSelected ? '1.5px solid var(--accent-forest)' : '1px solid var(--border-soft)',
                        background: isSelected ? 'var(--bg-secondary)' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {isSelected ? 'TARGET SELECTED' : 'ROLE'}
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                        {role.name}
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-forest)', marginTop: '0.4rem' }}>
                        {role.fitScore}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom: Active Role Deep Dive */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-soft)',
              borderRadius: '12px',
              padding: '2.25rem',
              marginTop: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '1.25rem' }}>
                <div>
                  <span className="label-caps" style={{ color: 'var(--accent-forest)' }}>
                    ROLE EVALUATION // {activeRoleData.name.toUpperCase()}
                  </span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                    {activeRoleData.name} • {activeRoleData.fitScore}% Match
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '600px' }}>
                    {activeRoleData.summary}
                  </p>
                </div>
                <div style={{
                  background: activeRoleData.fitScore >= 80 ? 'var(--accent-sage-soft)' : 'var(--accent-gold-soft)',
                  color: activeRoleData.fitScore >= 80 ? 'var(--accent-sage)' : 'var(--accent-forest)',
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.88rem',
                  border: '1px solid currentColor'
                }}>
                  {activeRoleData.status}
                </div>
              </div>

              {/* Two columns: Skills You Have vs Skills to Learn Next */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginTop: '1.75rem' }}>
                <div>
                  <span className="label-caps" style={{ color: 'var(--accent-sage)' }}>
                    ✓ Verified Skills You Have
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem' }}>
                    {activeRoleData.strongSkills.map((s, idx) => (
                      <span key={idx} style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-soft)',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <Check size={13} color="var(--accent-sage)" strokeWidth={3} />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                    + Highest-Impact Skills to Learn
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem' }}>
                    {activeRoleData.nextSkills.map((s, idx) => (
                      <span key={idx} style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--accent-warm-border)',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--accent-warm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        <span>{s.name}</span>
                        <strong style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>({s.gain})</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation Footer */}
              <div style={{
                marginTop: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '640px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Advisor Note:</strong> {activeRoleData.recommendation}
                </div>
                <button 
                  className="btn-pill-primary"
                  style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
                  onClick={() => setActiveTab('plan')}
                >
                  View 4-Week Plan to Bridge Gaps →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            PANEL 3: 4-WEEK ACTION PLAN & SCORE BOOSTER
            ================================================== */}
        {activeTab === 'plan' && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-soft)',
            borderRadius: '16px',
            padding: '2.75rem',
            boxShadow: 'var(--shadow-subtle)',
            display: 'grid',
            gridTemplateColumns: '1.25fr 0.85fr',
            gap: '3rem',
            alignItems: 'center'
          }}>
            {/* Left: Interactive Checklist */}
            <div>
              <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                Targeted Project Checklist
              </span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                Check off steps to see your score climb
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Instead of wondering what to study, build these 3 verifiable projects to close key gaps.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.5rem' }}>
                {MILESTONES.map((step) => {
                  const isDone = completedSteps.includes(step.id);
                  return (
                    <div
                      key={step.id}
                      onClick={() => toggleMilestone(step.id)}
                      style={{
                        background: isDone ? 'var(--bg-secondary)' : '#FFFFFF',
                        border: isDone ? '1px solid var(--accent-sage-border)' : '1px solid var(--border-soft)',
                        borderRadius: '10px',
                        padding: '1.15rem 1.25rem',
                        cursor: step.fixed ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Custom Checkbox */}
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '5px',
                        border: isDone ? '2px solid var(--accent-sage)' : '2px solid var(--border-medium)',
                        backgroundColor: isDone ? 'var(--accent-sage)' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: '2px',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}>
                        {isDone && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}>
                            {step.title}
                          </span>
                          <span style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            color: isDone ? 'var(--accent-sage)' : 'var(--accent-warm)'
                          }}>
                            {step.points}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Radial Gauge Score Simulator */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-soft)',
              borderRadius: '14px',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <span className="label-caps" style={{ color: 'var(--accent-forest)' }}>
                PROJECTED READINESS SCORE
              </span>

              {/* Ultra-smooth SVG Radial Gauge */}
              <div style={{ position: 'relative', width: '180px', height: '180px', margin: '1.25rem auto' }}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  {/* Background Track */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="#E2DFC8"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * 0.25}
                    transform="rotate(135 90 90)"
                    strokeLinecap="round"
                  />
                  {/* Progress Indicator */}
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="var(--accent-forest)"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(135 90 90)"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                  />
                </svg>

                {/* Score Number in Center */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {calculatedScore}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    OUT OF 100
                  </div>
                </div>
              </div>

              {/* Status Outcome Banner */}
              <div style={{
                background: calculatedScore >= 85 ? 'var(--accent-sage-soft)' : '#FFFFFF',
                border: '1px solid var(--border-soft)',
                borderRadius: '8px',
                padding: '0.85rem 1.25rem',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                fontWeight: 600,
                marginTop: '0.5rem'
              }}>
                {calculatedScore >= 88 ? (
                  <span>🎉 Senior Readiness Achieved (+11 pts Gain)</span>
                ) : calculatedScore >= 82 ? (
                  <span>⚡ Mid-Level Gaps Closed (+{calculatedScore - 78} pts Gain)</span>
                ) : (
                  <span>Baseline Score (78/100)</span>
                )}
              </div>

              <div style={{ marginTop: '1.75rem', width: '100%' }}>
                <button
                  className="btn-pill-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={onOpenModal}
                >
                  Audit My Profile Now →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
