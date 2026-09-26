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

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || config.corsOrigins.includes(origin));
    },
    credentials: true,
  })
);
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

// Start HTTP Server binding to 0.0.0.0 for universal local access
server.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 Velozity Dashboard API running on http://0.0.0.0:${config.port}`);
  console.log(`🔌 Socket.io server ready for connections`);
});
