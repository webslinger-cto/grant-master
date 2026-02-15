# GrantOps Development Roadmap

## Overall Timeline: 6-8 Weeks to MVP

---

## ✅ Sprint 0: Foundation (Week 1) - **IN PROGRESS**

### Goals
- Infrastructure setup
- Authentication working
- Database schema deployed

### Backend Deliverables
- [x] Project structure (monorepo with npm workspaces)
- [x] NestJS setup with all modules scaffolded
- [x] Database service (Knex + Postgres)
- [x] Full schema migration (24 tables)
- [x] Seed data script
- [x] Identity module (Google OAuth + JWT)
- [x] RBAC guards and decorators
- [x] Common utilities (filters, interceptors)

### Frontend Deliverables
- [x] Next.js 14 with App Router
- [x] TailwindCSS + shadcn/ui foundation
- [x] API client with auth
- [x] Landing page
- [ ] Auth callback handler
- [ ] Protected route wrapper

### Infrastructure
- [x] Docker Compose (Postgres + Redis)
- [x] Environment variables setup
- [x] Database migration system
- [x] Seed data

### Testing & Verification
- [ ] User can start local environment
- [ ] Database migrations run successfully
- [ ] Seed data loads
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors

### Sprint 0 Remaining Work (1-2 days)
1. **Auth Flow** (4 hours)
   - Auth callback handler
   - Protected route HOC
   - User context provider

2. **Basic UI Components** (4 hours)
   - Button, Card, Input (shadcn/ui)
   - Navigation layout
   - Dashboard shell

3. **Testing** (2 hours)
   - End-to-end auth test
   - Database query test
   - API health check

---

## 📋 Sprint 1: Catalog + Opportunities (Week 2)

### Goals
- Track funding opportunities
- Browse catalog of programs and sources

### Backend
- [ ] FundingSources controller + service
- [ ] Programs controller + service
- [ ] Opportunities controller + service
- [ ] CRUD endpoints for all three
- [ ] Filters (type, status, deadline)
- [ ] Search by title/description

### Frontend
- [ ] Opportunities list page (table view)
- [ ] Opportunity detail page
- [ ] Create/Edit opportunity form
- [ ] Programs list page
- [ ] Funding sources list page
- [ ] Sidebar navigation

### API Endpoints
```
GET    /funding-sources
POST   /funding-sources
GET    /funding-sources/:id
PUT    /funding-sources/:id
DELETE /funding-sources/:id

GET    /programs
POST   /programs
GET    /programs/:id
PUT    /programs/:id
DELETE /programs/:id

GET    /opportunities
POST   /opportunities
GET    /opportunities/:id
PUT    /opportunities/:id
DELETE /opportunities/:id
```

### Testing
- [ ] CRUD operations work for all entities
- [ ] Filters work correctly
- [ ] Search returns relevant results
- [ ] Forms validate input

---

## 📊 Sprint 2: Projects + Applications (Week 3)

### Goals
- Create applications
- Track pipeline stages

### Backend
- [ ] Projects controller + service
- [ ] Applications controller + service
- [ ] StageHistory tracking
- [ ] Stage transition endpoint with validation
- [ ] Event emitter for ApplicationStageChanged

### Frontend
- [ ] Projects list + create/edit
- [ ] Applications list (table view)
- [ ] Application detail page
- [ ] **Kanban board** (6 stages)
- [ ] Drag-drop stage transitions
- [ ] Stage history timeline

### API Endpoints
```
GET    /projects
POST   /projects
GET    /projects/:id
PUT    /projects/:id

GET    /applications
POST   /applications
GET    /applications/:id
PUT    /applications/:id
POST   /applications/:id/transition-stage
GET    /applications/:id/stage-history
```

### Testing
- [ ] Applications can be created
- [ ] Stage transitions work
- [ ] Stage history is recorded
- [ ] Drag-drop works in Kanban
- [ ] Cannot skip stages

---

## ✅ Sprint 3: Tasks + Dependencies (Week 4)

### Goals
- Task management
- Dependency tracking

### Backend
- [ ] Tasks controller + service
- [ ] TaskDependencies management
- [ ] Circular dependency validation
- [ ] Task filtering (by app, user, status)
- [ ] Bulk task creation

### Frontend
- [ ] Task list view (filterable)
- [ ] Task detail/edit modal
- [ ] Task board (Kanban by status)
- [ ] Dependency visualization
- [ ] Bulk task creation form

### API Endpoints
```
GET    /tasks
POST   /tasks
GET    /tasks/:id
PUT    /tasks/:id
DELETE /tasks/:id
POST   /tasks/:id/dependencies
DELETE /tasks/:id/dependencies/:depId
```

### Testing
- [ ] Tasks can be created and assigned
- [ ] Dependencies work correctly
- [ ] Circular dependencies are prevented
- [ ] Task status updates trigger notifications

---

## 💰 Sprint 4: Budgets + Documents (Week 5)

### Goals
- Budget versioning
- Document checklist tracking

### Backend
- [ ] Budgets controller + service
- [ ] BudgetVersions management
- [ ] DocumentChecklistItems controller + service
- [ ] Link validation (optional)

### Frontend
- [ ] Budget detail page
- [ ] Budget editor (line items table)
- [ ] Version history view
- [ ] Document checklist on application
- [ ] Add/edit checklist items

### API Endpoints
```
GET    /budgets
POST   /budgets
GET    /budgets/:id
POST   /budgets/:id/versions

GET    /applications/:id/documents
POST   /applications/:id/documents
PUT    /documents/:id
```

### Testing
- [ ] Budget versions are created correctly
- [ ] Line items calculate totals
- [ ] Document checklist tracks status
- [ ] Links can be added and updated

---

## 📬 Sprint 5: Reviews + Notifications (Week 6)

### Goals
- Internal review workflow
- Email notifications

### Backend
- [ ] Reviews controller + service
- [ ] Notifications service
- [ ] BullMQ setup (NotificationQueue)
- [ ] Resend integration
- [ ] DeadlineCheckerQueue (cron)
- [ ] Event listeners (stage changed, task assigned)

### Frontend
- [ ] Review assignment UI
- [ ] Review form (decision, comments, score)
- [ ] Notification center (bell icon)
- [ ] Notification list
- [ ] Notification preferences

### API Endpoints
```
GET    /reviews
POST   /reviews
GET    /reviews/:id
PUT    /reviews/:id
POST   /reviews/:id/complete

GET    /notifications
PUT    /notifications/:id/mark-read
PUT    /users/me/notification-preferences
```

### Testing
- [ ] Reviewer can be assigned
- [ ] Review form submits correctly
- [ ] Email notifications are sent
- [ ] Notifications appear in UI
- [ ] Deadline checker runs on schedule

---

## 📈 Sprint 6: Forecasting + Reporting (Week 7)

### Goals
- Dashboard with insights
- Forecasting engine

### Backend
- [ ] Forecasting service
- [ ] Pipeline forecast endpoint
- [ ] Submission forecast endpoint
- [ ] Capacity forecast endpoint
- [ ] Event listener for stage changes (recalc)

### Frontend
- [ ] Dashboard page with cards:
  - Weighted pipeline value
  - Applications by stage (bar chart)
  - Upcoming deadlines (calendar widget)
  - Task burndown (line chart)
- [ ] Forecast reports page
- [ ] Charts (recharts or Chart.js)

### API Endpoints
```
GET    /forecasts/pipeline
GET    /forecasts/submissions
GET    /forecasts/capacity
```

### Testing
- [ ] Dashboard loads < 3s
- [ ] Forecasts calculate correctly
- [ ] Charts render properly
- [ ] Weighted pipeline updates on stage change

---

## 🏆 Sprint 7: Awards + Post-Award (Week 8)

### Goals
- Track awarded grants
- Reporting deadlines

### Backend
- [ ] Awards controller + service
- [ ] ReportingDeadlines controller + service
- [ ] Deliverables controller + service
- [ ] Reporting deadline notifications

### Frontend
- [ ] Awards list + detail page
- [ ] Reporting deadlines tracker (table + calendar)
- [ ] Deliverables tracker

### API Endpoints
```
POST   /awards
GET    /awards/:id
PUT    /awards/:id
POST   /awards/:id/reporting-deadlines
POST   /awards/:id/deliverables
```

### Testing
- [ ] Award can be created from application
- [ ] Reporting deadlines tracked
- [ ] Notifications sent for upcoming deadlines
- [ ] Deliverables can be marked complete

---

## 🎨 Sprint 8: Polish + UAT (Week 8+)

### Goals
- Production-ready
- User acceptance testing

### Tasks
- [ ] End-to-end testing (Playwright/Cypress)
- [ ] Performance optimization
  - [ ] Database query optimization
  - [ ] Frontend bundle size optimization
  - [ ] Image optimization
- [ ] UI polish
  - [ ] Loading states
  - [ ] Error handling
  - [ ] Empty states
  - [ ] Responsive design
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Production deployment
- [ ] Monitoring setup (Sentry, Datadog)
- [ ] User documentation
- [ ] Training session

### Deployment Checklist
- [ ] Environment variables configured (production)
- [ ] Database backed up
- [ ] SSL/TLS certificates
- [ ] Monitoring alerts configured
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Datadog)
- [ ] Uptime monitoring
- [ ] Backup strategy
- [ ] Rollback plan

---

## V1 Features (3-4 Months Post-MVP)

### Task Templates (2 weeks)
- Pre-built templates for NIH, NSF, foundation grants
- Template editor UI
- Application creation from template

### Backplanning (2 weeks)
- Algorithm to work backwards from submission date
- Respect task dependencies
- Suggest due dates

### Scorecard Templates (1 week)
- Define review criteria with weights
- Scorecard UI in review form

### Slack Integration (1 week)
- OAuth setup
- Notification delivery to Slack
- User preference for Slack vs email

### Advanced Filters + Saved Views (2 weeks)
- Filter builder UI
- Save filters as named views
- Share views with team

### Budget Template Library (1 week)
- Pre-defined budget templates
- Apply template when creating budget

### Partner/Contact Management (2 weeks)
- CRUD for partners
- Link partners to applications
- Track partner roles

### Calendar Integration (1 week)
- Generate .ics files
- Google Calendar API integration

### Export to Excel/CSV (1 week)
- Export pipeline, tasks, budgets

---

## V2 Features (6-9 Months Post-MVP)

### External Physician Portal (4 weeks)
- Separate subdomain
- Invite-only access
- View assigned tasks
- Upload documents to shared folders

### AI Assistant (8 weeks)
- Opportunity matching (embedding-based search)
- Draft content suggestions (GPT-4)
- Compliance checks
- Separate Python service (FastAPI)

### Grants Database Integration (3 weeks)
- NIH Reporter API
- Grants.gov API
- Background sync job

### Advanced Analytics (3 weeks)
- Win rate by funding source
- Time-to-submit metrics
- Cost per application
- Dashboard with charts

### Multi-Organization Support (4 weeks)
- Tenant isolation
- Organization switcher
- White-label branding

---

## Key Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Sprint 0 Complete | Week 1 | 🟡 In Progress |
| Sprint 1 Complete | Week 2 | ⚪ Not Started |
| Sprint 2 Complete | Week 3 | ⚪ Not Started |
| Sprint 3 Complete | Week 4 | ⚪ Not Started |
| Sprint 4 Complete | Week 5 | ⚪ Not Started |
| Sprint 5 Complete | Week 6 | ⚪ Not Started |
| Sprint 6 Complete | Week 7 | ⚪ Not Started |
| Sprint 7 Complete | Week 8 | ⚪ Not Started |
| **MVP Launch** | **Week 8** | ⚪ Not Started |
| V1 Launch | 3-4 months | ⚪ Not Started |
| V2 Launch | 6-9 months | ⚪ Not Started |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data model creep | High | Medium | Freeze schema after Sprint 1; use JSONB for flexible metadata |
| Permissions complexity | Medium | Medium | Start with 5 roles + coarse permissions; iterate in V1 |
| Notification reliability | Medium | High | Use queue with retry; log all notifications; monitor delivery rates |
| Link integrity | High | Low | Not critical for MVP; validate links in V1 with background job |
| Forecasting accuracy | High | Medium | Provide default probabilities; allow manual override; refine with data |
| Deadline management | Low | High | Multiple notification triggers; calendar integration in V1 |
| Team capacity | Medium | High | MVP scope is tight; defer nice-to-haves to V1 |

---

## Success Metrics

### MVP (Week 8)
- [ ] All 5 personas can perform core workflows
- [ ] 100% of seed data visible in UI
- [ ] Application can move through all stages
- [ ] Tasks can be created, assigned, completed
- [ ] Budgets can be versioned
- [ ] Email notifications work
- [ ] Weighted pipeline forecast calculates correctly
- [ ] Zero P0/P1 bugs in production
- [ ] Dashboard loads < 3s

### V1 (3 months post-MVP)
- [ ] 80% of applications created from templates
- [ ] Backplanning used for 50% of applications
- [ ] Slack integration active
- [ ] Forecast accuracy within 20%

### Business KPIs (6-12 months)
- [ ] 50+ active applications in pipeline
- [ ] 2-3 applications submitted per month
- [ ] 15-20% win rate
- [ ] Forecast accuracy within 25%
- [ ] 30% time savings vs spreadsheets
