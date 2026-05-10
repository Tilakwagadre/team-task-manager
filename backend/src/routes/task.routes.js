const express = require('express');
const { body } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { updateTask, deleteTask } = require('../controllers/task.controller');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Middleware to inject projectId into params for task routes
const resolveTaskProject = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      select: { projectId: true }
    });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    req.params.projectId = task.projectId;
    next();
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:taskId - update a task
router.put(
  '/:taskId',
  [
    body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty.'),
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
  updateTask
);

// DELETE /api/tasks/:taskId - delete a task (ADMIN only)
router.delete('/:taskId', resolveTaskProject, requireRole(['ADMIN']), deleteTask);

module.exports = router;
