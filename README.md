# TaskFlow — Team Task Manager

A full-stack project management app where teams can create
projects, assign tasks, and track progress. Built with
role-based access so Admins and Members actually have different
permissions — enforced at the API level, not just hidden in the UI.

## Stack

- **Frontend** — React 18, Vite, Tailwind CSS, React Query, Recharts
- **Backend** — Node.js, Express, Prisma ORM
- **Database** — PostgreSQL
- **Auth** — JWT + bcrypt
- **Deployed on** — Railway

## Features

- Signup / login with JWT auth — token persists on refresh
- Create projects — creator becomes Admin automatically
- Admin can add/remove members, create/edit/delete tasks
- Members can update the status of tasks assigned to them only
- Dashboard with task counts, status breakdown, tasks per user
  chart, and overdue detection
- Role checks happen at the API layer — a Member hitting a
  protected endpoint directly gets a 403, not just a hidden button

## Local Setup

**Prerequisites:** Node.js 18+, PostgreSQL 14+

```bash
git clone https://github.com/Tilakwagadre/team-task-manager.git
cd team-task-manager
npm run install:all
```

Set up environment variables:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT_SECRET, PORT

cp frontend/.env.example frontend/.env
# Set VITE_API_URL to match your backend port
```

Run migrations and start:

```bash
cd backend && npx prisma migrate dev --name init
cd .. && npm run dev
```

Frontend → http://localhost:5173  
Backend → http://localhost:5001

## API Overview

All routes except `/api/auth/*` require `Authorization: Bearer <token>`.

| Method | Route | Access |
|--------|-------|--------|
| POST | /api/auth/signup | Public |
| POST | /api/auth/login | Public |
| GET | /api/projects | Auth |
| POST | /api/projects | Auth |
| GET | /api/projects/:id | Member+ |
| PUT | /api/projects/:id | Admin only |
| DELETE | /api/projects/:id | Admin only |
| POST | /api/projects/:id/members | Admin only |
| DELETE | /api/projects/:id/members/:userId | Admin only |
| GET | /api/projects/:id/tasks | Member+ |
| POST | /api/projects/:id/tasks | Admin only |
| PUT | /api/tasks/:taskId | Admin (all fields) / Member (status of own tasks) |
| DELETE | /api/tasks/:taskId | Admin only |
| GET | /api/projects/:id/dashboard | Member+ |

## Deployment (Railway)

1. Push repo to GitHub
2. New Railway project → connect repo
3. Add PostgreSQL addon → DATABASE_URL is injected automatically
4. Backend service: root `/backend`, build `npm install && npx prisma migrate deploy`, start `npm start`
5. Frontend service: root `/frontend`, build `npm install && npm run build`, start `npx serve dist -p $PORT`
6. Set env vars: `JWT_SECRET`, `CORS_ORIGIN` (your Railway frontend URL), `NODE_ENV=production`
7. Set `VITE_API_URL` to your Railway backend URL before building frontend
8. Generate domains for both services from Railway dashboard

---
