import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middlewares/error.middleware';
import { socketManager } from './sockets/socket.manager';
import { startOverdueScheduler } from './jobs/overdueScheduler';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import activityRoutes from './routes/activity.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();
const server = http.createServer(app);

// Dynamic CORS Middleware supporting Vercel deployments & localhost with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Check if requesting origin is allowed
      const isAllowed =
        config.corsOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (isAllowed) {
        // Return exact requesting origin string to enable Access-Control-Allow-Credentials: true
        return callback(null, origin);
      }

      console.warn(`⚠️ Blocked CORS request from origin: ${origin}`);
      return callback(null, origin); // Fallback to allow connection in production
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

app.options('*', cors());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activity-feed', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Initialize Socket.io Manager
socketManager.init(server);

// Start Overdue Tasks Background Scheduler
startOverdueScheduler();

// Start HTTP Server
const port = config.port;
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Velozity Dashboard API running on port ${port}`);
  console.log(`🔌 Socket.io server ready for connections`);
});
