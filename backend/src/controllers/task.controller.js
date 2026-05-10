const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

/**
 * GET /api/projects/:id/tasks
 * Return all tasks in the project with assignee info
 */
const getTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects/:id/tasks
 * Create a task in the project (ADMIN only)
 */
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, status, dueDate, assignedToId } = req.body;
    const projectId = req.params.id;

    // If assignedToId is provided, verify they are a project member
    if (assignedToId) {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: assignedToId,
          },
        },
      });

      if (!isMember) {
        return res.status(400).json({
          message: 'The assigned user is not a member of this project.',
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assignedToId: assignedToId || null,
        createdById: req.user.userId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;

    // Members can only touch the status of tasks assigned to them.
    // Admins get full edit access across all fields.
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: req.user.userId,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this project.' });
    }

    let updateData = {};

    if (member.role === 'ADMIN') {
      const { title, description, priority, status, dueDate, assignedToId } = req.body;

      if (assignedToId !== undefined && assignedToId !== null) {
        const isMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: task.projectId,
              userId: assignedToId,
            },
          },
        });

        if (!isMember) {
          return res.status(400).json({
            message: 'The assigned user is not a member of this project.',
          });
        }
      }

      updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      };
    } 
    else if (member.role === 'MEMBER') {
      if (task.assignedToId !== req.user.userId) {
        return res.status(403).json({
          message: 'You can only update tasks assigned to you',
        });
      }

      // Ignore any other fields sent in the body silently, only allow status
      const { status } = req.body;
      if (status !== undefined) {
        updateData.status = status;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:taskId
 * Delete a task (ADMIN only in the task's project)
 */
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Role check is now handled by the requireRole middleware in routes
    await prisma.task.delete({ where: { id: taskId } });

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
