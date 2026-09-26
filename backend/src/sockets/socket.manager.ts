import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Role } from '../types/enums';
import { config } from '../config';
import { AuthUser } from '../middlewares/auth.middleware';

export interface AuthenticatedSocket extends Socket {
  user?: AuthUser;
}

class SocketManager {
  private io: SocketIOServer | null = null;
  private onlineUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  public init(server: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigins,
        credentials: true,
      },
    });

    // Handshake Auth Middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required for socket connection'));
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
        socket.user = decoded;
        next();
      } catch (err) {
        return next(new Error('Invalid socket authentication token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const user = socket.user;
      if (!user) return;

      console.log(`🔌 Socket connected: ${user.name} (${user.role}) - ${socket.id}`);

      // Track online presence
      if (!this.onlineUsers.has(user.id)) {
        this.onlineUsers.set(user.id, new Set());
      }
      this.onlineUsers.get(user.id)!.add(socket.id);
      this.emitPresenceUpdate();

      // Join user specific room
      socket.join(`user_${user.id}`);

      // Join role-specific rooms
      if (user.role === Role.ADMIN) {
        socket.join('admin_global');
      } else if (user.role === Role.PROJECT_MANAGER) {
        socket.join(`pm_${user.id}`);
      } else if (user.role === Role.DEVELOPER) {
        socket.join(`dev_${user.id}`);
      }

      // Allow joining specific project board room
      socket.on('join:project', (projectId: string) => {
        socket.join(`project_${projectId}`);
        console.log(`👁️ User ${user.name} joined project room: project_${projectId}`);
      });

      socket.on('leave:project', (projectId: string) => {
        socket.leave(`project_${projectId}`);
        console.log(`👋 User ${user.name} left project room: project_${projectId}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
        const userSockets = this.onlineUsers.get(user.id);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.onlineUsers.delete(user.id);
          }
        }
        this.emitPresenceUpdate();
      });
    });

    return this.io;
  }

  public getOnlineUsersCount(): number {
    return this.onlineUsers.size;
  }

  private emitPresenceUpdate() {
    if (this.io) {
      this.io.to('admin_global').emit('presence:update', {
        activeUsersCount: this.getOnlineUsersCount(),
        onlineUserIds: Array.from(this.onlineUsers.keys()),
      });
    }
  }

  public broadcastActivityLog(params: {
    activityLog: any;
    projectId: string;
    projectCreatedById: string;
    assignedToId?: string | null;
  }) {
    if (!this.io) return;

    const { activityLog, projectId, projectCreatedById, assignedToId } = params;

    // 1. Admin global feed
    this.io.to('admin_global').emit('activity:new', activityLog);

    // 2. PM's project feed
    this.io.to(`pm_${projectCreatedById}`).emit('activity:new', activityLog);

    // 3. Developer's feed if assigned
    if (assignedToId) {
      this.io.to(`dev_${assignedToId}`).emit('activity:new', activityLog);
    }

    // 4. Room of users currently viewing this project board
    this.io.to(`project_${projectId}`).emit('activity:new', activityLog);
  }

  public broadcastNotification(userId: string, notification: any) {
    if (!this.io) return;
    this.io.to(`user_${userId}`).emit('notification:new', notification);
  }

  public broadcastTaskUpdate(projectId: string, task: any) {
    if (!this.io) return;
    this.io.to(`project_${projectId}`).emit('task:updated', task);
    if (task.assignedToId) {
      this.io.to(`user_${task.assignedToId}`).emit('task:updated', task);
    }
  }
}

export const socketManager = new SocketManager();
