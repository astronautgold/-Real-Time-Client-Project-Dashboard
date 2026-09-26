import cron from 'node-cron';
import { TaskStatus, NotificationType } from '../types/enums';
import { prisma } from '../db/prisma';
import { socketManager } from '../sockets/socket.manager';

export const startOverdueScheduler = () => {
  console.log('⏰ Initializing Overdue Tasks Background Scheduler (running every minute)...');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find tasks past due date, not DONE, and not yet flagged as overdue
      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
          isOverdue: false,
        },
        include: {
          project: {
            select: { id: true, title: true, createdById: true },
          },
          assignedTo: {
            select: { id: true, name: true },
          },
        },
      });

      if (overdueTasks.length === 0) {
        return;
      }

      console.log(`⏰ Overdue Scheduler found ${overdueTasks.length} newly overdue tasks.`);

      for (const task of overdueTasks) {
        // Update task isOverdue flag
        const updatedTask = await prisma.task.update({
          where: { id: task.id },
          data: { isOverdue: true },
          include: {
            project: { select: { id: true, title: true, createdById: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
          },
        });

        // Create ActivityLog entry
        const activityLog = await prisma.activityLog.create({
          data: {
            taskId: task.id,
            projectId: task.projectId,
            userId: task.project.createdById, // System action associated with project PM
            action: 'OVERDUE_FLAGGED',
            previousStatus: task.status,
            newStatus: task.status,
            details: `Task "${task.title}" past due date (${task.dueDate.toISOString().split('T')[0]}) was automatically flagged as Overdue`,
          },
          include: {
            user: { select: { id: true, name: true, role: true } },
            task: { select: { id: true, title: true } },
            project: { select: { id: true, title: true } },
          },
        });

        // Notify assigned Developer if present
        if (task.assignedToId) {
          const devNotification = await prisma.notification.create({
            data: {
              userId: task.assignedToId,
              taskId: task.id,
              title: 'Task Overdue Warning',
              message: `Task "${task.title}" in project "${task.project.title}" is now past its due date!`,
              type: NotificationType.TASK_OVERDUE,
            },
          });
          socketManager.broadcastNotification(task.assignedToId, devNotification);
        }

        // Notify PM of the project
        const pmNotification = await prisma.notification.create({
          data: {
            userId: task.project.createdById,
            taskId: task.id,
            title: 'Task Overdue Alert',
            message: `Task "${task.title}" in project "${task.project.title}" was flagged as Overdue.`,
            type: NotificationType.TASK_OVERDUE,
          },
        });
        socketManager.broadcastNotification(task.project.createdById, pmNotification);

        // Broadcast ActivityLog & Task update
        socketManager.broadcastActivityLog({
          activityLog,
          projectId: task.projectId,
          projectCreatedById: task.project.createdById,
          assignedToId: task.assignedToId,
        });

        socketManager.broadcastTaskUpdate(task.projectId, updatedTask);
      }
    } catch (error) {
      console.error('❌ Error in Overdue Task Scheduler:', error);
    }
  });
};
