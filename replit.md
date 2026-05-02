# TaskFlow — Full-Stack Task Management App

## Overview

A modern full-stack task management web application with authentication, task CRUD, dashboard analytics, filtering/search, and a polished responsive UI.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Recharts, Framer Motion
- **Auth**: Clerk (Replit-managed)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture

```
artifacts/
  api-server/          # Express 5 API server (port 8080, path /api)
  taskflow/            # React + Vite frontend (port 21998, path /)
lib/
  api-spec/            # OpenAPI spec (source of truth)
  api-client-react/    # Generated React Query hooks
  api-zod/             # Generated Zod validation schemas
  db/                  # Drizzle ORM schema + client
```

## Features

- User authentication via Clerk (register, login, logout)
- Task CRUD: create, view, edit, delete tasks
- Task fields: title, description, due date, priority, status, category, tags
- Filter tasks by status, priority, category, date range
- Search tasks by title
- Toggle task completion
- Dashboard with stats summary, priority/status charts, upcoming & overdue tasks
- Responsive design with dark theme

## API Endpoints

- `GET /api/tasks` — list tasks (with filters)
- `POST /api/tasks` — create task
- `GET /api/tasks/:id` — get task
- `PATCH /api/tasks/:id` — update task
- `DELETE /api/tasks/:id` — delete task
- `PATCH /api/tasks/:id/complete` — toggle completion
- `GET /api/tasks/upcoming` — tasks due in next 7 days
- `GET /api/tasks/overdue` — overdue tasks
- `GET /api/categories` — unique categories
- `GET /api/stats/summary` — dashboard summary stats
- `GET /api/stats/by-priority` — task counts by priority
- `GET /api/stats/by-status` — task counts by status

## Database Schema

**tasks** table: id, userId, title, description, dueDate, priority (enum), status (enum), category, tags (array), createdAt, updatedAt

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
