const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/project.controller');
const { getTasks, createTask } = require('../controllers/task.controller');
const { getDashboard } = require('../controllers/dashboard.controller');

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

// GET /api/projects - list user's projects
router.get('/', getProjects);

// POST /api/projects - create a new project
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Project name is required.')],
  createProject
);

// GET /api/projects/:id - get project details
router.get('/:id', requireRole(['ADMIN', 'MEMBER']), getProject);

// PUT /api/projects/:id - update project (ADMIN only)
router.put(
  '/:id',
  requireRole(['ADMIN']),
  [body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty.')],
  updateProject
);

// DELETE /api/projects/:id - delete project (ADMIN only)
router.delete('/:id', requireRole(['ADMIN']), deleteProject);

// POST /api/projects/:id/members - add a member (ADMIN only)
router.post(
  '/:id/members',
  requireRole(['ADMIN']),
  [
    body('email').isEmail().withMessage('Please provide a valid email address.'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'MEMBER'])
      .withMessage('Role must be ADMIN or MEMBER.'),
  ],
  addMember
);

// DELETE /api/projects/:id/members/:userId - remove a member (ADMIN only)
router.delete('/:id/members/:userId', requireRole(['ADMIN']), removeMember);

// GET /api/projects/:id/tasks - list project tasks
router.get('/:id/tasks', requireRole(['ADMIN', 'MEMBER']), getTasks);

// POST /api/projects/:id/tasks - create a task (ADMIN only)
router.post(
  '/:id/tasks',
  requireRole(['ADMIN']),
  [
    body('title').trim().notEmpty().withMessage('Task title is required.'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('Priority must be LOW, MEDIUM, or HIGH.'),
    body('status')
      .optional()
      .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
      .withMessage('Status must be TODO, IN_PROGRESS, or DONE.'),
    body('dueDate')
      .optional({ values: 'null' })
      .isISO8601()
      .withMessage('Due date must be a valid ISO 8601 date.'),
  ],
  createTask
);

// GET /api/projects/:id/dashboard - get dashboard stats
router.get('/:id/dashboard', requireRole(['ADMIN', 'MEMBER']), getDashboard);

module.exports = router;
