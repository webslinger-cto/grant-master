# GrantOps Quick Start

Get up and running in 10 minutes.

## Prerequisites

- Node.js 18+
- Docker Desktop
- Google Cloud account (for OAuth)
- Resend account (for emails)

## 1. Install (2 min)

```bash
# Install all dependencies
npm install
npm install --workspaces
```

## 2. Start Services (1 min)

```bash
# Start Postgres + Redis
docker-compose up -d

# Verify
docker-compose ps
# Should show both containers as "Up"
```

## 3. Configure (3 min)

**Backend:**
```bash
cd apps/backend
cp .env.example .env.local
```

Edit `apps/backend/.env.local`:
```bash
# Generate secrets
JWT_SECRET=<run: openssl rand -base64 32>
REFRESH_TOKEN_SECRET=<run: openssl rand -base64 32>

# Google OAuth (get from console.cloud.google.com)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Resend (get from resend.com)
RESEND_API_KEY=your-resend-api-key
```

**Frontend:**
```bash
cd ../frontend
cp .env.example .env.local
# No changes needed for local dev
```

## 4. Database Setup (2 min)

```bash
# From project root
npm run db:migrate    # Creates 24 tables
npm run db:seed       # Loads sample data
```

## 5. Start Dev Servers (1 min)

```bash
# From project root
npm run dev
```

This starts both backend and frontend.

## 6. Verify (1 min)

**Frontend:** http://localhost:3000
Should show "GrantOps" landing page

**Backend:** http://localhost:3001/api/v1
Should show "Cannot GET /api/v1" (expected - no root route)

**Test Auth:** http://localhost:3001/api/v1/auth/me
Should return 401 Unauthorized (expected - no token)

## 🎉 Done!

You now have:
- ✅ Postgres database with full schema
- ✅ Redis for queues
- ✅ Backend API server (NestJS)
- ✅ Frontend web app (Next.js)
- ✅ Sample data (5 users, 2 applications, 4 tasks)

## Next Steps

1. **Complete Sprint 0:** See `SETUP.md` → "Sprint 0 Remaining Work"
2. **Start Sprint 1:** See `ROADMAP.md` → "Sprint 1: Catalog + Opportunities"
3. **Review Architecture:** See blueprint document

## Troubleshooting

**"Cannot connect to database"**
```bash
docker-compose restart postgres
docker-compose logs postgres
```

**"Port 3001 already in use"**
```bash
lsof -i :3001
kill -9 <PID>
```

**"Migration failed"**
```bash
# Rollback and retry
npm run db:migrate:rollback --workspace=backend
npm run db:migrate
```

## Test Credentials

After completing Google OAuth setup, use these emails:
- `founder@webslinger.ai` (Full access)
- `writer@webslinger.ai` (Grant Writer)
- `clinician@webslinger.ai` (Clinician Liaison)
- `finance@webslinger.ai` (Finance/Ops)
- `reviewer@webslinger.ai` (Reviewer)

All authentication goes through Google OAuth.

## Useful Commands

```bash
# Restart everything
docker-compose restart && npm run dev

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend

# Run migration
npm run db:migrate

# Rollback migration
npm run db:migrate:rollback --workspace=backend

# Create new migration
npm run db:migrate:create --workspace=backend -- my_migration_name

# Reset database (⚠️ destroys data)
docker-compose down -v
docker-compose up -d
npm run db:migrate
npm run db:seed
```

## Project Structure

```
grant_master/
├── apps/
│   ├── backend/     # NestJS API (port 3001)
│   └── frontend/    # Next.js (port 3000)
├── docker-compose.yml
├── README.md        # Overview
├── SETUP.md         # Detailed setup
├── ROADMAP.md       # Sprint plan
├── STATUS.md        # Implementation status
└── QUICK_START.md   # This file
```

## Support

- **Setup Issues:** See `SETUP.md`
- **Development Questions:** See `ROADMAP.md`
- **Architecture Questions:** See blueprint document
