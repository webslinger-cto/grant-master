# GrantOps

Internal grant management platform for WebSlingerAI to manage funding pipeline across federal, state, and private foundation sources.

## Architecture

- **Frontend**: Next.js 14 (App Router) + React 18 + TailwindCSS + shadcn/ui
- **Backend**: NestJS + Express + TypeScript
- **Database**: PostgreSQL
- **Queue**: Redis + BullMQ
- **Auth**: Google OAuth + JWT
- **Email**: Resend
- **Deployment**: Backend on AWS ECS, Frontend on Netlify

## Project Structure

```
grantops/
├── apps/
│   ├── backend/          # NestJS API server
│   └── frontend/         # Next.js web app
├── packages/
│   └── types/            # Shared TypeScript types
└── docker/               # Docker configs for local dev
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm 9+

### Setup

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp apps/backend/.env.example apps/backend/.env.local

   # Frontend
   cp apps/frontend/.env.example apps/frontend/.env.local
   ```

3. **Start local services (Docker)**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - API Docs: http://localhost:3001/api

## Development

### Run backend only
```bash
npm run dev:backend
```

### Run frontend only
```bash
npm run dev:frontend
```

### Run tests
```bash
npm test
```

### Database migrations
```bash
# Create new migration
npm run db:migrate:create --workspace=backend -- <migration-name>

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback
```

## Sprint Progress

- [x] Sprint 0: Foundation (Week 1) - In Progress
- [ ] Sprint 1: Catalog + Opportunities (Week 2)
- [ ] Sprint 2: Projects + Applications (Week 3)
- [ ] Sprint 3: Tasks + Dependencies (Week 4)
- [ ] Sprint 4: Budgets + Documents (Week 5)
- [ ] Sprint 5: Reviews + Notifications (Week 6)
- [ ] Sprint 6: Forecasting + Reporting (Week 7)
- [ ] Sprint 7: Awards + Post-Award (Week 8)
- [ ] Sprint 8: Polish + UAT (Week 8+)

## Team

WebSlingerAI Internal Development Team

## License

Proprietary - Internal Use Only
