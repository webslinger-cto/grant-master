# Phase 2 Implementation Plan: AI-Powered Grant Assistant
## Goal: Function as PI's Lead PhD Candidate/TA

---

## Feature Breakdown & Cost Analysis

### 1. Automatic Grant Discovery
**Description:** Daily/weekly web scraping to find applicable grants

**Technical Approach:**
- **Option A: Web Scraping** (Grants.gov, NIH Reporter, NSF, foundation sites)
  - Tools: Puppeteer/Playwright for dynamic content
  - Background job: Daily cron job
  - Storage: New `discovered_grants` table

- **Option B: API Integration** (Preferred if available)
  - Grants.gov API (free but limited)
  - NIH RePORTER API (free, comprehensive)
  - Foundation Directory Online (paid: ~$1,500/year)

**Token Costs:**
- **AI Usage:** Medium-High (~50K tokens/day)
  - Parse scraped content to extract structured data
  - Match grant requirements to PI research profile
  - Generate relevance scores and summaries
- **Estimated Cost:** ~$1.50/day = $45/month

**Tools Costs:**
- Free: NIH RePORTER API, Grants.gov API
- Paid: Foundation Directory (~$125/month) - Optional
- Infrastructure: Background worker (already have)

**Implementation Complexity:** High
- Web scraping maintenance (sites change frequently)
- Data normalization across multiple sources
- Duplicate detection
- Profile matching logic

**Priority Rank:** 2 (High value but complex)

---

### 2. Deadline Scheduling & Notifications
**Description:** Track all grant deadlines and notify users

**Technical Approach:**
- Extend existing `opportunities` table with notification preferences
- Email notifications: SendGrid/AWS SES
- In-app notifications: New `notifications` table
- Calendar export: iCal format generation
- Background job: Daily deadline checker

**Token Costs:**
- **AI Usage:** Very Low (0-5K tokens/day)
  - Optional: AI-generated personalized reminder messages
- **Estimated Cost:** ~$0.15/day = $4.50/month

**Tools Costs:**
- SendGrid: Free tier (100 emails/day) or $15/month (40K emails)
- AWS SES: $0.10 per 1,000 emails (very cheap)
- SMS (optional): Twilio ~$0.0075/message

**Implementation Complexity:** Low-Medium
- Straightforward notification system
- Cron job for daily checks
- Email template design

**Priority Rank:** 1 (Low cost, high value, foundational)

---

### 3. Deadline-Based Task Nudging
**Description:** Intelligent prioritization and progress nudges

**Technical Approach:**
- Analyze application progress vs. deadline
- Calculate completion percentage per section
- Generate daily/weekly task recommendations
- Smart notifications: "Specific Aims due in 5 days, only 30% complete"
- Dashboard widget: "What to work on today"

**Token Costs:**
- **AI Usage:** Medium (~30K tokens/day)
  - Analyze current progress
  - Generate personalized task recommendations
  - Prioritize sections based on deadline proximity
  - Create motivational nudge messages
- **Estimated Cost:** ~$1/day = $30/month

**Tools Costs:**
- None (uses existing infrastructure)

**Implementation Complexity:** Medium
- Progress tracking logic
- Deadline proximity calculations
- Smart notification scheduling
- User preference learning (optional)

**Priority Rank:** 3 (Depends on #2, moderate cost)

---

### 4. Bibliography/Citations Automation
**Description:** Auto-generate citations and format bibliography

**Technical Approach:**
- **Option A: Citation API Integration**
  - Crossref API (free, comprehensive for journals)
  - PubMed API (free, medical/bio research)
  - DOI.org API (free)
  - Zotero API (free with account)

- **Option B: AI-Powered Extraction**
  - User pastes paper title/DOI/PMID
  - AI extracts and formats citation
  - Store in `citations` table

- **Option C: Hybrid** (Recommended)
  - Use APIs for structured data
  - AI for formatting and context

**Token Costs:**
- **AI Usage:** Low-Medium (~10K tokens/day)
  - Format citations to NIH/NSF standards
  - Generate bibliography section text
  - Parse unstructured citation inputs
  - Detect citation context in grant text
- **Estimated Cost:** ~$0.30/day = $9/month

**Tools Costs:**
- Crossref API: Free
- PubMed API: Free
- Zotero API: Free (5 users, 300MB storage)
- Mendeley API: Free tier available
- Optional: Citation.js library (open source)

**Implementation Complexity:** Medium
- Multiple API integrations
- Citation format standards (APA, MLA, NIH, NSF)
- In-text citation management
- Duplicate detection

**Priority Rank:** 4 (Low cost, medium complexity, high user value)

---

### 5. Overall Grant Process Simplification
**Description:** Comprehensive features to streamline workflow

**Sub-features:**
a) **Smart Templates & Boilerplate**
   - Token Cost: Low (~5K/month one-time)
   - Reusable sections (facilities, equipment, biosketches)
   - Auto-fill from previous grants

b) **Compliance Checker**
   - Token Cost: Medium (~20K tokens/document)
   - Check page limits, formatting, required sections
   - NIH/NSF compliance validation

c) **Collaboration Tools**
   - Token Cost: None (traditional backend)
   - Multi-user editing
   - Comments and suggestions
   - Real-time collaboration

d) **Export & Formatting**
   - Token Cost: Very Low (~2K tokens/document)
   - PDF generation with proper formatting
   - NIH/NSF format compliance
   - Google Docs export

e) **Progress Dashboard**
   - Token Cost: Low (~5K tokens/week)
   - AI-generated weekly summaries
   - Completion metrics
   - Team performance insights

**Combined Token Costs:**
- **AI Usage:** Medium (~40K tokens/month ongoing)
- **Estimated Cost:** ~$1.20/day = $36/month

**Tools Costs:**
- PDF Generation: Puppeteer (free) or PDFKit (free)
- Real-time collab: Socket.io (already have)
- Google Docs API: Free (quota limits)

**Implementation Complexity:** High (multiple sub-features)

**Priority Rank:** 5 (Ongoing, incremental improvements)

---

## Cost Summary

### Monthly AI Token Costs (Claude API @ ~$3/million input, ~$15/million output)

| Feature | Tokens/Day | Monthly Cost | Annual Cost |
|---------|-----------|--------------|-------------|
| Grant Discovery | 50K | $45 | $540 |
| Deadlines & Notifications | 5K | $4.50 | $54 |
| Task Nudging | 30K | $30 | $360 |
| Bibliography/Citations | 10K | $9 | $108 |
| Process Simplification | 40K | $36 | $432 |
| **TOTAL** | **135K/day** | **$124.50** | **$1,494** |

### Monthly External Tools Costs

| Tool/Service | Cost | Required? |
|-------------|------|-----------|
| SendGrid (Email) | $15 | Yes (or use AWS SES) |
| AWS SES (Alternative) | ~$2 | Yes (cheaper option) |
| Foundation Directory | $125 | No (Optional) |
| SMS Notifications (Twilio) | ~$5 | No (Optional) |
| **TOTAL (Minimal)** | **$17** | - |
| **TOTAL (Full Featured)** | **$147** | - |

### **Grand Total Monthly Operating Cost:**
- **Minimal:** $141.50/month ($124.50 AI + $17 tools)
- **Full Featured:** $271.50/month ($124.50 AI + $147 tools)

---

## Implementation Priority (Ranked by ROI)

### Priority 1: Deadline Scheduling & Notifications ⭐⭐⭐⭐⭐
**Why First:**
- Lowest cost ($4.50/month AI)
- High user value (prevents missed deadlines)
- Foundation for Priority 3 (task nudging)
- Low complexity, quick win
- No external dependencies

**Estimated Time:** 1-2 weeks

---

### Priority 2: Grant Discovery ⭐⭐⭐⭐
**Why Second:**
- High user value (automated opportunity finding)
- Moderate cost ($45/month AI)
- Can use free APIs (NIH RePORTER, Grants.gov)
- Runs independently of other features

**Estimated Time:** 2-3 weeks

---

### Priority 3: Task Nudging ⭐⭐⭐⭐
**Why Third:**
- Depends on Priority 1 (deadline system)
- Moderate cost ($30/month AI)
- High engagement value
- No external costs

**Estimated Time:** 1-2 weeks (after Priority 1)

---

### Priority 4: Bibliography/Citations ⭐⭐⭐⭐
**Why Fourth:**
- Low cost ($9/month AI)
- Uses free APIs
- High time-saving value for users
- Independent feature

**Estimated Time:** 2-3 weeks

---

### Priority 5: Process Simplification ⭐⭐⭐
**Why Last:**
- Umbrella category with multiple sub-features
- Implement incrementally alongside other priorities
- Some features are "nice-to-have"
- Build as you discover user needs

**Estimated Time:** Ongoing (3-6 months)

---

## Optimizations to Reduce Token Costs

### 1. **Caching Strategy**
- Cache grant discovery results for 7 days
- Cache formatted citations permanently
- Cache AI-generated summaries
- **Potential Savings:** 30-40% reduction

### 2. **Batch Processing**
- Process multiple grants in single API call
- Batch citation formatting
- **Potential Savings:** 20% reduction

### 3. **Smart Triggering**
- Only run grant discovery when user profile changes
- Only generate nudges when deadline approaches
- **Potential Savings:** 15-25% reduction

### 4. **Use Cheaper Models for Simple Tasks**
- Use Claude Haiku ($0.25/$1.25 per million) for:
  - Citation formatting
  - Simple notifications
  - Compliance checking
- **Potential Savings:** 50-70% on those specific tasks

### **Optimized Monthly Cost:** ~$75-85/month (vs $124.50)

---

## Technical Architecture Additions

### New Database Tables

```sql
-- Grant discovery
discovered_grants (
  id, source, title, agency, deadline,
  eligibility, funding_amount, description,
  relevance_score, ai_summary, discovered_at
)

-- Notifications
notifications (
  id, user_id, application_id, type,
  title, message, scheduled_for, sent_at,
  read_at, priority
)

-- Citations
citations (
  id, application_id, citation_type,
  authors, title, journal, year, doi,
  formatted_text, created_by
)

-- User research profiles
user_profiles (
  id, user_id, research_areas, keywords,
  institutions, expertise_level,
  preferred_agencies, updated_at
)
```

### New NestJS Modules

1. **GrantDiscoveryModule**
   - Services: ScraperService, MatchingService
   - Scheduled tasks: Daily discovery cron

2. **NotificationsModule**
   - Services: NotificationService, EmailService
   - Gateways: NotificationGateway (WebSocket)

3. **TaskNudgingModule**
   - Services: ProgressAnalyzer, PrioritizationService
   - Scheduled tasks: Daily nudge generation

4. **CitationsModule**
   - Services: CitationService, FormatterService
   - Integrations: Crossref, PubMed, DOI.org

---

## Phase 2 Roadmap

### Sprint 1 (Weeks 1-2): Notifications Foundation
- [ ] Notification database schema
- [ ] Email integration (SendGrid/AWS SES)
- [ ] Deadline tracking cron job
- [ ] In-app notification UI
- [ ] User notification preferences

### Sprint 2 (Weeks 3-4): Grant Discovery MVP
- [ ] Discover grants database schema
- [ ] NIH RePORTER API integration
- [ ] Grants.gov API integration
- [ ] Basic scraper for common sites
- [ ] Relevance matching algorithm
- [ ] Discovery results UI

### Sprint 3 (Weeks 5-6): Task Nudging
- [ ] Progress calculation service
- [ ] Priority algorithm
- [ ] Task recommendation generator
- [ ] Dashboard "Today's Focus" widget
- [ ] Smart notification scheduling

### Sprint 4 (Weeks 7-9): Bibliography System
- [ ] Citations database schema
- [ ] Crossref API integration
- [ ] PubMed API integration
- [ ] Citation formatter (multiple styles)
- [ ] In-app citation manager UI
- [ ] Bibliography section generator

### Sprint 5+ (Ongoing): Process Improvements
- Incremental enhancements based on user feedback
- Compliance checker
- Collaboration features
- Advanced export options

---

## Risk Mitigation

### Token Cost Overruns
- **Risk:** AI usage exceeds budget
- **Mitigation:**
  - Implement per-user rate limits
  - Monitor costs with alerts
  - Cache aggressively
  - Use Haiku for simple tasks

### Web Scraping Reliability
- **Risk:** Target sites change structure, break scrapers
- **Mitigation:**
  - Prioritize APIs over scraping
  - Build robust error handling
  - Implement change detection alerts
  - Maintain scraper test suite

### Email Deliverability
- **Risk:** Notifications marked as spam
- **Mitigation:**
  - Use reputable service (SendGrid/AWS SES)
  - Implement SPF/DKIM
  - Allow users to opt-out
  - Test spam scores

---

## Success Metrics

1. **Grant Discovery:**
   - 50+ relevant grants discovered per week
   - 80%+ relevance match accuracy

2. **Notifications:**
   - 95%+ on-time delivery rate
   - <2% unsubscribe rate

3. **Task Nudging:**
   - 30%+ increase in on-time submissions
   - 70%+ user engagement with nudges

4. **Citations:**
   - 90%+ format accuracy
   - 80% reduction in manual citation work

5. **Overall:**
   - 50% reduction in grant preparation time
   - 90%+ user satisfaction score

---

## Next Steps

1. **Approve Priority Order:** Confirm implementation sequence
2. **Budget Approval:** Authorize $150-300/month operational costs
3. **Sprint 1 Kickoff:** Begin notifications system implementation
4. **Set Up Monitoring:** Token usage tracking, cost alerts
5. **User Feedback Loop:** Regular check-ins during development

---

## Questions for User

1. Does the priority order (Notifications → Discovery → Nudging → Citations → Process) make sense?
2. Budget approval for ~$150/month operational costs?
3. Any specific grant sources to prioritize (NIH, NSF, foundations)?
4. Email notification preferences (daily digest vs real-time)?
5. Citation style preferences (APA, NIH format, etc.)?
