/**
 * ProfiQ Role Service (Service Layer for Job Roles)
 * 
 * Provides database queries, lookup by name/slug/ID, validation,
 * and seed support.
 */

const mongoose = require('mongoose');
const JobRole = require('../models/JobRole');
const { SEED_JOB_ROLES } = require('../data/seedRolesData');
const { seedRoles } = require('../scripts/seedRoles');

/**
 * Seed roles to MongoDB idempotently
 */
async function seedJobRoles() {
  return seedRoles();
}

// Common industry title aliases mapped to canonical slug
const ROLE_ALIASES = {
  'backend developer': 'backend-developer',
  'backend engineer': 'backend-developer',
  'backend programmer': 'backend-developer',
  'frontend developer': 'frontend-developer',
  'frontend engineer': 'frontend-developer',
  'software engineer': 'software-engineer',
  'software developer': 'software-engineer',
  'junior engineer': 'software-engineer',
  'swe': 'software-engineer',
  'sde': 'software-engineer',
  'full stack developer': 'full-stack-developer',
  'fullstack developer': 'full-stack-developer',
  'full stack engineer': 'full-stack-developer',
  'fullstack engineer': 'full-stack-developer',
  'data analyst': 'data-analyst',
  'data scientist': 'data-scientist',
  'machine learning engineer': 'machine-learning-engineer',
  'ml engineer': 'machine-learning-engineer',
  'devops engineer': 'devops-engineer',
  'cloud engineer': 'devops-engineer',
  'ui/ux designer': 'ui-ux-designer',
  'ui ux designer': 'ui-ux-designer',
  'ui designer': 'ui-ux-designer',
  'ux designer': 'ui-ux-designer',
  'product designer': 'ui-ux-designer',
  'cybersecurity analyst': 'cybersecurity-analyst',
  'security analyst': 'cybersecurity-analyst',
  'information security analyst': 'cybersecurity-analyst',
};

/**
 * Find active job role by MongoDB ObjectId, slug, or exact/case-insensitive name
 * @param {string} identifier - ObjectId string, slug, or name
 * @returns {Promise<object|null>}
 */
async function findRoleByNameOrId(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim();

  // 1. If valid ObjectId format, prioritize DB lookup by _id
  if (mongoose.Types.ObjectId.isValid(clean) && /^[0-9a-fA-F]{24}$/.test(clean)) {
    const byId = await JobRole.findById(clean);
    if (byId) return byId;
    // Explicit 24-hex ObjectId that was not found in DB
    return null;
  }

  // 2. Try by exact slug or normalized slug
  const cleanSlug = clean.toLowerCase();
  const normalizedSlug = cleanSlug.replace(/_/g, '-');
  const normalizedSpace = cleanSlug.replace(/[-_]/g, ' ');

  let role = await JobRole.findOne({ slug: { $in: [cleanSlug, normalizedSlug] } });
  if (role) return role;

  // 3. Try by known alias
  const aliasTarget = ROLE_ALIASES[cleanSlug] || ROLE_ALIASES[normalizedSlug] || ROLE_ALIASES[normalizedSpace];
  if (aliasTarget) {
    role = await JobRole.findOne({ slug: aliasTarget });
    if (role) return role;
  }

  // 4. Try by exact name or case-insensitive regex
  const byName = await JobRole.findOne({
    name: { $regex: new RegExp(`^${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  if (byName) return byName;

  // 5. Fallback in-memory catalog match (e.g. during standalone test runs before explicit seed)
  const targetSlug = aliasTarget || normalizedSlug || cleanSlug;
  const seedMatch = SEED_JOB_ROLES.find(
    (r) => r.slug === targetSlug || r.name.toLowerCase() === cleanSlug || r.name.toLowerCase() === normalizedSpace
  );
  if (seedMatch) {
    if (mongoose.connection.readyState === 1) {
      const upserted = await JobRole.findOneAndUpdate(
        { slug: seedMatch.slug },
        { $set: seedMatch },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return upserted;
    }
    return { ...seedMatch, _id: new mongoose.Types.ObjectId() };
  }

  return null;
}

/**
 * Find active role by slug
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
async function findRoleBySlug(slug) {
  if (!slug) return null;
  return JobRole.findOne({ slug: String(slug).toLowerCase().trim() });
}

/**
 * Find active role by MongoDB ObjectId
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findRoleById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return JobRole.findById(id);
}

/**
 * Retrieve all roles with optional filtering
 * @param {object} filterOptions - { category, active, search }
 * @returns {Promise<Array>}
 */
async function getAllRoles(filterOptions = {}) {
  const query = {};

  if (filterOptions.active !== undefined) {
    query.active = Boolean(filterOptions.active);
  } else {
    query.active = true;
  }

  if (filterOptions.category && typeof filterOptions.category === 'string') {
    query.category = { $regex: new RegExp(`^${filterOptions.category.trim()}$`, 'i') };
  }

  if (filterOptions.search && typeof filterOptions.search === 'string') {
    const searchRegex = new RegExp(filterOptions.search.trim(), 'i');
    query.$or = [{ name: searchRegex }, { description: searchRegex }, { commonTechnologies: searchRegex }];
  }

  return JobRole.find(query).sort({ category: 1, name: 1 });
}

/**
 * Validates a target role reference. Returns normalized role identity object if found and active.
 * @param {object|string} roleRef - { roleId, roleName, slug } or string
 * @returns {Promise<{ roleId: string, roleName: string, slug: string, roleDoc: object }|null>}
 */
async function validateTargetRole(roleRef) {
  if (!roleRef) return null;

  const candidates = [];
  if (typeof roleRef === 'string') {
    candidates.push(roleRef);
  } else if (typeof roleRef === 'object') {
    if (roleRef.roleId) candidates.push(roleRef.roleId);
    if (roleRef.slug) candidates.push(roleRef.slug);
    if (roleRef.roleName) candidates.push(roleRef.roleName);
    if (roleRef.name) candidates.push(roleRef.name);
    if (roleRef.id) candidates.push(roleRef.id);
  }

  if (candidates.length === 0) return null;

  // If roleRef has an explicit 24-hex ObjectId in roleId that does NOT exist in DB, fail immediately
  if (
    typeof roleRef === 'object' &&
    roleRef.roleId &&
    mongoose.Types.ObjectId.isValid(roleRef.roleId) &&
    /^[0-9a-fA-F]{24}$/.test(roleRef.roleId)
  ) {
    const byId = await JobRole.findById(roleRef.roleId);
    if (!byId) return null;
    return {
      roleId: byId._id.toString(),
      roleName: byId.name,
      slug: byId.slug,
      roleDoc: byId,
    };
  }

  for (const candidate of candidates) {
    const roleDoc = await findRoleByNameOrId(candidate);
    if (roleDoc && roleDoc.active) {
      return {
        roleId: roleDoc._id.toString(),
        roleName: roleDoc.name,
        slug: roleDoc.slug,
        roleDoc,
      };
    }
  }

  return null;
}

module.exports = {
  DEFAULT_ROLES: SEED_JOB_ROLES,
  seedJobRoles,
  findRoleByNameOrId,
  findRoleBySlug,
  findRoleById,
  getAllRoles,
  validateTargetRole,
};
