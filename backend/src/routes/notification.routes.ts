import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// GET /api/notifications - User's notifications
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        task: {
          select: { id: true, title: true, projectId: true },
        },
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const updated = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
