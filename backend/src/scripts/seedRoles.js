/**
 * Idempotent Seed Script for ProfiQ Job Roles
 * 
 * Seeds/updates the 10 core benchmark job roles in MongoDB.
 * Uses `slug` as the unique identity so repeated runs never produce duplicates.
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const mongoose = require('mongoose');
const JobRole = require('../models/JobRole');
const { SEED_JOB_ROLES } = require('../data/seedRolesData');
const { connectDB, disconnectDB } = require('../config/db');

/**
 * Execute idempotent upsert for all predefined roles
 * @returns {Promise<{ total: number, seeded: Array }>}
 */
async function seedRoles() {
  const seeded = [];

  for (const roleData of SEED_JOB_ROLES) {
    const updated = await JobRole.findOneAndUpdate(
      { slug: roleData.slug },
      { $set: roleData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seeded.push(updated);
  }

  return {
    total: seeded.length,
    seeded,
  };
}

/**
 * CLI runner when executed directly via `node src/scripts/seedRoles.js`
 */
async function runDirectSeed() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log(`[Seed] Seeding ${SEED_JOB_ROLES.length} benchmark job roles...`);
    const result = await seedRoles();

    console.log(`[Seed] Successfully seeded ${result.total} roles into collection 'jobroles':`);
    result.seeded.forEach((role) => {
      console.log(`  ✓ ${role.name} (${role.slug}) [${role.category}] - ${role.requiredSkills.length} required, ${role.preferredSkills.length} preferred skills`);
    });

    await disconnectDB();
    console.log('[Seed] Database disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.error(`[Seed Error] Failed to seed job roles: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runDirectSeed();
}

module.exports = {
  seedRoles,
  SEED_JOB_ROLES,
};
