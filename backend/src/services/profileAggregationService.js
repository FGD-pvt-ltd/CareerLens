const CandidateProfile = require('../models/CandidateProfile');
const { calculateProfileCompleteness } = require('../utils/completenessCalculator');
const roleService = require('./roleService');

/**
 * Normalizes a CandidateProfile Mongoose document into a single unified object.
 * Strictly adheres to Asati's data collection boundary — no scores, no evaluations,
 * no interpretations. Preserves all evidence and provenance.
 */
function normalizeUnifiedCandidate(profile) {
  if (!profile) return null;

  const completenessData = calculateProfileCompleteness(profile);

  // Extract resume and CV text from documents array or legacy resume field
  const resumeDoc = (profile.documents || []).find((d) => d.documentType === 'resume');
  const cvDoc = (profile.documents || []).find((d) => d.documentType === 'cv');

  const resumeText = resumeDoc?.extractedText || profile.resume?.extractedText || '';
  const cvText = cvDoc?.extractedText || '';

  const unifiedCandidate = {
    basicInfo: {
      name: profile.basicInfo?.name || '',
      email: profile.basicInfo?.email || '',
      phone: profile.basicInfo?.phone || null,
      location: profile.basicInfo?.location || null,
      headline: profile.basicInfo?.headline || null,
      profilePhotoUrl: profile.basicInfo?.profilePhotoUrl || null,
    },

    college: {
      collegeName: profile.college?.collegeName || profile.college?.name || null,
      university: profile.college?.university || null,
      degree: profile.college?.degree || null,
      branch: profile.college?.branch || null,
      specialization: profile.college?.specialization || null,
      yearOfStudy: profile.college?.yearOfStudy || null,
      graduationYear: profile.college?.graduationYear ?? null,
      cgpa: profile.college?.cgpa ?? null,
      percentage: profile.college?.percentage ?? null,
      relevantCoursework: Array.isArray(profile.college?.relevantCoursework)
        ? profile.college.relevantCoursework
        : [],
      academicAchievements: Array.isArray(profile.college?.academicAchievements)
        ? profile.college.academicAchievements
        : Array.isArray(profile.college?.achievements)
        ? profile.college.achievements
        : [],
    },

    education: (profile.education || []).map((e) => ({
      level: e.level || null,
      institution: e.institution || null,
      degree: e.degree || null,
      field: e.field || null,
      startYear: e.startYear ?? null,
      endYear: e.endYear ?? null,
      cgpa: e.cgpa ?? null,
      percentage: e.percentage ?? null,
    })),

    experience: (profile.experience || []).map((exp) => ({
      organization: exp.organization || '',
      role: exp.role || '',
      employmentType: exp.employmentType || null,
      location: exp.location || null,
      startDate: exp.startDate || null,
      endDate: exp.endDate || null,
      isCurrent: Boolean(exp.isCurrent),
      description: exp.description || '',
      technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      source: exp.source || 'user_input',
    })),

    skills: (profile.skills || []).map((s) => ({
      name: s.name || '',
      category: s.category || null,
      source: s.source || 'user_input',
    })),

    projects: (profile.projects || []).map((p) => ({
      name: p.name || '',
      description: p.description || '',
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      category: p.category || null,
      role: p.role || null,
      startDate: p.startDate || null,
      endDate: p.endDate || null,
      githubUrl: p.githubUrl || null,
      liveUrl: p.liveUrl || null,
      demoUrl: p.demoUrl || null,
      teamSize: p.teamSize ?? 1,
      source: p.source || 'user_input',
    })),

    certifications: (profile.certifications || []).map((c) => ({
      name: c.name || '',
      issuingOrganization: c.issuingOrganization || c.issuer || null,
      issueDate: c.issueDate || null,
      expiryDate: c.expiryDate || null,
      credentialId: c.credentialId || null,
      credentialUrl: c.credentialUrl || null,
      certificateFileReference: c.certificateFileReference || null,
      source: c.source || 'user_input',
    })),

    academicAchievements: (profile.academicAchievements || []).map((a) => ({
      title: a.title || '',
      description: a.description || '',
      date: a.date || null,
      organization: a.organization || null,
      credentialUrl: a.credentialUrl || null,
      source: a.source || 'user_input',
    })),

    achievements: (profile.achievements || []).map((a) => ({
      title: a.title || '',
      description: a.description || '',
      category: a.category || 'other',
      date: a.date || null,
      organization: a.organization || null,
      source: a.source || 'user_input',
    })),

    resume: {
      hasResume: Boolean(resumeDoc || profile.resume?.extractedText),
      hasCv: Boolean(cvDoc),
      resumeText,
      cvText,
      uploadedAt: resumeDoc?.uploadedAt || cvDoc?.uploadedAt || null,
    },

    github: {
      username: profile.github?.username || null,
      profileUrl: profile.github?.profileUrl || null,
      name: profile.github?.name || null,
      bio: profile.github?.bio || null,
      avatarUrl: profile.github?.avatarUrl || null,
      company: profile.github?.company || null,
      location: profile.github?.location || null,
      publicRepositoryCount: profile.github?.publicRepositoryCount || 0,
      followers: profile.github?.followers || 0,
      following: profile.github?.following || 0,
      repositories: (profile.github?.repositories || []).map((r) => ({
        name: r.name,
        fullName: r.fullName,
        description: r.description,
        url: r.url,
        homepage: r.homepage,
        primaryLanguage: r.primaryLanguage,
        languages: r.languages || [],
        topics: r.topics || [],
        stars: r.stars || 0,
        forks: r.forks || 0,
        updatedAt: r.updatedAt,
        archived: r.archived,
        fork: r.fork,
        readme: r.readme || '',
      })),
      languageSummary: profile.github?.languageSummary || {},
      activity: profile.github?.activity || {},
      analyzedAt: profile.github?.analyzedAt || null,
    },

    codingProfiles: (profile.codingProfiles || []).map((cp) => ({
      platform: cp.platform,
      username: cp.username,
      profileUrl: cp.profileUrl,
      stats: {
        problemsSolved: cp.stats?.problemsSolved ?? null,
        rating: cp.stats?.rating ?? null,
        rank: cp.stats?.rank ?? null,
        contestsParticipated: cp.stats?.contestsParticipated ?? null,
      },
      problemBreakdown: {
        easy: cp.problemBreakdown?.easy ?? null,
        medium: cp.problemBreakdown?.medium ?? null,
        hard: cp.problemBreakdown?.hard ?? null,
      },
      languages: cp.languages || [],
      activity: {
        lastActiveDate: cp.activity?.lastActiveDate || null,
      },
      dataSource: cp.dataSource,
      fetchStatus: cp.fetchStatus,
      fetchedAt: cp.fetchedAt,
    })),

    professionalProfiles: (profile.professionalProfiles || []).map((pp) => ({
      platform: pp.platform,
      profileUrl: pp.profileUrl || pp.url || null,
      username: pp.username || null,
      displayName: pp.displayName || null,
      fetchedData: pp.fetchedData || {},
      fetchStatus: pp.fetchStatus || 'user_provided',
      dataSource: pp.source || 'user_provided',
      fetchedAt: pp.fetchedAt || null,
    })),

    portfolios: (profile.portfolios || []).map((pf) => ({
      platform: pf.platform || 'Other',
      url: pf.url,
      title: pf.title || null,
      description: pf.description || null,
      type: pf.type || null,
      fetchedData: pf.fetchedData || {},
      fetchStatus: pf.fetchStatus || 'user_provided',
      dataSource: pf.source || 'user_provided',
      fetchedAt: pf.fetchedAt || null,
    })),

    targetRole: {
      roleId: profile.targetRole?.roleId ? profile.targetRole.roleId.toString() : null,
      roleName: profile.targetRole?.roleName || null,
      slug: profile.targetRole?.slug || null,
    },
  };

  return {
    candidateId: profile._id.toString(),
    targetRole: profile.targetRole?.roleName || profile.targetRole?.roleId || null,
    profileCompleteness: completenessData.score,
    completenessBreakdown: completenessData.breakdown,
    candidate: unifiedCandidate,
    // Structure prepared for Aman's AI/ML FastAPI service (Section 23)
    aiHandoff: {
      candidateId: profile._id.toString(),
      targetRole: profile.targetRole?.roleName || '',
      profile: {
        basicInfo: unifiedCandidate.basicInfo,
        college: unifiedCandidate.college,
        education: unifiedCandidate.education,
        experience: unifiedCandidate.experience,
        skills: unifiedCandidate.skills,
        projects: unifiedCandidate.projects,
        certifications: unifiedCandidate.certifications,
        academicAchievements: unifiedCandidate.academicAchievements,
        achievements: unifiedCandidate.achievements,
        resume: unifiedCandidate.resume,
        github: unifiedCandidate.github,
        codingProfiles: unifiedCandidate.codingProfiles,
        professionalProfiles: unifiedCandidate.professionalProfiles,
        portfolios: unifiedCandidate.portfolios,
        targetRole: unifiedCandidate.targetRole,
      },
    },
  };
}

/**
 * Retrieve unified candidate profile by MongoDB ObjectId
 */
async function getUnifiedCandidateProfile(profileId) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;
  return normalizeUnifiedCandidate(profile);
}

/**
 * Update candidate profile with structured whitelist validation
 * Prevents arbitrary root fields injection. Recalculates profileCompleteness.
 */
async function updateCandidateProfile(profileId, updateData) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;

  if (!updateData || typeof updateData !== 'object') {
    throw new Error('Update payload must be a non-empty object');
  }

  // 1. Basic Info
  if (updateData.basicInfo && typeof updateData.basicInfo === 'object') {
    profile.basicInfo.name = updateData.basicInfo.name !== undefined ? updateData.basicInfo.name : profile.basicInfo.name;
    if (updateData.basicInfo.email !== undefined) profile.basicInfo.email = updateData.basicInfo.email;
    if (updateData.basicInfo.phone !== undefined) profile.basicInfo.phone = updateData.basicInfo.phone;
    if (updateData.basicInfo.location !== undefined) profile.basicInfo.location = updateData.basicInfo.location;
    if (updateData.basicInfo.headline !== undefined) profile.basicInfo.headline = updateData.basicInfo.headline;
    if (updateData.basicInfo.profilePhotoUrl !== undefined) profile.basicInfo.profilePhotoUrl = updateData.basicInfo.profilePhotoUrl;
  }

  // 2. College
  if (updateData.college && typeof updateData.college === 'object') {
    const c = updateData.college;
    if (c.collegeName !== undefined) profile.college.collegeName = c.collegeName;
    if (c.name !== undefined) profile.college.name = c.name;
    if (c.university !== undefined) profile.college.university = c.university;
    if (c.degree !== undefined) profile.college.degree = c.degree;
    if (c.branch !== undefined) profile.college.branch = c.branch;
    if (c.specialization !== undefined) profile.college.specialization = c.specialization;
    if (c.yearOfStudy !== undefined) profile.college.yearOfStudy = c.yearOfStudy;
    if (c.graduationYear !== undefined) profile.college.graduationYear = c.graduationYear;
    if (c.cgpa !== undefined) profile.college.cgpa = c.cgpa;
    if (c.percentage !== undefined) profile.college.percentage = c.percentage;
    if (Array.isArray(c.relevantCoursework)) profile.college.relevantCoursework = c.relevantCoursework;
    if (Array.isArray(c.academicAchievements)) profile.college.academicAchievements = c.academicAchievements;
    if (Array.isArray(c.achievements)) profile.college.achievements = c.achievements;
  }

  // 3. Education array
  if (Array.isArray(updateData.education)) {
    profile.education = updateData.education;
  }

  // 4. Experience array
  if (Array.isArray(updateData.experience)) {
    profile.experience = updateData.experience;
  }

  // 5. Skills array
  if (Array.isArray(updateData.skills)) {
    profile.skills = updateData.skills;
  }

  // 6. Projects array
  if (Array.isArray(updateData.projects)) {
    profile.projects = updateData.projects;
  }

  // 7. Certifications array
  if (Array.isArray(updateData.certifications)) {
    profile.certifications = updateData.certifications;
  }

  // 8. Academic Achievements array
  if (Array.isArray(updateData.academicAchievements)) {
    profile.academicAchievements = updateData.academicAchievements;
  }

  // 9. Achievements array
  if (Array.isArray(updateData.achievements)) {
    profile.achievements = updateData.achievements;
  }

  // 10. Professional Profiles array
  if (Array.isArray(updateData.professionalProfiles)) {
    profile.professionalProfiles = updateData.professionalProfiles;
  }

  // 11. Portfolios array
  if (Array.isArray(updateData.portfolios)) {
    profile.portfolios = updateData.portfolios;
  }

  // 12. Target Role
  if (updateData.targetRole !== undefined) {
    if (updateData.targetRole && typeof updateData.targetRole === 'object') {
      const roleMatch = await roleService.validateTargetRole(updateData.targetRole);
      if (!roleMatch) {
        const error = new Error('Target role not found');
        error.statusCode = 404;
        throw error;
      }
      profile.targetRole = {
        roleId: roleMatch.roleId,
        roleName: updateData.targetRole.roleName || roleMatch.roleName,
        slug: roleMatch.slug,
      };
    } else if (typeof updateData.targetRole === 'string' && updateData.targetRole.trim()) {
      const roleMatch = await roleService.validateTargetRole(updateData.targetRole.trim());
      if (!roleMatch) {
        const error = new Error('Target role not found');
        error.statusCode = 404;
        throw error;
      }
      profile.targetRole = {
        roleId: roleMatch.roleId,
        roleName: roleMatch.roleName,
        slug: roleMatch.slug,
      };
    }
  }

  await profile.save();
  return profile;
}

/**
 * Add a project to candidate profile (handles duplicates safely by name or updates in-place)
 */
async function addCandidateProject(profileId, projectData) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;

  if (!projectData || !projectData.name || !projectData.name.trim()) {
    throw new Error('Project name is required');
  }

  const existingIndex = profile.projects.findIndex(
    (p) => p.name.trim().toLowerCase() === projectData.name.trim().toLowerCase()
  );

  const cleanProject = {
    name: projectData.name.trim(),
    description: projectData.description || '',
    technologies: Array.isArray(projectData.technologies) ? projectData.technologies : [],
    category: projectData.category || null,
    role: projectData.role || null,
    startDate: projectData.startDate || null,
    endDate: projectData.endDate || null,
    githubUrl: projectData.githubUrl || null,
    liveUrl: projectData.liveUrl || null,
    demoUrl: projectData.demoUrl || null,
    teamSize: Number(projectData.teamSize) || 1,
    source: projectData.source || 'user_input',
  };

  if (existingIndex >= 0) {
    profile.projects[existingIndex] = { ...profile.projects[existingIndex].toObject(), ...cleanProject };
  } else {
    profile.projects.push(cleanProject);
  }

  await profile.save();
  return profile;
}

/**
 * Add an experience entry to candidate profile
 */
async function addCandidateExperience(profileId, experienceData) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;

  if (!experienceData || !experienceData.organization || !experienceData.role) {
    throw new Error('Organization and role are required for experience');
  }

  const cleanExp = {
    organization: experienceData.organization.trim(),
    role: experienceData.role.trim(),
    employmentType: experienceData.employmentType || null,
    location: experienceData.location || null,
    startDate: experienceData.startDate || null,
    endDate: experienceData.endDate || null,
    isCurrent: Boolean(experienceData.isCurrent),
    description: experienceData.description || '',
    technologies: Array.isArray(experienceData.technologies) ? experienceData.technologies : [],
    achievements: Array.isArray(experienceData.achievements) ? experienceData.achievements : [],
    source: experienceData.source || 'user_input',
  };

  profile.experience.push(cleanExp);
  await profile.save();
  return profile;
}

/**
 * Add a certification entry with optional file reference
 */
async function addCandidateCertification(profileId, certData) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;

  if (!certData || !certData.name || !certData.name.trim()) {
    throw new Error('Certification name is required');
  }

  const cleanCert = {
    name: certData.name.trim(),
    issuingOrganization: certData.issuingOrganization || certData.issuer || null,
    issuer: certData.issuingOrganization || certData.issuer || null,
    issueDate: certData.issueDate || null,
    expiryDate: certData.expiryDate || null,
    credentialId: certData.credentialId || null,
    credentialUrl: certData.credentialUrl || null,
    certificateFileReference: certData.certificateFileReference || null,
    source: certData.source || 'user_input',
  };

  profile.certifications.push(cleanCert);
  await profile.save();
  return profile;
}

/**
 * Add or update a professional profile (LinkedIn, GitLab, etc.)
 */
async function addCandidateProfessionalProfile(profileId, profData) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;

  if (!profData || !profData.platform || !profData.profileUrl) {
    throw new Error('Platform and profileUrl are required for professional profile');
  }

  const platformLower = profData.platform.trim().toLowerCase();
  const cleanItem = {
    platform: profData.platform.trim(),
    profileUrl: profData.profileUrl.trim(),
    url: profData.profileUrl.trim(),
    username: profData.username ? profData.username.trim() : null,
    displayName: profData.displayName ? profData.displayName.trim() : null,
    fetchedData: profData.fetchedData || {},
    fetchStatus: profData.fetchStatus || 'user_provided',
    source: 'user_provided',
    fetchedAt: new Date(),
  };

  const existingIndex = profile.professionalProfiles.findIndex(
    (p) => p.platform.toLowerCase() === platformLower || p.profileUrl === cleanItem.profileUrl
  );

  if (existingIndex >= 0) {
    profile.professionalProfiles[existingIndex] = cleanItem;
  } else {
    profile.professionalProfiles.push(cleanItem);
  }

  await profile.save();
  return profile;
}

/**
 * Add or update a portfolio entry (avoids duplicate URLs)
 */
async function addCandidatePortfolio(profileId, portfolioData) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;

  if (!portfolioData || !portfolioData.url || !portfolioData.url.trim()) {
    throw new Error('Portfolio URL is required');
  }

  const cleanItem = {
    platform: portfolioData.platform ? portfolioData.platform.trim() : 'Personal Website',
    url: portfolioData.url.trim(),
    title: portfolioData.title ? portfolioData.title.trim() : null,
    description: portfolioData.description ? portfolioData.description.trim() : null,
    type: portfolioData.type ? portfolioData.type.trim() : null,
    fetchedData: portfolioData.fetchedData || {},
    fetchStatus: portfolioData.fetchStatus || 'user_provided',
    source: 'user_provided',
    fetchedAt: new Date(),
  };

  const existingIndex = profile.portfolios.findIndex(
    (pf) => pf.url.toLowerCase() === cleanItem.url.toLowerCase()
  );

  if (existingIndex >= 0) {
    profile.portfolios[existingIndex] = cleanItem;
  } else {
    profile.portfolios.push(cleanItem);
  }

  await profile.save();
  return profile;
}

/**
 * Add extracurricular/other achievement
 */
async function addCandidateAchievement(profileId, achievementData) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;

  if (!achievementData || !achievementData.title || !achievementData.title.trim()) {
    throw new Error('Achievement title is required');
  }

  const cleanItem = {
    title: achievementData.title.trim(),
    description: achievementData.description || '',
    category: achievementData.category || 'other',
    date: achievementData.date || null,
    organization: achievementData.organization || null,
    source: achievementData.source || 'user_input',
  };

  profile.achievements.push(cleanItem);
  await profile.save();
  return profile;
}

/**
 * Add academic achievement
 */
async function addCandidateAcademicAchievement(profileId, achievementData) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;

  if (!achievementData || !achievementData.title || !achievementData.title.trim()) {
    throw new Error('Academic achievement title is required');
  }

  const cleanItem = {
    title: achievementData.title.trim(),
    description: achievementData.description || '',
    date: achievementData.date || null,
    organization: achievementData.organization || null,
    credentialUrl: achievementData.credentialUrl || null,
    source: achievementData.source || 'user_input',
  };

  profile.academicAchievements.push(cleanItem);
  await profile.save();
  return profile;
}

/**
 * Set target role for candidate
 */
async function setCandidateTargetRole(profileId, targetRoleData) {
  const profile = await CandidateProfile.findById(profileId);
  if (!profile) return null;

  if (!targetRoleData) {
    const error = new Error('Target role data is required');
    error.statusCode = 400;
    throw error;
  }

  const roleMatch = await roleService.validateTargetRole(targetRoleData);
  if (!roleMatch) {
    const error = new Error('Target role not found');
    error.statusCode = 404;
    throw error;
  }

  profile.targetRole = {
    roleId: roleMatch.roleId,
    roleName: targetRoleData.roleName || roleMatch.roleName,
    slug: roleMatch.slug,
  };

  profile.profileCompleteness = calculateProfileCompleteness(profile).score;
  await profile.save();
  return profile;
}

module.exports = {
  getUnifiedCandidateProfile,
  updateCandidateProfile,
  addCandidateProject,
  addCandidateExperience,
  addCandidateCertification,
  addCandidateProfessionalProfile,
  addCandidatePortfolio,
  addCandidateAchievement,
  addCandidateAcademicAchievement,
  setCandidateTargetRole,
  normalizeUnifiedCandidate,
};
