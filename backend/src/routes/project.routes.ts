import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '../types/enums';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { AppError } from '../middlewares/error.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateToken, requireRole, requireProjectOwnership } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    clientId: z.string().uuid('Valid Client ID is required'),
  }),
});

const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(5).optional(),
    clientId: z.string().uuid().optional(),
  }),
});

// GET /api/projects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    let where: any = {};

    if (user.role === Role.PROJECT_MANAGER) {
      // PM can only see projects they created
      where.createdById = user.id;
    } else if (user.role === Role.DEVELOPER) {
      // Dev can only see projects where they have assigned tasks
      where.tasks = {
        some: {
          assignedToId: user.id,
        },
      };
    }
    // Admin sees all projects (where = {})

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { tasks: true },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            dueDate: true,
            isOverdue: true,
            assignedToId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Admin & PM only
router.post(
  '/',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest(createProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, clientId } = req.body;
      const user = req.user!;

      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return next(new AppError('Client not found', 404));
      }

      const project = await prisma.project.create({
        data: {
          title,
          description,
          clientId,
          createdById: user.id,
        },
        include: {
          client: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        },
      },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // Role-based access check
    if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.id) {
      return next(new AppError('Forbidden: You cannot view another PM\'s project', 403));
    }

    if (user.role === Role.DEVELOPER) {
      const hasTaskInProject = project.tasks.some((task) => task.assignedToId === user.id);
      if (!hasTaskInProject) {
        return next(new AppError('Forbidden: You do not have tasks in this project', 403));
      }
      // Developers should only see their assigned tasks within the project
      project.tasks = project.tasks.filter((t) => t.assignedToId === user.id);
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - Admin & PM owner only
router.put(
  '/:id',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  requireProjectOwnership,
  validateRequest(updateProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, description, clientId } = req.body;

      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(clientId && { clientId }),
        },
        include: {
          client: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return res.status(200).json({
        success: true,
        data: updatedProject,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/projects/:id - Admin & PM owner only
router.delete(
  '/:id',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  requireProjectOwnership,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await prisma.project.delete({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
