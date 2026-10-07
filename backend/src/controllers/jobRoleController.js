/**
 * Job Role Controller
 * 
 * Provides REST API handlers for querying benchmark job roles and their structured requirements.
 * Does NOT perform scoring, role-fit calculation, or LLM interpretation.
 */

const mongoose = require('mongoose');
const roleService = require('../services/roleService');

/**
 * Format a JobRole Mongoose document to clean public API presentation
 */
function formatRole(roleDoc) {
  if (!roleDoc) return null;
  const obj = typeof roleDoc.toObject === 'function' ? roleDoc.toObject() : roleDoc;
  return {
    id: obj._id ? obj._id.toString() : obj.id,
    name: obj.name,
    slug: obj.slug,
    category: obj.category,
    description: obj.description || '',
    requiredSkills: Array.isArray(obj.requiredSkills) ? obj.requiredSkills : [],
    preferredSkills: Array.isArray(obj.preferredSkills) ? obj.preferredSkills : [],
    responsibilities: Array.isArray(obj.responsibilities) ? obj.responsibilities : [],
    commonTechnologies: Array.isArray(obj.commonTechnologies) ? obj.commonTechnologies : [],
    relevantCertifications: Array.isArray(obj.relevantCertifications) ? obj.relevantCertifications : [],
    relevantCoursework: Array.isArray(obj.relevantCoursework) ? obj.relevantCoursework : [],
    experienceExpectations: Array.isArray(obj.experienceExpectations) ? obj.experienceExpectations : [],
    active: obj.active !== undefined ? obj.active : true,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

/**
 * GET /api/roles
 * Retrieve all available benchmark roles
 */
async function getAllRoles(req, res, next) {
  try {
    const { category, search, active } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (search) filter.search = search;
    if (active !== undefined) filter.active = active === 'true';

    const roles = await roleService.getAllRoles(filter);
    const formatted = roles.map(formatRole);

    return res.status(200).json({
      success: true,
      data: {
        roles: formatted,
        total: formatted.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/roles/:id
 * Retrieve a specific job role by MongoDB ObjectId
 */
async function getRoleById(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job role ID format',
      });
    }

    const role = await roleService.findRoleById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Job role not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        role: formatRole(role),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/roles/slug/:slug
 * Retrieve a specific job role by unique URL slug
 */
async function getRoleBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Role slug parameter is required',
      });
    }

    const role = await roleService.findRoleBySlug(slug.trim());

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Job role not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        role: formatRole(role),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllRoles,
  getRoleById,
  getRoleBySlug,
};
