const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const JobRole = require('../models/JobRole');
const { isConnected, inMemoryStore } = require('../config/db');

// Built-in standard benchmark job roles
const DEFAULT_ROLES = [
  {
    roleName: 'Software Engineer',
    category: 'Engineering',
    description: 'Generalist software engineering role requiring strong algorithmic fundamentals, APIs, version control, and database systems.',
    requiredSkills: [
      { skill: 'Data Structures & Algorithms', weight: 0.25, importance: 'critical' },
      { skill: 'Node.js', weight: 0.20, importance: 'critical' },
      { skill: 'REST APIs', weight: 0.15, importance: 'critical' },
      { skill: 'Git', weight: 0.15, importance: 'critical' },
      { skill: 'Databases (SQL/NoSQL)', weight: 0.15, importance: 'recommended' },
      { skill: 'System Design Basics', weight: 0.10, importance: 'recommended' },
    ],
    preferredSkills: [
      { skill: 'Docker', weight: 0.10 },
      { skill: 'CI/CD', weight: 0.10 },
    ],
  },
  {
    roleName: 'Frontend Developer',
    category: 'Engineering',
    description: 'Web client specialist focused on responsive UI, modern JavaScript, frameworks, and state management.',
    requiredSkills: [
      { skill: 'JavaScript', weight: 0.25, importance: 'critical' },
      { skill: 'React', weight: 0.25, importance: 'critical' },
      { skill: 'HTML5', weight: 0.15, importance: 'critical' },
      { skill: 'CSS3', weight: 0.15, importance: 'critical' },
      { skill: 'Git', weight: 0.10, importance: 'critical' },
      { skill: 'Responsive Design', weight: 0.10, importance: 'recommended' },
    ],
    preferredSkills: [
      { skill: 'TypeScript', weight: 0.15 },
      { skill: 'TailwindCSS', weight: 0.10 },
    ],
  },
  {
    roleName: 'Backend Developer',
    category: 'Engineering',
    description: 'Server-side architect focused on scalable RESTful microservices, database schemas, security, and performance.',
    requiredSkills: [
      { skill: 'Node.js', weight: 0.25, importance: 'critical' },
      { skill: 'Express', weight: 0.20, importance: 'critical' },
      { skill: 'MongoDB', weight: 0.20, importance: 'critical' },
      { skill: 'REST APIs', weight: 0.15, importance: 'critical' },
      { skill: 'Git', weight: 0.10, importance: 'critical' },
      { skill: 'Authentication & Security', weight: 0.10, importance: 'recommended' },
    ],
    preferredSkills: [
      { skill: 'Redis', weight: 0.10 },
      { skill: 'PostgreSQL', weight: 0.15 },
      { skill: 'Docker', weight: 0.10 },
    ],
  },
  {
    roleName: 'Data Analyst',
    category: 'Data & Analytics',
    description: 'Analytical practitioner proficient in data querying, statistical modeling, data cleaning, and dashboards.',
    requiredSkills: [
      { skill: 'Python', weight: 0.30, importance: 'critical' },
      { skill: 'SQL', weight: 0.25, importance: 'critical' },
      { skill: 'Pandas', weight: 0.15, importance: 'critical' },
      { skill: 'Data Visualization', weight: 0.15, importance: 'recommended' },
      { skill: 'Statistics', weight: 0.15, importance: 'recommended' },
    ],
    preferredSkills: [
      { skill: 'Tableau', weight: 0.10 },
      { skill: 'PowerBI', weight: 0.10 },
    ],
  },
  {
    roleName: 'UI/UX Designer',
    category: 'Product Design',
    description: 'User experience and product interface designer skilled in wireframing, design systems, usability research, and interactive prototyping.',
    requiredSkills: [
      { skill: 'Figma', weight: 0.35, importance: 'critical' },
      { skill: 'Wireframing', weight: 0.20, importance: 'critical' },
      { skill: 'User Research', weight: 0.15, importance: 'critical' },
      { skill: 'Prototyping', weight: 0.15, importance: 'recommended' },
      { skill: 'Design Systems', weight: 0.15, importance: 'recommended' },
    ],
    preferredSkills: [
      { skill: 'HTML & CSS Basics', weight: 0.10 },
      { skill: 'Usability Testing', weight: 0.15 },
    ],
  },
];

/**
 * Seed roles to database and in-memory store
 */
async function seedJobRoles() {
  // Always populate in-memory store
  for (const role of DEFAULT_ROLES) {
    const existing = Array.from(inMemoryStore.jobRoles.values()).find(
      (r) => r.roleName.toLowerCase() === role.roleName.toLowerCase()
    );
    if (!existing) {
      const id = new mongoose.Types.ObjectId().toString();
      inMemoryStore.jobRoles.set(id, { _id: id, id, ...role });
    }
  }

  // Populate MongoDB if connected
  if (isConnected()) {
    for (const role of DEFAULT_ROLES) {
      await JobRole.findOneAndUpdate(
        { roleName: role.roleName },
        { $set: role },
        { upsert: true, new: true }
      ).catch(() => {});
    }
  }
}

/**
 * Find job role by name or MongoDB ObjectId
 */
async function findRoleByNameOrId(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim();

  // Try MongoDB
  if (isConnected()) {
    if (mongoose.Types.ObjectId.isValid(clean)) {
      const byId = await JobRole.findById(clean);
      if (byId) return byId.toObject();
    }
    const byName = await JobRole.findOne({
      roleName: { $regex: new RegExp(`^${clean}$`, 'i') },
    });
    if (byName) return byName.toObject();
  }

  // Check In-Memory Store
  for (const role of inMemoryStore.jobRoles.values()) {
    if (role._id.toString() === clean || role.roleName.toLowerCase() === clean.toLowerCase()) {
      return role;
    }
  }

  // Fallback match in DEFAULT_ROLES
  const match = DEFAULT_ROLES.find(
    (r) => r.roleName.toLowerCase() === clean.toLowerCase()
  );
  if (match) {
    const mockId = new mongoose.Types.ObjectId().toString();
    const roleObj = { _id: mockId, id: mockId, ...match };
    inMemoryStore.jobRoles.set(mockId, roleObj);
    return roleObj;
  }

  return null;
}

/**
 * Get all available benchmark roles
 */
async function getAllRoles() {
  if (isConnected()) {
    const roles = await JobRole.find();
    if (roles && roles.length > 0) {
      return roles.map((r) => r.toObject());
    }
  }
  return Array.from(inMemoryStore.jobRoles.values());
}

module.exports = {
  DEFAULT_ROLES,
  seedJobRoles,
  findRoleByNameOrId,
  getAllRoles,
};
