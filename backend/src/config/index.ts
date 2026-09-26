import dotenv from 'dotenv';
import path from 'path';
import { SignOptions } from 'jsonwebtoken';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-access-key-velozity-2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-jwt-refresh-key-velozity-2026',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  accessTokenExpiresIn: '15m' as SignOptions['expiresIn'],
  refreshTokenExpiresIn: '7d' as SignOptions['expiresIn'],
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};
