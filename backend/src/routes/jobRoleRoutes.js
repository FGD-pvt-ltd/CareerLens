/**
 * Job Role Routes
 * 
 * Maps HTTP requests to jobRoleController endpoints:
 * - GET /api/roles
 * - GET /api/roles/:id
 * - GET /api/roles/slug/:slug
 */

const express = require('express');
const router = express.Router();
const jobRoleController = require('../controllers/jobRoleController');

// Retrieve all benchmark roles
router.get('/', jobRoleController.getAllRoles);

// Retrieve role by unique slug
router.get('/slug/:slug', jobRoleController.getRoleBySlug);

// Retrieve role by MongoDB ObjectId
router.get('/:id', jobRoleController.getRoleById);

module.exports = router;
