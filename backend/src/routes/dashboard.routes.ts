import { Router, Request, Response, NextFunction } from 'express';
import { Role, TaskStatus, TaskPriority } from '../types/enums';
import { prisma } from '../db/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';
import { socketManager } from '../sockets/socket.manager';

const router = Router();

router.use(authenticateToken);

// GET /api/dashboard/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const now = new Date();

    if (user.role === Role.ADMIN) {
      const [totalProjects, tasksGroupedByStatus, overdueTaskCount] = await Promise.all([
        prisma.project.count(),
        prisma.task.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        prisma.task.count({
          where: {
            OR: [
              { isOverdue: true },
              { dueDate: { lt: now }, status: { not: TaskStatus.DONE } },
            ],
          },
        }),
      ]);

      const tasksByStatusMap: Record<string, number> = {
        TO_DO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0,
      };

      tasksGroupedByStatus.forEach((group) => {
        tasksByStatusMap[group.status] = group._count.status;
      });

      return res.status(200).json({
        success: true,
        data: {
          role: Role.ADMIN,
          totalProjects,
          tasksByStatus: tasksByStatusMap,
          overdueTaskCount,
          activeUsersOnline: socketManager.getOnlineUsersCount(),
        },
      });
    }

    if (user.role === Role.PROJECT_MANAGER) {
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [myProjectsCount, tasksGroupedByPriority, upcomingTasks, overdueCount] = await Promise.all([
        prisma.project.count({
          where: { createdById: user.id },
        }),
        prisma.task.groupBy({
          by: ['priority'],
          where: { project: { createdById: user.id } },
          _count: { priority: true },
        }),
        prisma.task.findMany({
          where: {
            project: { createdById: user.id },
            dueDate: { gte: now, lte: sevenDaysFromNow },
            status: { not: TaskStatus.DONE },
          },
          include: {
            project: { select: { id: true, title: true } },
            assignedTo: { select: { id: true, name: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 10,
        }),
        prisma.task.count({
          where: {
            project: { createdById: user.id },
            OR: [
              { isOverdue: true },
              { dueDate: { lt: now }, status: { not: TaskStatus.DONE } },
            ],
          },
        }),
      ]);

      const tasksByPriorityMap: Record<string, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      };

      tasksGroupedByPriority.forEach((group) => {
        tasksByPriorityMap[group.priority] = group._count.priority;
      });

      return res.status(200).json({
        success: true,
        data: {
          role: Role.PROJECT_MANAGER,
          myProjectsCount,
          tasksByPriority: tasksByPriorityMap,
          upcomingTasksThisWeek: upcomingTasks,
          overdueCount,
        },
      });
    }

    if (user.role === Role.DEVELOPER) {
      const [assignedTasks, tasksByStatus] = await Promise.all([
        prisma.task.findMany({
          where: { assignedToId: user.id },
          include: {
            project: { select: { id: true, title: true } },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        }),
        prisma.task.groupBy({
          by: ['status'],
          where: { assignedToId: user.id },
          _count: { status: true },
        }),
      ]);

      const tasksByStatusMap: Record<string, number> = {
        TO_DO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0,
      };

      tasksByStatus.forEach((group) => {
        tasksByStatusMap[group.status] = group._count.status;
      });

      return res.status(200).json({
        success: true,
        data: {
          role: Role.DEVELOPER,
          totalAssignedTasks: assignedTasks.length,
          tasksByStatus: tasksByStatusMap,
          assignedTasks,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
