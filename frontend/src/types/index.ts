export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_IN_REVIEW' | 'TASK_OVERDUE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  clientId: string;
  createdById: string;
  client?: Client;
  createdBy?: User;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedToId?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  project?: {
    id: string;
    title: string;
    createdById?: string;
  };
  assignedTo?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  taskId?: string | null;
  projectId: string;
  userId: string;
  action: string;
  previousStatus?: TaskStatus | null;
  newStatus?: TaskStatus | null;
  details: string;
  createdAt: string;
  user?: User;
  task?: { id: string; title: string };
  project?: { id: string; title: string };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  taskId?: string | null;
  task?: { id: string; title: string; projectId: string };
  createdAt: string;
}

export interface AdminStats {
  role: 'ADMIN';
  totalProjects: number;
  tasksByStatus: Record<TaskStatus, number>;
  overdueTaskCount: number;
  activeUsersOnline: number;
}

export interface PmStats {
  role: 'PROJECT_MANAGER';
  myProjectsCount: number;
  tasksByPriority: Record<TaskPriority, number>;
  upcomingTasksThisWeek: Task[];
  overdueCount: number;
}

export interface DevStats {
  role: 'DEVELOPER';
  totalAssignedTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  assignedTasks: Task[];
}

export type DashboardStats = AdminStats | PmStats | DevStats;
