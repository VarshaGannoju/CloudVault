# CloudVault ☁️

CloudVault is a secure, full-stack cloud storage and file-sharing platform, inspired by Google Drive and Dropbox. Built with a React (Vite) frontend and a Node.js/Express + PostgreSQL backend, following an MVC-style, enterprise-oriented architecture.

> **Status:** 🚧 Step 1 complete — project scaffolding, tooling, and infrastructure are in place. Features (auth, file management, sharing, etc.) are being built incrementally in subsequent steps.

---

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Folder structure](#folder-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running with Docker](#running-with-docker)
- [Database](#database)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Roadmap](#roadmap)

---

## Architecture

```
┌────────────────┐        HTTPS/JSON        ┌─────────────────┐        SQL        ┌──────────────┐
│  React (Vite)  │  <-------------------->   │  Express API    │ <--------------> │  PostgreSQL   │
│  frontend      │                            │  (MVC layered)  │                   │              │
└────────────────┘                            └─────────────────┘                   └──────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   Cloudinary     │
                                                │ (file storage)   │
                                                └─────────────────┘
```

The backend follows a layered MVC structure:

- **routes** → define endpoints, delegate to controllers
- **controllers** → parse requests, call services, shape responses
- **services** → business logic, orchestrates models/external APIs
- **models** → data access (SQL queries against PostgreSQL)
- **middlewares** → auth guards, error handling, rate limiting
- **validators** → request payload validation (`express-validator`)
- **config** → environment, database, and Cloudinary configuration
- **utils** → shared helpers (`ApiError`, `asyncHandler`, etc.)

The frontend mirrors this separation of concerns:

- **pages** → route-level views
- **components** → reusable, presentational UI pieces
- **layouts** → shared page shells (navbar, sidebar, etc.)
- **context** → global state (auth, theme)
- **hooks** → reusable stateful logic
- **services** → API client(s)
- **utils** → formatting/helper functions

## Tech stack

| Layer          | Technology                                                         |
| -------------- | -------------------------------------------------------------------|
| Frontend       | React (Vite), React Router DOM, Axios, Bootstrap 5, React Icons    |
| Backend        | Node.js, Express.js                                                 |
| Database       | PostgreSQL                                                          |
| Auth           | JWT (access + refresh tokens), bcrypt (bcryptjs)                    |
| Storage        | Cloudinary                                                           |
| Validation     | express-validator                                                    |
| Security       | Helmet, CORS, rate limiting, secure cookies                         |
| Testing        | Jest, Supertest                                                      |
| Containers     | Docker, Docker Compose                                               |
| CI/CD          | GitHub Actions                                                       |

## Folder structure

```
CloudVault/
├── backend/
│   ├── src/
│   │   ├── config/         # env, db, cloudinary config
│   │   ├── controllers/    # request handlers
│   │   ├── routes/         # Express routers
│   │   ├── middlewares/    # error handling, auth, etc.
│   │   ├── models/         # data access layer
│   │   ├── services/       # business logic
│   │   ├── utils/          # ApiError, asyncHandler, ...
│   │   ├── validators/     # express-validator schemas
│   │   ├── database/       # SQL migrations + migration runner
│   │   └── app.js          # Express app assembly
│   ├── tests/               # Jest + Supertest tests
│   ├── server.js            # entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/        # axios API client
│   │   ├── context/         # Auth & Theme context
│   │   ├── layouts/
│   │   └── utils/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── .github/workflows/ci.yml
├── docker-compose.yml
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker Compose, see below)
- A free [Cloudinary](https://cloudinary.com) account (for file storage, added in a later step)

### Backend

```bash
cd backend
cp .env.example .env   # fill in real values
npm install
npm run db:migrate     # applies SQL migrations
npm run dev             # starts the API with nodemon on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev             # starts Vite dev server on http://localhost:5173
```

## Environment variables

See [`backend/.env.example`](./backend/.env.example) and [`frontend/.env.example`](./frontend/.env.example) for the full list of variables. Key ones:

| Variable                | Description                                  |
| ------------------------| ----------------------------------------------|
| `DATABASE_URL`           | PostgreSQL connection string                  |
| `JWT_ACCESS_SECRET`      | Secret for signing short-lived access tokens  |
| `JWT_REFRESH_SECRET`     | Secret for signing long-lived refresh tokens  |
| `FILE_ENCRYPTION_KEY`    | 32-byte hex key for AES-256 file encryption   |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary account cloud name                 |
| `CLOUDINARY_API_KEY`     | Cloudinary API key                            |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret                         |
| `VITE_API_BASE_URL`      | (frontend) Base URL of the backend API        |

Generate strong secrets locally with:

```bash
openssl rand -hex 32
```

## Running with Docker

```bash
cp .env.example .env          # root-level compose variables
cp backend/.env.example backend/.env   # fill in real secrets
docker compose up --build
```

This starts three containers:

- `postgres` — PostgreSQL 16 with a persistent volume
- `backend` — Express API on `:5000`
- `frontend` — the production Vite build served by Nginx on `:5173`

## Database

Schema migrations live in [`backend/src/database/migrations`](./backend/src/database/migrations) and are applied with:

```bash
npm run db:migrate
```

Core tables: `users`, `folders`, `files`, `file_versions`, `shared_files`, `activity_logs`, `password_reset_tokens`, `email_verification_tokens`.

## Testing

```bash
cd backend
npm test          # Jest + Supertest
```

```bash
cd frontend
npm run lint       # ESLint
npm run build      # production build sanity check
```

## CI/CD

GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) runs on every push/PR to `main`/`develop`:

1. Spins up a PostgreSQL service container
2. Installs backend dependencies, lints, and runs Jest tests
3. Installs frontend dependencies, lints, and builds the production bundle

## Roadmap

- [x] Project scaffolding, tooling, Docker, CI/CD
- [ ] Authentication (register, login, JWT refresh, email verification, password reset)
- [ ] User profile & role-based access control
- [ ] Folder management (nested folders, breadcrumbs)
- [ ] File management (upload, download, preview, star, trash/restore)
- [ ] AES file encryption at rest
- [ ] File versioning
- [ ] File sharing (public links, permissions, expiry)
- [ ] Search
- [ ] Dashboard analytics & charts
- [ ] Admin panel
- [ ] Dark mode & polished UI

---

*Screenshots, a full API reference, and a deployment guide will be added as those pieces are built out.*
