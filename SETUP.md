# GrantOps Setup Guide

## Sprint 0 Foundation - Status: IN PROGRESS ✅

### What's Been Built

#### ✅ Infrastructure
- [x] Monorepo structure with npm workspaces
- [x] Docker Compose for local Postgres + Redis
- [x] NestJS backend with modular architecture
- [x] Next.js 14 frontend with App Router
- [x] Database schema (all 24 tables)
- [x] Migration and seed system

#### ✅ Backend Core
- [x] Database service with Knex
- [x] JWT authentication with Google OAuth
- [x] RBAC (Role-Based Access Control)
- [x] Common utilities (guards, interceptors, filters, decorators)
- [x] Identity module (auth, users, roles)
- [x] Module stubs for all domains

#### ✅ Frontend Core
- [x] Next.js 14 with TypeScript
- [x] TailwindCSS configuration
- [x] API client with auth interceptors
- [x] Utility functions (date, currency, colors)
- [x] Landing page

### Installation Steps

#### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm install --workspaces
```

#### 2. Start Local Services

```bash
# Start Postgres + Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

#### 3. Configure Environment Variables

**Backend:**
```bash
cd apps/backend
cp .env.example .env.local
```

Edit `apps/backend/.env.local`:
- Set `JWT_SECRET` to a random string (run `openssl rand -base64 32`)
- Set `REFRESH_TOKEN_SECRET` to another random string
- Configure Google OAuth credentials (get from Google Cloud Console)
- Configure Resend API key (get from resend.com)

**Frontend:**
```bash
cd apps/frontend
cp .env.example .env.local
```

No changes needed for local development.

#### 4. Run Database Migrations

```bash
# From project root
npm run db:migrate
```

This creates all 24 tables in Postgres.

#### 5. Seed Initial Data

```bash
npm run db:seed
```

This creates:
- 1 organization (WebSlingerAI)
- 5 roles (Founder, Grant Writer, Clinician Liaison, Finance/Ops, Reviewer)
- 5 users (one for each role)
- 5 funding sources (NIH, NSF, ARPA-H, BARDA, Gates Foundation)
- 3 programs (R01, SBIR, NSF CAREER)
- 2 opportunities
- 2 projects
- 2 applications with tasks

#### 6. Start Development Servers

**Option A: Start both (recommended)**
```bash
npm run dev
```

**Option B: Start separately**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

#### 7. Verify Installation

- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api/v1
- Test auth: http://localhost:3001/api/v1/auth/me (will return 401 - expected)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized redirect URI: `http://localhost:3001/api/v1/auth/google/callback`
7. Copy Client ID and Client Secret to `apps/backend/.env.local`

### Resend Email Setup

1. Go to [resend.com](https://resend.com/)
2. Sign up / Log in
3. Create API key
4. Add to `apps/backend/.env.local` as `RESEND_API_KEY`
5. Verify domain (for production) or use test mode (for development)

### Testing the Setup

#### Test Database Connection
```bash
# From apps/backend
npm run dev

# You should see:
# ✅ Database connected successfully
# 🚀 GrantOps Backend running on: http://localhost:3001/api/v1
```

#### Test Seed Data
```bash
# Query users
docker exec -it grantops-postgres psql -U grantops -d grantops_dev -c "SELECT email, full_name FROM users;"

# Should show 5 users:
# founder@webslinger.ai, writer@webslinger.ai, etc.
```

### Next Steps (Sprint 1)

#### Week 2: Catalog Module
- [ ] Implement CRUD endpoints for FundingSources
- [ ] Implement CRUD endpoints for Programs
- [ ] Implement CRUD endpoints for Opportunities
- [ ] Build frontend list/detail views
- [ ] Add filters and search

See `ROADMAP.md` for full sprint plan.

### Troubleshooting

#### Database Connection Failed
```bash
# Check if Postgres is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

#### Port Already in Use
```bash
# Find process using port 3001 (backend)
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Migration Errors
```bash
# Rollback last migration
npm run db:migrate:rollback --workspace=backend

# Re-run migration
npm run db:migrate
```

### Architecture Overview

```
grantops/
├── apps/
│   ├── backend/              # NestJS API (port 3001)
│   │   ├── src/
│   │   │   ├── modules/      # Domain modules
│   │   │   │   ├── identity/ # Auth, users, roles ✅
│   │   │   │   ├── catalog/  # Funding sources, programs, opportunities
│   │   │   │   ├── pipeline/ # Applications, projects, stages
│   │   │   │   └── ...       # Other modules
│   │   │   ├── common/       # Guards, interceptors, decorators ✅
│   │   │   └── database/     # Knex, migrations, seeds ✅
│   │   └── package.json
│   └── frontend/             # Next.js 14 (port 3000)
│       ├── src/
│       │   ├── app/          # App Router pages
│       │   ├── components/   # React components
│       │   └── lib/          # API client, utilities ✅
│       └── package.json
├── docker-compose.yml        # Local Postgres + Redis ✅
└── package.json              # Root workspace config ✅
```

### Team Credentials (Seed Data)

| Email | Role | Password |
|-------|------|----------|
| founder@webslinger.ai | Founder/BD | Use Google OAuth |
| writer@webslinger.ai | Grant Writer | Use Google OAuth |
| clinician@webslinger.ai | Clinician Liaison | Use Google OAuth |
| finance@webslinger.ai | Finance/Ops | Use Google OAuth |
| reviewer@webslinger.ai | Reviewer | Use Google OAuth |

Note: All authentication goes through Google OAuth. Set your Google Cloud project to allow these email addresses (or set domain to `webslinger.ai` in OAuth consent screen).

### Database Schema Stats

- **Tables:** 24
- **Foreign Keys:** 28
- **Indexes:** 37
- **Triggers:** 0 (using application-level audit logging)

### Performance Targets (Sprint 0)

- [x] Database connection < 1s
- [x] Page load < 2s (landing page)
- [ ] API response < 500ms (to be tested in Sprint 1)
- [ ] Dashboard load < 3s (to be built in Sprint 6)

### Security Checklist

- [x] JWT secret is environment variable
- [x] Database credentials in environment variables
- [x] API keys in environment variables
- [x] CORS configured for frontend origin
- [x] Password hashing (N/A - using OAuth)
- [x] SQL injection protection (parameterized queries via Knex)
- [ ] Rate limiting (to be added in Sprint 1)
- [ ] Input validation (to be added per module)

### Support

For issues or questions:
1. Check this document
2. Review `README.md`
3. Check `ROADMAP.md` for sprint details
4. Review blueprint document for architecture details
