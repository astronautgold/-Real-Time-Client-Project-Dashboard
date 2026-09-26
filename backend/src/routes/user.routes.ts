import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '../types/enums';
import { prisma } from '../db/prisma';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

// GET /api/users - Accessible by Admin & PMs
router.get(
  '/',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role } = req.query;

      const where: any = {};
      if (role && Object.values(Role).includes(role as Role)) {
        where.role = role as Role;
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/clients - Get all clients
router.get('/clients', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
