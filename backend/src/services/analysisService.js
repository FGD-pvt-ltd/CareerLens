/**
 * ProfiQ Career Intelligence & Readiness Analysis Engine
 * Calculates multi-factor evidence-based readiness scores across:
 * - Skill Alignment (Target Role matching)
 * - Project Evidence & GitHub
 * - Coding Platform Rigor (LeetCode, Codeforces, HackerRank, CodeChef)
 * - Academic Rigor (CGPA, degree, branch)
 * - Document Completeness (Parsed Resume/CV machine text)
 */

const ROLE_TAXONOMY = {
  'Full Stack Developer': {
    coreSkills: ['react', 'node.js', 'express', 'javascript', 'typescript', 'mongodb', 'postgresql', 'sql', 'git', 'rest api', 'docker', 'redux', 'next.js', 'html', 'css'],
    alternateRoles: [
      { role: 'Frontend Developer', matchOffset: 5, gapDays: '10 days' },
      { role: 'Backend Developer', matchOffset: -5, gapDays: '18 days' },
      { role: 'Data Analyst', matchOffset: -28, gapDays: '60+ days' },
      { role: 'ML Engineer', matchOffset: -35, gapDays: '90+ days' },
    ],
  },
  'Frontend Developer': {
    coreSkills: ['react', 'javascript', 'typescript', 'html', 'css', 'next.js', 'tailwind', 'redux', 'vue', 'ui/ux', 'rest api', 'git', 'vite', 'webpack'],
    alternateRoles: [
      { role: 'Full Stack Developer', matchOffset: -12, gapDays: '25 days' },
      { role: 'Backend Developer', matchOffset: -25, gapDays: '45 days' },
      { role: 'Data Analyst', matchOffset: -35, gapDays: '75+ days' },
      { role: 'ML Engineer', matchOffset: -40, gapDays: '90+ days' },
    ],
  },
  'Backend Developer': {
    coreSkills: ['node.js', 'express', 'python', 'java', 'go', 'postgresql', 'mongodb', 'sql', 'redis', 'docker', 'rest api', 'system design', 'microservices', 'git', 'kubernetes'],
    alternateRoles: [
      { role: 'Full Stack Developer', matchOffset: -8, gapDays: '20 days' },
      { role: 'Frontend Developer', matchOffset: -24, gapDays: '40 days' },
      { role: 'Data Analyst', matchOffset: -20, gapDays: '45 days' },
      { role: 'ML Engineer', matchOffset: -25, gapDays: '60 days' },
    ],
  },
  'Data Analyst': {
    coreSkills: ['python', 'sql', 'pandas', 'numpy', 'powerbi', 'tableau', 'excel', 'statistics', 'data visualization', 'r', 'etl', 'postgresql'],
    alternateRoles: [
      { role: 'ML Engineer', matchOffset: -15, gapDays: '35 days' },
      { role: 'Backend Developer', matchOffset: -25, gapDays: '50 days' },
      { role: 'Full Stack Developer', matchOffset: -35, gapDays: '70+ days' },
      { role: 'Frontend Developer', matchOffset: -40, gapDays: '90+ days' },
    ],
  },
  'ML Engineer': {
    coreSkills: ['python', 'pytorch', 'tensorflow', 'scikit-learn', 'pandas', 'numpy', 'deep learning', 'machine learning', 'nlp', 'computer vision', 'mlops', 'docker', 'math'],
    alternateRoles: [
      { role: 'Data Analyst', matchOffset: 10, gapDays: '10 days' },
      { role: 'Backend Developer', matchOffset: -18, gapDays: '40 days' },
      { role: 'Full Stack Developer', matchOffset: -30, gapDays: '65 days' },
      { role: 'Frontend Developer', matchOffset: -45, gapDays: '90+ days' },
    ],
  },
};

/**
 * Perform realistic multi-aspect profile evaluation
 */
function evaluateProfile(profile) {
  const targetRoleName = profile?.targetRole?.roleName || 'Full Stack Developer';
  const roleData = ROLE_TAXONOMY[targetRoleName] || ROLE_TAXONOMY['Full Stack Developer'];

  // Normalize candidate's skills
  const candidateSkills = (profile?.skills || []).map((s) =>
    (typeof s === 'string' ? s : s?.name || '').trim().toLowerCase()
  ).filter(Boolean);

  // Resume text token lookup if document exists
  let documentText = '';
  if (profile?.documents && profile.documents.length > 0) {
    documentText = profile.documents.map((d) => d.extractedText || '').join(' ').toLowerCase();
  }

  // 1. Skill Alignment Aspect (35%)
  const matchedCoreSkills = roleData.coreSkills.filter((req) => {
    return candidateSkills.some((cs) => cs.includes(req) || req.includes(cs)) ||
      (documentText && documentText.includes(req));
  });

  const skillMatchRatio = Math.min(100, Math.round((matchedCoreSkills.length / Math.max(roleData.coreSkills.length * 0.65, 1)) * 100));
  const skillScore = Math.max(25, Math.min(98, skillMatchRatio));

  // 2. Project Evidence & GitHub Aspect (25%)
  let projectPoints = 30; // base
  const projects = profile?.projects || [];
  if (projects.length >= 1) projectPoints += 20;
  if (projects.length >= 2) projectPoints += 15;
  if (projects.some((p) => p.githubUrl || p.liveUrl)) projectPoints += 15;
  if (profile?.github?.username || profile?.github?.profileUrl) projectPoints += 15;
  const projectScore = Math.max(25, Math.min(98, projectPoints));

  // 3. Coding Platform & DSA Rigor Aspect (20%)
  let codingScore = 35; // default low if no profile given
  const codingProfiles = profile?.codingProfiles || [];
  const primaryCoding = codingProfiles[0];

  if (primaryCoding && (primaryCoding.profileUrl || primaryCoding.username)) {
    codingScore = 65; // base for verified profile presence
    const solved = primaryCoding.problemsSolved;
    const rating = primaryCoding.rating;

    if (solved >= 400 || rating >= 1850) {
      codingScore = 96;
    } else if (solved >= 250 || rating >= 1650) {
      codingScore = 88;
    } else if (solved >= 120 || rating >= 1450) {
      codingScore = 78;
    } else if (solved >= 50) {
      codingScore = 72;
    }
  }

  // 4. Academic Rigor Aspect (10%)
  let academicScore = 70;
  const cgpa = profile?.college?.cgpa;
  if (cgpa !== undefined && cgpa !== null) {
    if (cgpa >= 9.0) academicScore = 95;
    else if (cgpa >= 8.0) academicScore = 85;
    else if (cgpa >= 7.0) academicScore = 75;
    else if (cgpa >= 6.0) academicScore = 60;
    else academicScore = 45;
  }

  // 5. Document Rigor Aspect (10%)
  let docScore = 40;
  const documents = profile?.documents || [];
  if (documents.length > 0) {
    docScore = 70;
    if (documents.some((d) => d.extractionStatus === 'completed' && (d.fileSize || 0) > 0)) {
      docScore = 92;
    }
  }

  // Weighted Composite Assessment Score
  const readinessScore = Math.round(
    skillScore * 0.35 +
    projectScore * 0.25 +
    codingScore * 0.20 +
    academicScore * 0.10 +
    docScore * 0.10
  );

  // Meter of Acceptance Judgment
  let acceptanceVerdict = 'Good';
  let acceptanceColor = '#3B82F6';
  let acceptanceFeedback = '';
  let acceptanceLevel = 3; // 1 to 5

  if (readinessScore < 50) {
    acceptanceVerdict = 'Rejected';
    acceptanceColor = '#EF4444';
    acceptanceLevel = 1;
    acceptanceFeedback = 'Critical skill deficits or missing verifiable evidence. Profile does not meet minimum industry screening criteria.';
  } else if (readinessScore < 65) {
    acceptanceVerdict = 'Needs Improvement';
    acceptanceColor = '#F59E0B';
    acceptanceLevel = 2;
    acceptanceFeedback = 'Foundational competency present, but lacks core project depth, competitive DSA signals, or framework mastery.';
  } else if (readinessScore < 80) {
    acceptanceVerdict = 'Good';
    acceptanceColor = '#3B82F6';
    acceptanceLevel = 3;
    acceptanceFeedback = 'Solid candidate profile meeting standard entry-to-mid requirements with confirmed technical competencies.';
  } else if (readinessScore < 90) {
    acceptanceVerdict = 'Great';
    acceptanceColor = '#10B981';
    acceptanceLevel = 4;
    acceptanceFeedback = 'High-readiness profile exceeding typical market benchmarks with strong cross-source verification.';
  } else {
    acceptanceVerdict = 'Excellent';
    acceptanceColor = '#059669';
    acceptanceLevel = 5;
    acceptanceFeedback = 'Top-tier portfolio demonstrating exceptional full-stack capability, rigorous DSA mastery, and production readiness.';
  }

  // Competency Matrix based on candidate's actual input
  const defaultCompetencies = [
    { name: candidateSkills[0] ? candidateSkills[0].toUpperCase() : 'Core Stack', level: readinessScore > 75 ? 'Strong' : 'Developing', score: Math.min(95, skillScore + 5), status: 'Verified', color: 'var(--accent-sage)' },
    { name: candidateSkills[1] ? candidateSkills[1].toUpperCase() : 'System Logic', level: readinessScore > 70 ? 'Mid' : 'Junior', score: Math.min(90, skillScore - 3), status: 'Verified', color: 'var(--accent-sage)' },
    { name: primaryCoding?.platform || 'DSA & Algorithms', level: codingScore > 75 ? 'Proficient' : 'Developing', score: codingScore, status: codingScore > 70 ? 'Strong' : 'Attention', color: codingScore > 70 ? 'var(--accent-sage)' : 'var(--accent-warm)' },
    { name: 'Architecture & CI/CD', level: projectScore > 70 ? 'Applied' : 'Novice', score: Math.max(35, projectScore - 12), status: projectScore > 70 ? 'Developing' : 'Attention', color: 'var(--accent-gold)' },
  ];

  // Tailored recommendations
  const recommendations = [];
  if (codingScore < 75) {
    recommendations.push({
      title: 'Elevate Competitive Problem Solving',
      description: `Link an active LeetCode/Codeforces profile and target 150+ solved problems across Graphs, Dynamic Programming, and System Design to boost your score by +8 points.`,
      impact: '+8 PTS IMPACT',
    });
  }
  if (projectScore < 80) {
    recommendations.push({
      title: 'Deploy Production Live Demo & CI/CD',
      description: 'Host your featured project on a live cloud domain (e.g. Vercel / Render / AWS) with automated GitHub Actions testing to verify deployment capability.',
      impact: '+6 PTS IMPACT',
    });
  }
  if (skillScore < 80) {
    recommendations.push({
      title: `Master ${targetRoleName} Core Stack`,
      description: `Incorporate missing industry standards (${roleData.coreSkills.slice(0, 3).join(', ')}) into your active codebases.`,
      impact: '+10 PTS IMPACT',
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Contribute to High-Impact Open Source',
      description: 'Engage with top-tier open-source ecosystems to showcase large-scale distributed collaboration and architectural leadership.',
      impact: '+4 PTS IMPACT',
    });
  }

  // Cross-Role Fit
  const crossRoleFit = [
    {
      role: targetRoleName,
      match: readinessScore,
      status: `Target Role (${acceptanceVerdict})`,
      gapDays: readinessScore >= 80 ? '0 days' : readinessScore >= 65 ? '15 days' : '45 days',
    },
    ...roleData.alternateRoles.map((alt) => ({
      role: alt.role,
      match: Math.max(30, Math.min(95, readinessScore + alt.matchOffset)),
      status: (readinessScore + alt.matchOffset) >= 75 ? 'Qualified Transfer' : 'Requires Upskilling',
      gapDays: alt.gapDays,
    })),
  ];

  // Custom 5-step milestone roadmap
  const roadmap = [
    { step: '1', title: `Optimize ${primaryCoding?.platform || 'LeetCode'} DSA (Arrays, Trees, Graphs)`, duration: 'Week 1-2', status: codingScore >= 75 ? 'Completed' : 'In Progress' },
    { step: '2', title: `Build production-grade ${targetRoleName} portfolio piece`, duration: 'Week 2-3', status: projectScore >= 80 ? 'Completed' : 'Next' },
    { step: '3', title: 'Add Docker containerization & GitHub CI/CD pipeline', duration: 'Week 3-4', status: 'Planned' },
    { step: '4', title: 'Sync Resume & GitHub telemetry with ProfiQ Auditor', duration: 'Week 4-5', status: 'Planned' },
    { step: '5', title: 'Reach Top 10% Employability Percentile benchmark', duration: 'Week 5', status: 'Goal' },
  ];

  return {
    readinessScore,
    acceptanceVerdict,
    acceptanceColor,
    acceptanceFeedback,
    acceptanceLevel,
    metrics: {
      skillConfidence: skillScore,
      projectEvidence: projectScore,
      roleFit: Math.min(99, Math.round((skillScore + projectScore) / 2)),
      consistency: Math.min(95, Math.round(projectScore * 0.8 + codingScore * 0.2)),
      codingRigor: codingScore,
    },
    competencies: defaultCompetencies,
    recommendations,
    crossRoleFit,
    roadmap,
    evaluatedAt: new Date(),
  };
}

module.exports = {
  evaluateProfile,
  ROLE_TAXONOMY,
};
