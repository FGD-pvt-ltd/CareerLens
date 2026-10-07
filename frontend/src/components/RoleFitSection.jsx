import React, { useState } from 'react';

/**
 * Section 05: ROLE FIT
 * White background.
 * "READY FOR WHAT?"
 * Show role cards:
 * - Full Stack Developer
 * - Frontend Developer
 * - Backend Developer
 * - Data Analyst
 * - ML Engineer
 * Selecting a role subtly changes: Role Fit, Required Skills, Skill Gaps.
 */
const ROLES = [
  {
    id: 'fullstack',
    name: 'Full Stack Developer',
    fitScore: 79,
    description: 'Bridges frontend reactivity with robust server services and databases.',
    requiredSkills: ['React 18', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST/GraphQL'],
    skillGaps: ['Docker & Containerization', 'Cloud Infrastructure (AWS/GCP)', 'End-to-End Testing'],
    verdict: 'Strong engineering foundation. Adding containerized deployment will lift you to senior readiness.'
  },
  {
    id: 'frontend',
    name: 'Frontend Developer',
    fitScore: 91,
    description: 'Expertise in modern web performance, design system execution, and UX architecture.',
    requiredSkills: ['React', 'TypeScript', 'CSS Architecture', 'Next.js/Vite', 'Browser APIs', 'State Management'],
    skillGaps: ['WebAssembly Performance', 'Automated Visual Regression'],
    verdict: 'Ready to apply! You exceed core expectations for senior UI engineering roles.'
  },
  {
    id: 'backend',
    name: 'Backend Developer',
    fitScore: 74,
    description: 'Scalable service logic, distributed database transactions, and high-throughput systems.',
    requiredSkills: ['Node.js/Go', 'PostgreSQL/Redis', 'System Architecture', 'Microservices', 'Message Queues'],
    skillGaps: ['Distributed Transactions (Kafka/RabbitMQ)', 'System Sharding & Concurrency'],
    verdict: 'Solid API capabilities. A high-concurrency demo or message queue project will complete this profile.'
  },
  {
    id: 'data',
    name: 'Data Analyst',
    fitScore: 48,
    description: 'Statistical modeling, cohort analysis, SQL warehousing, and executive dashboards.',
    requiredSkills: ['Advanced SQL', 'Python / Pandas', 'Tableau / Looker', 'Statistics', 'ETL Pipelines'],
    skillGaps: ['Statistical Significance Modeling', 'Warehouse ELT (BigQuery/Snowflake)', 'BI Visualization'],
    verdict: 'Core programming is solid. Adding SQL warehousing and analytics dashboards will close the gap.'
  },
  {
    id: 'ml',
    name: 'ML Engineer',
    fitScore: 42,
    description: 'Model lifecycle training, embeddings, vector indexing, and low-latency inference pipelines.',
    requiredSkills: ['PyTorch / JAX', 'Vector Databases', 'Model Quantization', 'CUDA / GPU Optimization'],
    skillGaps: ['PyTorch Deep Learning', 'Vector Search & Embeddings', 'Model Serving Latency Tuning'],
    verdict: 'Solid code logic. Training and deploying an open-source model project will get you on the radar.'
  }
];

export default function RoleFitSection() {
  const [selectedRoleId, setSelectedRoleId] = useState('fullstack');
  const activeRole = ROLES.find((r) => r.id === selectedRoleId) || ROLES[0];

  return (
    <section className="section-rolefit" id="rolefit-section">
      <div className="container">
        <div className="section-header">
          <div className="section-tag">Role Matcher // Market Fit</div>
          <h2 className="editorial-headline">
            SEE WHERE YOU FIT BEST
          </h2>
          <p className="editorial-subhead">
            Readiness depends on the job you want. Select a role below to see how your verified skills 
            match up, what strengths you have, and the 2 or 3 skills to learn next.
          </p>
        </div>

        {/* The 5 Role Cards */}
        <div className="role-cards-grid">
          {ROLES.map((role) => {
            const isSelected = role.id === selectedRoleId;
            return (
              <button
                key={role.id}
                className={`role-card ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <div>
                  <span className="label-caps" style={{ fontSize: '0.7rem' }}>
                    {isSelected ? 'Selected' : 'Engineering Role'}
                  </span>
                  <div className="role-card-name" style={{ marginTop: '0.35rem' }}>
                    {role.name}
                  </div>
                </div>
                <div>
                  <div className="role-card-match">
                    {role.fitScore}%
                  </div>
                  <span className="label-caps" style={{ fontSize: '0.68rem', color: isSelected ? 'var(--accent-warm)' : 'var(--text-muted)' }}>
                    Match Score
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Role Breakdown */}
        <div className="role-detail-display">
          <div className="role-detail-head">
            <div>
              <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                Target Role Details
              </span>
              <h3 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                {activeRole.name} • {activeRole.fitScore}% Match
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                {activeRole.description}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="label-caps">Readiness Status</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {activeRole.fitScore >= 80 ? 'Interview Ready ✓' : activeRole.fitScore >= 65 ? 'Strong Match with 1–2 Gaps' : 'Requires Focus on Core Skills'}
              </div>
            </div>
          </div>

          <div className="role-breakdown-cols">
            <div>
              <span className="label-caps">Skills You Have & Need</span>
              <div className="skill-pill-wrap">
                {activeRole.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="skill-pill required">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="label-caps" style={{ color: 'var(--accent-warm)' }}>
                Skills to Learn Next
              </span>
              <div className="skill-pill-wrap">
                {activeRole.skillGaps.map((gap, idx) => (
                  <span key={idx} className="skill-pill gap">
                    + {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-soft)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <strong>Recommendation:</strong> {activeRole.verdict}
          </div>
        </div>
      </div>
    </section>
  );
}
