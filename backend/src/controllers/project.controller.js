const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

/**
 * GET /api/projects
 * Return all projects where the current user is a member
 */
const getProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: req.user.userId,
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects
 * Create a new project; the creator becomes ADMIN
 */
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: req.user.userId,
        members: {
          create: {
            userId: req.user.userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { members: true, tasks: true } },
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Return project details with all members
 */
const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { tasks: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/projects/:id
 * Update project name and/or description (ADMIN only)
 */
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.json(project);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id
 * Delete project and cascade-delete members and tasks (ADMIN only)
 */
const deleteProject = async (req, res, next) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects/:id/members
 * Add a member to a project by email (ADMIN only)
 */
const addMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role } = req.body;
    const projectId = req.params.id;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address.' });
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return res.status(409).json({ message: 'This user is already a member of this project.' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: role || 'MEMBER',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id/members/:userId
 * Remove a member from a project (ADMIN only)
 */
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found in this project.' });
    }

    // Prevent removing the last ADMIN
    if (member.role === 'ADMIN') {
      const adminCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: 'ADMIN',
        },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          message: 'Cannot remove the last admin. Promote another member to admin first.',
        });
      }
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
