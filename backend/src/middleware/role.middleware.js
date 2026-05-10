const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const requireRole = (allowedRoles) => async (req, res, next) => {
  const projectId = req.params.id || req.params.projectId;
  
  if (!projectId) {
    return res.status(400).json({ message: 'Project ID is required.' });
  }

  try {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.userId
        }
      }
    });

    if (!member || !allowedRoles.includes(member.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient role"
      });
    }

    req.member = member; // attach for use in controllers
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireRole };
