import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '../types/enums';
import { prisma } from '../db/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// GET /api/activity-feed - Role-filtered catchup activity logs from database
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    let where: any = {};

    if (user.role === Role.PROJECT_MANAGER) {
      // PM sees activity only from their own projects
      where.project = {
        createdById: user.id,
      };
    } else if (user.role === Role.DEVELOPER) {
      // Developer sees activity only on tasks assigned to them
      where.task = {
        assignedToId: user.id,
      };
    }
    // Admin sees activity across all projects (where = {})

    const activities = await prisma.activityLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, role: true, email: true },
        },
        task: {
          select: { id: true, title: true, status: true, priority: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
