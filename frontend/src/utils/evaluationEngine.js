/**
 * Client-side Evaluation Engine for ProfiQ
 * Mirrors backend analysisService logic with realistic multi-factor aspects:
 * - Skill Alignment against Target Role required stack
 * - Project Evidence & Live URLs
 * - Coding Platform Rigor (LeetCode, Codeforces, HackerRank, CodeChef)
 * - Academic Rigor (CGPA, degree, branch)
 * - Resume / CV document presence & extraction
 * - Meter of Acceptance Judgment (Rejected, Needs Improvement, Good, Great, Excellent)
 */

export const ROLE_TAXONOMY = {
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

function isMeaningfulString(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim().toLowerCase();
  return trimmed !== '' && trimmed !== '0' && trimmed !== 'none' && trimmed !== 'n/a' && trimmed !== 'na' && trimmed !== 'nil' && trimmed !== 'null' && trimmed !== '-';
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function skillMatches(candidateSkill, requiredSkill) {
  const cs = String(candidateSkill || '').trim().toLowerCase();
  const req = String(requiredSkill || '').trim().toLowerCase();
  if (!cs || !req) return false;
  if (!isMeaningfulString(cs)) return false;
  if (cs === req) return true;
  // For short tokens (e.g. 'c', 'r', 'go', 'js', 'ts'), require exact match only
  if (cs.length <= 3 || req.length <= 3) {
    return cs === req;
  }
  const reqPattern = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escapeRegex(req)}(?:$|[^a-zA-Z0-9+#])`, 'i');
  const csPattern = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escapeRegex(cs)}(?:$|[^a-zA-Z0-9+#])`, 'i');
  return reqPattern.test(cs) || csPattern.test(req);
}

function documentContainsSkill(docText, reqSkill) {
  if (!docText || !docText.trim()) return false;
  const req = String(reqSkill || '').trim().toLowerCase();
  if (!req) return false;
  const pattern = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escapeRegex(req)}(?:$|[^a-zA-Z0-9+#])`, 'i');
  const match = pattern.exec(docText);
  if (!match) return false;
  const pre = docText.substring(Math.max(0, match.index - 60), match.index);
  if (/\b(?:no|never|not|without|0|zero|haven't|havenot|don't)\s+(?:experience\s+(?:with|in)\s+|projects?\s+(?:in|with)\s+)?$/i.test(pre)) {
    return false;
  }
  return true;
}

export function evaluateProfile(profile) {
  const targetRoleName = profile?.targetRole?.roleName || 'Full Stack Developer';
  const roleData = ROLE_TAXONOMY[targetRoleName] || ROLE_TAXONOMY['Full Stack Developer'];

  // Normalize candidate's skills
  const candidateSkills = (profile?.skills || []).map((s) =>
    (typeof s === 'string' ? s : s?.name || '').trim().toLowerCase()
  ).filter((s) => isMeaningfulString(s));

  let documentText = '';
  if (profile?.documents && profile.documents.length > 0) {
    documentText = profile.documents.map((d) => d.extractedText || '').join(' ').toLowerCase();
  }

  // 1. Skill Alignment Aspect (35%) - Strict boundary matching, no false substring claims
  const matchedCoreSkills = roleData.coreSkills.filter((req) => {
    return candidateSkills.some((cs) => skillMatches(cs, req)) ||
      documentContainsSkill(documentText, req);
  });

  const skillMatchRatio = matchedCoreSkills.length === 0 ? 0 : Math.min(100, Math.round((matchedCoreSkills.length / Math.max(roleData.coreSkills.length * 0.65, 1)) * 100));
  const skillScore = skillMatchRatio;

  // 2. Project Evidence & GitHub Aspect (25%) - 0 points if no real projects and no GitHub
  const projects = (profile?.projects || []).filter((p) => {
    const name = typeof p === 'string' ? p : p?.name;
    return isMeaningfulString(name);
  });
  const ghUser = profile?.github?.username;
  const ghUrl = profile?.github?.profileUrl;
  const hasGithub = Boolean(
    (isMeaningfulString(ghUser) && !['0', 'none', 'n/a'].includes(ghUser.toLowerCase())) ||
    (isMeaningfulString(ghUrl) && ghUrl.includes('github.com'))
  );

  let projectScore = 0;
  if (projects.length > 0 || hasGithub) {
    let projectPoints = 20;
    if (projects.length >= 1) projectPoints += 25;
    if (projects.length >= 2) projectPoints += 15;
    if (projects.some((p) => isMeaningfulString(p?.githubUrl) || isMeaningfulString(p?.liveUrl))) projectPoints += 20;
    if (hasGithub) projectPoints += 15;
    projectScore = Math.min(98, projectPoints);
  }

  // 3. Coding Platform & DSA Rigor Aspect (20%) - 0 points if 0 problems or no profile
  let codingScore = 0;
  const codingProfiles = (profile?.codingProfiles || []).filter((cp) => {
    const handle = cp?.username || cp?.profileUrl;
    return isMeaningfulString(handle);
  });
  const primaryCoding = codingProfiles[0];

  if (primaryCoding) {
    const solved = typeof primaryCoding.problemsSolved === 'number' ? primaryCoding.problemsSolved : parseInt(primaryCoding.problemsSolved, 10);
    const rating = typeof primaryCoding.rating === 'number' ? primaryCoding.rating : parseInt(primaryCoding.rating, 10);

    if ((isNaN(solved) || solved <= 0) && (isNaN(rating) || rating <= 0)) {
      codingScore = 0;
    } else if (solved >= 400 || rating >= 1850) {
      codingScore = 96;
    } else if (solved >= 250 || rating >= 1650) {
      codingScore = 88;
    } else if (solved >= 120 || rating >= 1450) {
      codingScore = 78;
    } else if (solved >= 50) {
      codingScore = 72;
    } else if (solved > 0) {
      codingScore = Math.min(65, Math.round((solved / 50) * 65));
    } else if (!isNaN(rating) && rating > 0) {
      codingScore = Math.min(65, Math.round((rating / 1450) * 65));
    } else {
      codingScore = 0;
    }
  }

  // 4. Academic Rigor Aspect (10%) - 0 points if 0 CGPA or no college info
  let academicScore = 0;
  const college = profile?.college;
  const collegeName = college?.name || college?.collegeName;
  const hasCollegeName = isMeaningfulString(collegeName);
  const rawCgpa = college?.cgpa;
  const cgpa = typeof rawCgpa === 'number' ? rawCgpa : (rawCgpa ? parseFloat(rawCgpa) : undefined);

  if (hasCollegeName && cgpa !== undefined && !isNaN(cgpa)) {
    if (cgpa <= 0) academicScore = 0;
    else if (cgpa >= 9.0) academicScore = 95;
    else if (cgpa >= 8.0) academicScore = 85;
    else if (cgpa >= 7.0) academicScore = 75;
    else if (cgpa >= 6.0) academicScore = 60;
    else academicScore = 45;
  } else if (hasCollegeName && (cgpa === undefined || isNaN(cgpa))) {
    academicScore = 50;
  } else if (cgpa !== undefined && !isNaN(cgpa) && cgpa > 0) {
    if (cgpa >= 9.0) academicScore = 95;
    else if (cgpa >= 8.0) academicScore = 85;
    else if (cgpa >= 7.0) academicScore = 75;
    else if (cgpa >= 6.0) academicScore = 60;
    else academicScore = 45;
  } else {
    academicScore = 0;
  }

  // 5. Document Rigor Aspect (10%) - 0 points if no documents uploaded
  let docScore = 0;
  const documents = (profile?.documents || []).filter((d) => {
    return d && (d.fileUrl || d.extractedText || (d.fileSize && d.fileSize > 0));
  });
  if (documents.length > 0) {
    docScore = 60;
    if (documents.some((d) => d.extractionStatus === 'completed' && (d.fileSize || 0) > 0)) {
      docScore = 90;
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
  let acceptanceLevel = 3;

  if (readinessScore < 50) {
    acceptanceVerdict = 'Rejected';
    acceptanceColor = '#DC2626';
    acceptanceLevel = 1;
    acceptanceFeedback = 'Critical skill deficits or missing verifiable evidence. Profile does not meet standard screening criteria.';
  } else if (readinessScore < 65) {
    acceptanceVerdict = 'Needs Improvement';
    acceptanceColor = '#D97706';
    acceptanceLevel = 2;
    acceptanceFeedback = 'Foundational competency present, but lacks core project depth, competitive DSA signals, or framework mastery.';
  } else if (readinessScore < 80) {
    acceptanceVerdict = 'Good';
    acceptanceColor = '#2563EB';
    acceptanceLevel = 3;
    acceptanceFeedback = 'Solid candidate profile meeting standard entry-to-mid requirements with confirmed technical competencies.';
  } else if (readinessScore < 90) {
    acceptanceVerdict = 'Great';
    acceptanceColor = '#059669';
    acceptanceLevel = 4;
    acceptanceFeedback = 'High-readiness profile exceeding typical market benchmarks with strong cross-source verification.';
  } else {
    acceptanceVerdict = 'Excellent';
    acceptanceColor = '#16A34A';
    acceptanceLevel = 5;
    acceptanceFeedback = 'Top-tier portfolio demonstrating exceptional technical capability, rigorous DSA mastery, and production readiness.';
  }

  // Competency Matrix
  const defaultCompetencies = [
    { name: candidateSkills[0] ? candidateSkills[0].toUpperCase() : 'Core Stack', level: skillScore > 75 ? 'Strong' : skillScore > 0 ? 'Developing' : 'Novice', score: skillScore, status: skillScore > 0 ? 'Verified' : 'Attention', color: skillScore > 0 ? 'var(--accent-sage)' : 'var(--accent-warm)' },
    { name: candidateSkills[1] ? candidateSkills[1].toUpperCase() : 'Architecture', level: skillScore > 70 ? 'Mid' : skillScore > 0 ? 'Junior' : 'Novice', score: Math.max(0, skillScore - 3), status: skillScore > 0 ? 'Verified' : 'Attention', color: skillScore > 0 ? 'var(--accent-sage)' : 'var(--accent-warm)' },
    { name: primaryCoding?.platform || 'DSA & Algorithms', level: codingScore > 75 ? 'Proficient' : codingScore > 0 ? 'Developing' : 'Novice', score: codingScore, status: codingScore > 70 ? 'Strong' : 'Attention', color: codingScore > 70 ? 'var(--accent-sage)' : 'var(--accent-warm)' },
    { name: 'System Design & CI/CD', level: projectScore > 70 ? 'Applied' : projectScore > 0 ? 'Developing' : 'Novice', score: projectScore, status: projectScore > 70 ? 'Developing' : 'Attention', color: projectScore > 70 ? 'var(--accent-gold)' : 'var(--accent-warm)' },
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
    ...roleData.alternateRoles.map((alt) => {
      const altMatch = readinessScore === 0 ? 0 : Math.max(0, Math.min(95, readinessScore + alt.matchOffset));
      return {
        role: alt.role,
        match: altMatch,
        status: altMatch >= 75 ? 'Qualified Transfer' : 'Requires Upskilling',
        gapDays: alt.gapDays,
      };
    }),
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
