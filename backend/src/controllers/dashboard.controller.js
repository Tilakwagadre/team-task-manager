const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/projects/:id/dashboard
 * Return dashboard stats for a project
 */
const getDashboard = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const totalTasks = await prisma.task.count({
      where: { projectId },
    });

    const statusGroups = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { status: true },
    });

    const byStatus = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    statusGroups.forEach((group) => {
      byStatus[group.status] = group._count.status;
    });

    const tasksByUser = await prisma.task.groupBy({
      by: ['assignedToId'],
      where: {
        projectId,
        assignedToId: { not: null },
      },
      _count: { assignedToId: true },
    });

    const userIds = tasksByUser.map((t) => t.assignedToId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = {};
    users.forEach((u) => {
      userMap[u.id] = u.name;
    });

    const byUser = tasksByUser.map((t) => ({
      userId: t.assignedToId,
      name: userMap[t.assignedToId] || 'Unknown',
      taskCount: t._count.assignedToId,
    }));

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdue = await prisma.task.findMany({
      where: {
        projectId,
        dueDate: { lt: now },
        status: { not: 'DONE' },
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({
      totalTasks,
      byStatus,
      byUser,
      overdue,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
