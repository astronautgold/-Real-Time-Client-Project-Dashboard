export const Role = {
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  DEVELOPER: 'DEVELOPER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const TaskStatus = {
  TO_DO: 'TO_DO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  DONE: 'DONE',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const NotificationType = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_IN_REVIEW: 'TASK_IN_REVIEW',
  TASK_OVERDUE: 'TASK_OVERDUE',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
