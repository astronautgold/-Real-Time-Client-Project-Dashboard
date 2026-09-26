import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { AppError } from '../middlewares/error.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// POST /api/auth/login
router.post(
  '/login',
  validateRequest(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return next(new AppError('Invalid credentials', 401));
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return next(new AppError('Invalid credentials', 401));
      }

      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      const accessToken = jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.accessTokenExpiresIn,
      });

      const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
        expiresIn: config.refreshTokenExpiresIn,
      });

      // Store Refresh Token in HttpOnly Cookie
      res.cookie('refreshToken', refreshToken, config.cookieOptions);

      return res.status(200).json({
        success: true,
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return next(new AppError('Refresh token missing', 401));
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const newAccessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.accessTokenExpiresIn,
    });

    const newRefreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.refreshTokenExpiresIn,
    });

    res.cookie('refreshToken', newRefreshToken, config.cookieOptions);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
