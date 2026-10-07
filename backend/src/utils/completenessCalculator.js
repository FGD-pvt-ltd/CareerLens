/**
 * Profile Completeness Calculator
 * 
 * Deterministic, transparent data presence calculator.
 * NOT an employability or readiness score. Only measures
 * what percentage of candidate evidence categories have been provided.
 */

function calculateProfileCompleteness(profile) {
  if (!profile || typeof profile !== 'object') {
    return {
      score: 0,
      breakdown: {},
    };
  }

  const breakdown = {
    // 1. Basic Information (name and email)
    basicInfo: Boolean(
      profile.basicInfo &&
      profile.basicInfo.name &&
      profile.basicInfo.name.trim() &&
      profile.basicInfo.email &&
      profile.basicInfo.email.trim()
    ),

    // 2. College / Education (college details or education entries)
    education: Boolean(
      (profile.college && (profile.college.collegeName || profile.college.name || profile.college.degree)) ||
      (Array.isArray(profile.education) && profile.education.length > 0)
    ),

    // 3. Resume / CV (documents or resume text)
    resume: Boolean(
      (Array.isArray(profile.documents) && profile.documents.length > 0) ||
      (profile.resume && (profile.resume.extractedText || profile.resume.fileName))
    ),

    // 4. GitHub profile (username or profileUrl)
    github: Boolean(
      profile.github && (profile.github.username || profile.github.profileUrl)
    ),

    // 5. Coding platform profiles (at least 1 platform)
    codingProfiles: Boolean(
      Array.isArray(profile.codingProfiles) && profile.codingProfiles.length > 0
    ),

    // 6. Projects (at least 1 project)
    projects: Boolean(
      Array.isArray(profile.projects) && profile.projects.length > 0
    ),

    // 7. Experience / Internships (at least 1 experience entry)
    experience: Boolean(
      Array.isArray(profile.experience) && profile.experience.length > 0
    ),

    // 8. Certifications (at least 1 certification)
    certifications: Boolean(
      Array.isArray(profile.certifications) && profile.certifications.length > 0
    ),

    // 9. Portfolios & Professional Profiles (at least 1 portfolio or professional profile)
    portfolios: Boolean(
      (Array.isArray(profile.portfolios) && profile.portfolios.length > 0) ||
      (Array.isArray(profile.professionalProfiles) && profile.professionalProfiles.length > 0)
    ),

    // 10. Target Role (roleName or roleId)
    targetRole: Boolean(
      profile.targetRole && (profile.targetRole.roleName || profile.targetRole.roleId)
    ),
  };

  const categories = Object.keys(breakdown);
  const completedCount = categories.filter((cat) => breakdown[cat]).length;
  const score = Math.round((completedCount / categories.length) * 100);

  return {
    score,
    completedCategories: completedCount,
    totalCategories: categories.length,
    breakdown,
  };
}

module.exports = {
  calculateProfileCompleteness,
};
