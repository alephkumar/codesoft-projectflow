# ⚡ ProjectFlow — Full-Stack Project Management App

A production-ready project management SaaS application with role-based access control, real-time dashboards, Kanban boards, and team collaboration features.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Chart.js, React Hot Toast |
| Backend | Node.js, Express.js, JWT Auth |
| Database | MongoDB (Mongoose) |
| Security | Helmet, bcryptjs, Rate Limiting, CORS |

---

## 📁 Project Structure

```
projectflow/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, validation, file upload
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── utils/          # Token, activity log, notifications
│   ├── tests/          # Jest + Supertest tests
│   ├── uploads/        # File storage (gitignored)
│   ├── server.js       # Entry point
│   └── .env.example    # Environment template
└── frontend/
    ├── public/
    └── src/
        ├── components/ # Sidebar, Header, Modal, Badge, Skeletons
        ├── context/    # AuthContext, ThemeContext
        ├── hooks/      # useToast
        ├── pages/      # All page components
        ├── services/   # Axios API layer
        └── utils/      # Date helpers, formatters
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone and setup environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

---

## 🔐 Roles & Permissions

| Action | Admin | Project Manager | Team Member |
|--------|-------|----------------|-------------|
| Manage all projects | ✅ | Own projects | ❌ |
| Create projects | ✅ | ✅ | ❌ |
| Create tasks | ✅ | ✅ | ❌ |
| Update assigned tasks | ✅ | ✅ | ✅ |
| Delete tasks | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View dashboard | ✅ | ✅ | ✅ |

---

## 🌐 API Reference

### Authentication
```
POST   /api/auth/register       Register new user
POST   /api/auth/login          Login
GET    /api/auth/profile        Get current user
PUT    /api/auth/profile        Update profile
POST   /api/auth/refresh-token  Refresh JWT
POST   /api/auth/logout         Logout
PUT    /api/auth/change-password Change password
```

### Projects
```
GET    /api/projects            List projects (with filters)
POST   /api/projects            Create project
GET    /api/projects/:id        Get project
PUT    /api/projects/:id        Update project
DELETE /api/projects/:id        Delete project
PATCH  /api/projects/:id/archive Archive project
POST   /api/projects/:id/members Add member
DELETE /api/projects/:id/members/:userId Remove member
```

### Tasks
```
GET    /api/tasks               List tasks (with filters)
POST   /api/tasks               Create task
GET    /api/tasks/:id           Get task
PUT    /api/tasks/:id           Update task
DELETE /api/tasks/:id           Delete task
POST   /api/tasks/:id/attachments Upload file
GET    /api/tasks/:id/activity  Activity log
```

### Comments
```
GET    /api/comments/:taskId    Get task comments
POST   /api/comments            Add comment
PUT    /api/comments/:id        Edit comment
DELETE /api/comments/:id        Delete comment
```

### Dashboard
```
GET    /api/dashboard/stats     Aggregated stats + charts
```

### Users
```
GET    /api/users               List all users
GET    /api/users/:id           Get user
PUT    /api/users/:id           Update user (admin)
DELETE /api/users/:id           Deactivate user (admin)
```

### Notifications
```
GET    /api/notifications       Get user notifications
PUT    /api/notifications/:id/read Mark as read
PUT    /api/notifications/read-all  Mark all as read
DELETE /api/notifications/:id   Delete notification
```

---

## 📊 Database Schemas

### User
```json
{ "name": "string", "email": "string", "password": "hashed", "role": "admin|project_manager|team_member", "avatar": "string", "isActive": "boolean", "lastLogin": "date" }
```

### Project
```json
{ "name": "string", "description": "string", "status": "planning|active|on_hold|completed|archived", "priority": "low|medium|high|critical", "startDate": "date", "endDate": "date", "createdBy": "userId", "members": "[userId]", "isArchived": "boolean" }
```

### Task
```json
{ "title": "string", "description": "string", "projectId": "objectId", "assignedTo": "userId", "status": "todo|in_progress|review|completed", "priority": "low|medium|high|critical", "dueDate": "date", "estimatedHours": "number", "actualHours": "number", "attachments": "[]" }
```

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover: Register, Login, Token validation, Auth guards.

---

## ☁️ Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy /build folder to Vercel
# Set REACT_APP_API_URL=https://your-api.render.com
```

### Backend → Render / Railway

```bash
# Set environment variables in dashboard:
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
CLIENT_URL=https://your-frontend.vercel.app
```

### Database → MongoDB Atlas

1. Create cluster at mongodb.com/atlas
2. Create DB user
3. Whitelist IPs (or use 0.0.0.0/0)
4. Copy connection string to MONGO_URI

### CI/CD (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd frontend && npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

---

## 🔒 Security Features

- JWT access tokens (7d) + refresh tokens (30d)
- bcrypt password hashing (12 rounds)
- Helmet.js security headers
- Rate limiting (100 req/15min general, 20 req/15min auth)
- CORS restricted to client URL
- Input validation via express-validator
- Role-based route guards
- File upload type/size restrictions

---

## ✨ Features Overview

- 🔐 **Authentication**: Register, login, JWT refresh, role-based access
- 📁 **Projects**: CRUD, archive, member management, progress tracking
- ✅ **Tasks**: Kanban board, list view, file attachments, activity log
- 📊 **Dashboard**: Stats cards, trend charts, project progress bars
- 👥 **Team**: Member profiles, role management, task counts
- 🔔 **Notifications**: Real-time alerts, mark read, clear all
- 🔍 **Search**: Global search across projects and tasks
- 👤 **Profile**: Edit name, change password
- ⚙️ **Settings**: Notification prefs, workspace info (admin/PM)

---

## 📜 License

MIT — free to use for personal and commercial projects.
