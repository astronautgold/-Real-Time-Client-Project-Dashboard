import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../types/enums';
import { config } from '../config';
import { AppError } from './error.middleware';
import { prisma } from '../db/prisma';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateToken = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError('Authentication token missing or invalid', 401));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized access', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource`,
          403
        )
      );
    }

    next();
  };
};

export const requireProjectOwnership = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized access', 401));
    }

    if (req.user.role === Role.ADMIN) {
      return next(); // Admin has full global access
    }

    if (req.user.role !== Role.PROJECT_MANAGER) {
      return next(new AppError('Forbidden: Only Project Managers and Admins can access this resource', 403));
    }

    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    if (!projectId) {
      return next(new AppError('Project ID is required for ownership check', 400));
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, createdById: true },
    });

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    if (project.createdById !== req.user.id) {
      return next(
        new AppError('Forbidden: You can only view or manage projects you created', 403)
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireTaskAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized access', 401));
    }

    if (req.user.role === Role.ADMIN) {
      return next(); // Admin bypasses
    }

    const taskId = req.params.taskId || req.params.id;
    if (!taskId) {
      return next(new AppError('Task ID is required for access check', 400));
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { createdById: true },
        },
      },
    });

    if (!task) {
      return next(new AppError('Task not found', 404));
    }

    if (req.user.role === Role.PROJECT_MANAGER) {
      if (task.project.createdById !== req.user.id) {
        return next(new AppError('Forbidden: You can only manage tasks in your own projects', 403));
      }
    } else if (req.user.role === Role.DEVELOPER) {
      if (task.assignedToId !== req.user.id) {
        return next(new AppError('Forbidden: Developers can only view and update their assigned tasks', 403));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
