# Velozity | Real-Time Client Project Dashboard

A production-grade full-stack web application built for agency project management, task tracking, and live activity monitoring with strict Role-Based Access Control (RBAC), WebSocket notifications, and automated background jobs.

---

## Technical Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios, Socket.io-client
- **Backend**: Node.js, Express, TypeScript, Socket.io, Prisma ORM, node-cron, Zod, bcryptjs, jsonwebtoken
- **Database**: PostgreSQL 16
- **Containerization**: Docker & Docker Compose

---

## Key Features

1. **Authentication & Role System (RBAC)**:
   - **Admin**: Full global access to manage projects, tasks, clients, users, view global activity feed, and live active users online presence.
   - **Project Manager (PM)**: Create & manage projects and tasks for projects created by them. Strict API-level isolation prevents PMs from accessing other PMs' data.
   - **Developer**: View assigned tasks only, update task status (To Do → In Progress → In Review → Done). Cannot view unassigned or other developers' tasks.
   - **JWT Auth**: Access tokens (15-min lifespan, held in memory) + Refresh tokens (7-day lifespan, stored in `HttpOnly` cookie).

2. **Real-Time Activity Feed & Presence**:
   - WebSockets powered by **Socket.io** with handshake JWT authentication.
   - Role-scoped feed subscriptions:
     - Admin joins `admin_global` room (all project activities).
     - PM joins `pm_{pmUserId}` room (only activities from projects created by them).
     - Developer joins `dev_{devUserId}` room (only activities on tasks assigned to them).
     - Board viewers join `project_{projectId}` for instant status updates.
   - **Offline Catch-Up**: Missed events (last 20 logs) fetched directly from PostgreSQL DB on reconnect.
   - **Presence Tracking**: Live online users count broadcasted to Admins.

3. **Background Job Scheduler**:
   - Automated task overdue scanner powered by `node-cron` running every minute.
   - Automatically flags tasks past their due date as `isOverdue = true`, records an `ActivityLog`, creates `Notification` entries, and emits WebSocket events.

4. **Notifications & Shareable Filters**:
   - Real-time notification badge & dropdown for task assignments and review requests.
   - Filter task lists by status, priority, due date range, and search text. State is synced to URL query parameters (`?status=IN_PROGRESS&priority=HIGH`) for easy URL sharing.

---

## Setup Instructions

### Option 1: Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd velozity
   ```
2. Launch containers:
   ```bash
   docker-compose up --build
   ```
3. Open your browser:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000/api](http://localhost:5000/api)

---

### Option 2: Manual Local Setup

#### Prerequisites
- Node.js >= 20.x
- PostgreSQL database running on `localhost:5432`

#### 1. Backend Setup
```bash
cd server
npm install
```
Configure `server/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/velozity_db?schema=public"
JWT_SECRET="super-secret-jwt-access-key-velozity-2026"
JWT_REFRESH_SECRET="super-secret-jwt-refresh-key-velozity-2026"
CORS_ORIGIN="http://localhost:5173"
```
Run Prisma migrations and seed script:
```bash
npx prisma db push
npm run seed
```
Start backend development server:
```bash
npm run dev
```

#### 2. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

### Option 3: Deploy the Frontend to Vercel

The frontend can run on Vercel, but the backend should run on a persistent Node.js host such as Render or Railway. The API uses Socket.IO and a long-running cron scheduler, which are not a good fit for Vercel's serverless functions. Use a managed PostgreSQL database for production; the local Docker database is not accessible to cloud deployments.

1. Push this repository to GitHub and import it into Vercel.
2. Set the Vercel project's **Root Directory** to `frontend`. Vercel detects Vite; use `npm run build` as the build command and `dist` as the output directory.
3. Add these Vercel environment variables for Production (and Preview if needed):
    - `VITE_API_URL`: your deployed backend URL ending in `/api`, for example `https://your-api.example.com/api`.
    - `VITE_SOCKET_URL`: the same backend origin without `/api`, for example `https://your-api.example.com`.
4. Deploy the backend separately with `backend` as its root directory. Use `npm run build` to build and `npm start` to start it. Set `DATABASE_URL` to your managed PostgreSQL connection string, generate strong unique `JWT_SECRET` and `JWT_REFRESH_SECRET` values, set `NODE_ENV=production`, and set `CORS_ORIGIN` to the exact Vercel site origin (for example `https://your-app.vercel.app`). Multiple allowed origins can be comma-separated.
5. Run the Prisma schema setup once against the production database with `npx prisma db push` from `backend`, then deploy/redeploy both services. Do not run the seed script on a production database unless you intend to create its demo accounts and sample data.

The backend uses secure cross-site refresh-token cookies in production. Browsers may restrict cookies when the frontend and API use unrelated domains; for the most reliable login persistence, use custom domains under the same parent domain for both services. After changing either Vite environment variable in Vercel, redeploy the frontend because these values are embedded at build time.

---

## Demo Credentials (Seed Data)

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@velozity.com` | `password123` | Full system access |
| **PM 1** | `pm1@velozity.com` | `password123` | PM for E-Commerce App & Cloud Migration |
| **PM 2** | `pm2@velozity.com` | `password123` | PM for AI Analytics Dashboard |
| **Dev 1** | `dev1@velozity.com` | `password123` | Assigned to Auth, Payments, Churn Model |
| **Dev 2** | `dev2@velozity.com` | `password123` | Assigned to Catalog, Telemetry Stream |

---

## Database Schema Diagram

```mermaid
erDiagram
    User ||--o{ Project : "creates (PM/Admin)"
    User ||--o{ Task : "assigned to (Dev)"
    User ||--o{ ActivityLog : "performs"
    User ||--o{ Notification : "receives"
    Client ||--o{ Project : "owns"
    Project ||--o{ Task : "contains"
    Project ||--o{ ActivityLog : "logs"
    Task ||--o{ ActivityLog : "logs"
    Task ||--o{ Notification : "triggers"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        enum role "ADMIN | PROJECT_MANAGER | DEVELOPER"
    }

    Client {
        string id PK
        string name
        string company
        string email UK
    }

    Project {
        string id PK
        string title
        string description
        string clientId FK
        string createdById FK
    }

    Task {
        string id PK
        string title
        string description
        string projectId FK
        string assignedToId FK
        enum status "TO_DO | IN_PROGRESS | IN_REVIEW | DONE"
        enum priority "LOW | MEDIUM | HIGH | CRITICAL"
        datetime dueDate
        boolean isOverdue
    }

    ActivityLog {
        string id PK
        string taskId FK
        string projectId FK
        string userId FK
        string action
        enum previousStatus
        enum newStatus
        string details
        datetime createdAt
    }

    Notification {
        string id PK
        string userId FK
        string title
        string message
        enum type "TASK_ASSIGNED | TASK_IN_REVIEW | TASK_OVERDUE"
        boolean isRead
        string taskId FK
        datetime createdAt
    }
```

---

## Architectural Decisions

### 1. WebSockets: Socket.io vs Native WebSocket
**Choice**: **Socket.io**  
**Justification**: Socket.io provides out-of-the-box support for named rooms (`admin_global`, `pm_{id}`, `dev_{id}`, `project_{id}`), automatic reconnection handling with heartbeat ping/pong, and middleware authentication hooks (`io.use()`). Native WebSockets would require custom implementation of room subscriptions, connection heartbeats, and re-authentication logic.

### 2. Job Queue / Scheduler: node-cron vs Bull Queue
**Choice**: **node-cron**  
**Justification**: For scheduled recurring time-based checks (flagging tasks overdue every minute), `node-cron` is lightweight, zero-dependency on external Redis stores, and fits cleanly within single or clustered Node application processes. Bull/BullMQ requires a running Redis cluster, which adds operational overhead for periodic database polling.

### 3. Token Storage Strategy: Access Token in Memory + HttpOnly Cookie Refresh
**Choice**: Short-lived JWT Access Token (15 mins) in memory / Auth Context state + Long-lived Refresh Token (7 days) in an `HttpOnly`, `SameSite=Lax` cookie.  
**Justification**: Storing access tokens in `localStorage` exposes them to XSS attacks. By keeping the short-lived access token in React memory and securing the refresh token in an `HttpOnly` cookie (inaccessible to JavaScript), we block token theft via malicious client-side scripts.

### 4. Database Indexing Decisions
- `User(role)`: Fast filtering during role lookup and dropdown population.
- `Project(createdById)`: Enables instant $O(\log N)$ query filtering for PM project isolation (`WHERE createdById = pmId`).
- `Task(assignedToId, status)`: Accelerates developer dashboard task retrieval and filter queries.
- `Task(dueDate, isOverdue)`: Optimizes the automated cron background job query (`WHERE dueDate < NOW() AND isOverdue = false`).
- `ActivityLog(projectId, createdAt)` & `ActivityLog(userId, createdAt)`: Supports fast pagination and ordering for the live activity feed.
- `Notification(userId, isRead)`: Rapid lookup for unread notification count badges.

---

## Known Limitations

1. **Horizontal Scaling for WebSockets**: Currently uses in-memory Socket.io server rooms. Scaling across multiple backend instances would require `@socket.io/redis-adapter`.
2. **Cron Single-Instance Execution**: In multi-replica deployments, a distributed lock (e.g. Redlock or Postgres Advisory Lock) would prevent duplicate overdue task processing across nodes.

---

## Technical Assessment Explanation (150–250 Words)

> **Hardest Problem Solved**:  
> The most challenging aspect was implementing a secure, real-time activity feed that enforces strict role-based data isolation without exposing unauthorized events to clients over WebSocket channels.
> 
> **How Real-Time Role-Filtered Feed Was Handled**:  
> To guarantee that developers only receive activity logs for their assigned tasks, PMs only see events for projects they created, and Admins monitor all global events, I implemented a Socket.io room subscription pattern combined with JWT handshake authentication. Upon connection, the socket server verifies the JWT token and subscribes the socket connection to role-specific rooms (`admin_global`, `pm_{pmId}`, or `dev_{devId}`). When a task status change occurs, the backend resolves the task's project owner and assigned developer, broadcasting the activity payload exclusively to those authorized rooms. For offline users returning to the app, an API endpoint queries the PostgreSQL database with the exact same role-scoped `WHERE` clauses, delivering the last 20 missed events.
> 
> **What I'd Do Differently**:  
> If scaling to millions of concurrent users, I would integrate Redis Pub/Sub with the Socket.io Redis adapter to decouple WebSocket server nodes and introduce BullMQ with Bull-board to handle asynchronous email/SMS notifications for overdue tasks.
"# -Real-Time-Client-Project-Dashboard-" 
"# Real-Time-Client-Project-Dashboard" 
"# -Real-Time-Client-Project-Dashboard" 
