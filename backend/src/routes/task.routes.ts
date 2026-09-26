import { Router, Request, Response, NextFunction } from 'express';
import { Role, TaskStatus, TaskPriority, NotificationType } from '../types/enums';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { AppError } from '../middlewares/error.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateToken, requireRole, requireTaskAccess } from '../middlewares/auth.middleware';
import { socketManager } from '../sockets/socket.manager';

const router = Router();

router.use(authenticateToken);

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    projectId: z.string().uuid('Valid Project ID is required'),
    assignedToId: z.string().uuid().optional().nullable(),
    priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
    dueDate: z.string().datetime({ message: 'ISO datetime format required for dueDate' }),
  }),
});

const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TaskStatus),
  }),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(5).optional(),
    assignedToId: z.string().uuid().optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().datetime().optional(),
  }),
});

// GET /api/tasks - Query filtered tasks
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { status, priority, projectId, startDate, endDate, search } = req.query;

    let where: any = {};

    // Role scoping
    if (user.role === Role.DEVELOPER) {
      where.assignedToId = user.id;
    } else if (user.role === Role.PROJECT_MANAGER) {
      where.project = { createdById: user.id };
    }

    // Filters
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status as TaskStatus;
    }

    if (priority && Object.values(TaskPriority).includes(priority as TaskPriority)) {
      where.priority = priority as TaskPriority;
    }

    if (projectId) {
      where.projectId = projectId as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate as string);
      if (endDate) where.dueDate.lte = new Date(endDate as string);
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, title: true, createdById: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Create task (Admin or PM owner)
router.post(
  '/',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validateRequest(createTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { title, description, projectId, assignedToId, priority, dueDate } = req.body;

      // Check project existence & ownership for PM
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return next(new AppError('Project not found', 404));
      }

      if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.id) {
        return next(new AppError('Forbidden: You can only create tasks in your own projects', 403));
      }

      const dueDateTime = new Date(dueDate);
      const isOverdue = dueDateTime < new Date();

      const task = await prisma.task.create({
        data: {
          title,
          description,
          projectId,
          assignedToId: assignedToId || null,
          priority,
          dueDate: dueDateTime,
          isOverdue,
          status: TaskStatus.TO_DO,
        },
        include: {
          project: { select: { id: true, title: true, createdById: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      // Record Activity Log
      const activityLog = await prisma.activityLog.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: user.id,
          action: 'CREATED',
          newStatus: TaskStatus.TO_DO,
          details: `${user.name} created Task "${task.title}"`,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
          task: { select: { id: true, title: true } },
          project: { select: { id: true, title: true } },
        },
      });

      // If assigned to a developer, create notification
      if (assignedToId) {
        const notification = await prisma.notification.create({
          data: {
            userId: assignedToId,
            taskId: task.id,
            title: 'New Task Assigned',
            message: `You have been assigned to task "${task.title}" in project "${project.title}"`,
            type: NotificationType.TASK_ASSIGNED,
          },
        });
        socketManager.broadcastNotification(assignedToId, notification);
      }

      // Broadcast Socket events
      socketManager.broadcastActivityLog({
        activityLog,
        projectId: task.projectId,
        projectCreatedById: project.createdById,
        assignedToId: task.assignedToId,
      });

      socketManager.broadcastTaskUpdate(task.projectId, task);

      return res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/tasks/:id/status - Update Task Status
router.patch(
  '/:id/status',
  requireTaskAccess,
  validateRequest(updateTaskStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status: newStatus } = req.body;
      const user = req.user!;

      const existingTask = await prisma.task.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, title: true, createdById: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      if (!existingTask) {
        return next(new AppError('Task not found', 404));
      }

      const previousStatus = existingTask.status;
      if (previousStatus === newStatus) {
        return res.status(200).json({ success: true, data: existingTask });
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: newStatus,
          // Clear overdue flag if completed
          ...(newStatus === TaskStatus.DONE && { isOverdue: false }),
        },
        include: {
          project: { select: { id: true, title: true, createdById: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      // Record Activity Log (Required by prompt: stored in DB, not derived)
      const activityLog = await prisma.activityLog.create({
        data: {
          taskId: updatedTask.id,
          projectId: updatedTask.projectId,
          userId: user.id,
          action: 'STATUS_CHANGE',
          previousStatus,
          newStatus,
          details: `${user.name} moved Task "${updatedTask.title}" from ${previousStatus.replace('_', ' ')} → ${newStatus.replace('_', ' ')}`,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
          task: { select: { id: true, title: true } },
          project: { select: { id: true, title: true } },
        },
      });

      // Notification Trigger: When task is moved to IN_REVIEW by Dev, notify PM
      if (newStatus === TaskStatus.IN_REVIEW && user.role === Role.DEVELOPER) {
        const pmId = existingTask.project.createdById;
        const notification = await prisma.notification.create({
          data: {
            userId: pmId,
            taskId: updatedTask.id,
            title: 'Task Ready for Review',
            message: `${user.name} moved Task "${updatedTask.title}" to In Review`,
            type: NotificationType.TASK_IN_REVIEW,
          },
        });
        socketManager.broadcastNotification(pmId, notification);
      }

      // Broadcast WebSocket events
      socketManager.broadcastActivityLog({
        activityLog,
        projectId: updatedTask.projectId,
        projectCreatedById: existingTask.project.createdById,
        assignedToId: updatedTask.assignedToId,
      });

      socketManager.broadcastTaskUpdate(updatedTask.projectId, updatedTask);

      return res.status(200).json({
        success: true,
        data: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/tasks/:id - Full task update (Admin or PM owner)
router.put(
  '/:id',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  requireTaskAccess,
  validateRequest(updateTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { title, description, assignedToId, status, priority, dueDate } = req.body;
      const user = req.user!;

      const existingTask = await prisma.task.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, title: true, createdById: true } },
        },
      });

      if (!existingTask) {
        return next(new AppError('Task not found', 404));
      }

      const isAssignmentChanged =
        assignedToId !== undefined && assignedToId !== existingTask.assignedToId;

      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(assignedToId !== undefined && { assignedToId }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(dueDate && {
            dueDate: new Date(dueDate),
            isOverdue: new Date(dueDate) < new Date() && (status || existingTask.status) !== TaskStatus.DONE,
          }),
        },
        include: {
          project: { select: { id: true, title: true, createdById: true } },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      // Activity Log entry
      const activityLog = await prisma.activityLog.create({
        data: {
          taskId: updatedTask.id,
          projectId: updatedTask.projectId,
          userId: user.id,
          action: isAssignmentChanged ? 'ASSIGNED' : 'UPDATED',
          previousStatus: existingTask.status,
          newStatus: updatedTask.status,
          details: isAssignmentChanged
            ? `${user.name} reassigned Task "${updatedTask.title}"`
            : `${user.name} updated details of Task "${updatedTask.title}"`,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
          task: { select: { id: true, title: true } },
          project: { select: { id: true, title: true } },
        },
      });

      // Notification if developer assigned
      if (isAssignmentChanged && assignedToId) {
        const notification = await prisma.notification.create({
          data: {
            userId: assignedToId,
            taskId: updatedTask.id,
            title: 'Task Assigned',
            message: `You have been assigned to task "${updatedTask.title}" in project "${existingTask.project.title}"`,
            type: NotificationType.TASK_ASSIGNED,
          },
        });
        socketManager.broadcastNotification(assignedToId, notification);
      }

      // Broadcast events
      socketManager.broadcastActivityLog({
        activityLog,
        projectId: updatedTask.projectId,
        projectCreatedById: existingTask.project.createdById,
        assignedToId: updatedTask.assignedToId,
      });

      socketManager.broadcastTaskUpdate(updatedTask.projectId, updatedTask);

      return res.status(200).json({
        success: true,
        data: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
