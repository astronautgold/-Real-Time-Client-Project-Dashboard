import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, TaskStatus, TaskPriority, NotificationType } from '../src/types/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@velozity.com',
      passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
    },
  });

  const pm1 = await prisma.user.create({
    data: {
      email: 'pm1@velozity.com',
      passwordHash,
      name: 'Sarah Connor',
      role: Role.PROJECT_MANAGER,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: 'pm2@velozity.com',
      passwordHash,
      name: 'Arthur Dent',
      role: Role.PROJECT_MANAGER,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: 'dev1@velozity.com',
      passwordHash,
      name: 'Ravi Kumar',
      role: Role.DEVELOPER,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'dev2@velozity.com',
      passwordHash,
      name: 'Elena Rostova',
      role: Role.DEVELOPER,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: 'dev3@velozity.com',
      passwordHash,
      name: 'Carlos Mendez',
      role: Role.DEVELOPER,
    },
  });

  const dev4 = await prisma.user.create({
    data: {
      email: 'dev4@velozity.com',
      passwordHash,
      name: 'Aisha Khan',
      role: Role.DEVELOPER,
    },
  });

  console.log('✅ Created 7 Users (1 Admin, 2 PMs, 4 Developers)');

  // 2. Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Acme Corporation',
      company: 'Acme Corp',
      email: 'contact@acme.com',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'TechStart Inc',
      company: 'TechStart',
      email: 'hello@techstart.io',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Global Dynamics',
      company: 'Global Dynamics LLC',
      email: 'info@globaldyn.com',
    },
  });

  console.log('✅ Created 3 Clients');

  // 3. Create Projects
  const project1 = await prisma.project.create({
    data: {
      title: 'E-Commerce Mobile App',
      description: 'Cross-platform mobile shopping application with real-time checkout and payments.',
      clientId: client1.id,
      createdById: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'Cloud Infrastructure Migration',
      description: 'Migrating legacy on-premise servers to AWS Kubernetes clusters.',
      clientId: client2.id,
      createdById: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: 'AI Analytics Dashboard',
      description: 'Real-time telemetry and Predictive ML pipeline dashboard for executive metrics.',
      clientId: client3.id,
      createdById: pm2.id,
    },
  });

  console.log('✅ Created 3 Projects');

  const now = new Date();
  const pastDate1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
  const pastDate2 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
  const futureDate1 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days in future
  const futureDate2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in future

  // 4. Create Tasks for Project 1 (PM1)
  const task1_1 = await prisma.task.create({
    data: {
      title: 'Setup Authentication Flow & OAuth',
      description: 'Implement JWT login, refresh tokens, and Google sign-in integration.',
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: pastDate1,
      isOverdue: false,
    },
  });

  const task1_2 = await prisma.task.create({
    data: {
      title: 'Design Checkout & Stripe Payment Gateway',
      description: 'Integrate Stripe Webhooks and handle 3DS card verification.',
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate2, // Overdue task #1
      isOverdue: true,
    },
  });

  const task1_3 = await prisma.task.create({
    data: {
      title: 'Build Product Catalog Grid UI',
      description: 'Infinite scroll catalog list with dynamic filtering and search.',
      projectId: project1.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate1,
      isOverdue: false,
    },
  });

  const task1_4 = await prisma.task.create({
    data: {
      title: 'Push Notification Dispatcher Service',
      description: 'FCM setup for push notifications on order status changes.',
      projectId: project1.id,
      assignedToId: dev2.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.LOW,
      dueDate: futureDate2,
      isOverdue: false,
    },
  });

  const task1_5 = await prisma.task.create({
    data: {
      title: 'User Profile & Address Book Manager',
      description: 'Saved payment methods and saved shipping addresses CRUD.',
      projectId: project1.id,
      assignedToId: dev1.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate2,
      isOverdue: false,
    },
  });

  // 5. Create Tasks for Project 2 (PM1)
  const task2_1 = await prisma.task.create({
    data: {
      title: 'Dockerize Backend Services & Microservices',
      description: 'Multi-stage Dockerfiles for optimized container builds.',
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: pastDate1,
      isOverdue: false,
    },
  });

  const task2_2 = await prisma.task.create({
    data: {
      title: 'Configure EKS Kubernetes Clusters & Ingress',
      description: 'Setup AWS EKS cluster, ALB Ingress Controller, and cert-manager.',
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: pastDate1, // Overdue task #2
      isOverdue: true,
    },
  });

  const task2_3 = await prisma.task.create({
    data: {
      title: 'PostgreSQL Database Migration Script',
      description: 'Migrate on-prem DB to RDS PostgreSQL with zero downtime.',
      projectId: project2.id,
      assignedToId: dev4.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: futureDate1,
      isOverdue: false,
    },
  });

  const task2_4 = await prisma.task.create({
    data: {
      title: 'Setup Prometheus & Grafana Monitoring',
      description: 'Metric collectors and alerts for cluster CPU/Memory spikes.',
      projectId: project2.id,
      assignedToId: dev4.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate2,
      isOverdue: false,
    },
  });

  const task2_5 = await prisma.task.create({
    data: {
      title: 'CI/CD Pipeline with GitHub Actions',
      description: 'Automated testing and staging deployments on PR merge.',
      projectId: project2.id,
      assignedToId: dev3.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.HIGH,
      dueDate: futureDate2,
      isOverdue: false,
    },
  });

  // 6. Create Tasks for Project 3 (PM2)
  const task3_1 = await prisma.task.create({
    data: {
      title: 'Train Customer Churn Prediction Model',
      description: 'Scikit-learn model training pipeline for churn risk scoring.',
      projectId: project3.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: futureDate1,
      isOverdue: false,
    },
  });

  const task3_2 = await prisma.task.create({
    data: {
      title: 'Build Real-Time Telemetry Stream Pipeline',
      description: 'Kafka consumer service feeding WebSockets for live charts.',
      projectId: project3.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: futureDate1,
      isOverdue: false,
    },
  });

  const task3_3 = await prisma.task.create({
    data: {
      title: 'Executive PDF Report Export Feature',
      description: 'Generate formatted PDF reports with embedded charts.',
      projectId: project3.id,
      assignedToId: dev3.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.MEDIUM,
      dueDate: futureDate2,
      isOverdue: false,
    },
  });

  const task3_4 = await prisma.task.create({
    data: {
      title: 'User Access Log & Audit Trail UI',
      description: 'Filterable datatable showing user login activity and actions.',
      projectId: project3.id,
      assignedToId: dev4.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: pastDate2,
      isOverdue: false,
    },
  });

  const task3_5 = await prisma.task.create({
    data: {
      title: 'Role-Based Executive Permission Rules',
      description: 'Ensure regional VPs only view their region telemetry.',
      projectId: project3.id,
      assignedToId: dev4.id,
      status: TaskStatus.TO_DO,
      priority: TaskPriority.HIGH,
      dueDate: futureDate2,
      isOverdue: false,
    },
  });

  console.log('✅ Created 15 Tasks across 3 Projects');

  // 7. Create Seed Activity Log Entries
  await prisma.activityLog.createMany({
    data: [
      {
        taskId: task1_1.id,
        projectId: project1.id,
        userId: dev1.id,
        action: 'STATUS_CHANGE',
        previousStatus: TaskStatus.IN_REVIEW,
        newStatus: TaskStatus.DONE,
        details: 'Ravi Kumar moved Task "Setup Authentication Flow & OAuth" from In Review → Done',
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        taskId: task1_2.id,
        projectId: project1.id,
        userId: dev1.id,
        action: 'STATUS_CHANGE',
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        details: 'Ravi Kumar moved Task "Design Checkout & Stripe Payment Gateway" from In Progress → In Review',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        taskId: task2_2.id,
        projectId: project2.id,
        userId: pm1.id,
        action: 'OVERDUE_FLAGGED',
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_PROGRESS,
        details: 'System flagged Task "Configure EKS Kubernetes Clusters & Ingress" as Overdue',
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        taskId: task3_2.id,
        projectId: project3.id,
        userId: dev2.id,
        action: 'STATUS_CHANGE',
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_REVIEW,
        details: 'Elena Rostova moved Task "Build Real-Time Telemetry Stream Pipeline" from In Progress → In Review',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
      },
    ],
  });

  console.log('✅ Created Seed Activity Logs');

  // 8. Create Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: dev1.id,
        taskId: task1_2.id,
        title: 'Task Assigned',
        message: 'You have been assigned to task: Design Checkout & Stripe Payment Gateway',
        type: NotificationType.TASK_ASSIGNED,
        isRead: false,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        userId: pm1.id,
        taskId: task1_2.id,
        title: 'Task Ready for Review',
        message: 'Ravi Kumar moved Task "Design Checkout & Stripe Payment Gateway" to In Review',
        type: NotificationType.TASK_IN_REVIEW,
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userId: dev3.id,
        taskId: task2_2.id,
        title: 'Task Overdue Notice',
        message: 'Task "Configure EKS Kubernetes Clusters & Ingress" is now past its due date!',
        type: NotificationType.TASK_OVERDUE,
        isRead: false,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
      {
        userId: pm2.id,
        taskId: task3_2.id,
        title: 'Task Ready for Review',
        message: 'Elena Rostova moved Task "Build Real-Time Telemetry Stream Pipeline" to In Review',
        type: NotificationType.TASK_IN_REVIEW,
        isRead: false,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Created Seed Notifications');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
