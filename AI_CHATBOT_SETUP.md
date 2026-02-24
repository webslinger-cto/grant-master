# AI Chatbot Integration - Setup Complete ✅

## Overview
Successfully integrated an AI-powered chatbot into GrantsMaster to help write NIH grant applications using Anthropic Claude 3.5 Sonnet.

## ✅ Backend Implementation (COMPLETED)

### Database Schema
Created 4 new tables in migration `20260215000001_add_ai_chatbot_tables.ts`:

1. **section_templates** - Templates for different grant sections (NIH R01, NSF, etc.)
2. **generated_sections** - AI-generated content with version tracking
3. **chat_messages** - Conversation history per application
4. **ai_usage_tracking** - Rate limiting and cost tracking

### Modules Created

#### 1. ChatModule (`apps/backend/src/modules/chat/`)
- **chat.service.ts** - Core AI integration with Anthropic Claude
- **chat.controller.ts** - REST API endpoints
- **chat.gateway.ts** - WebSocket for streaming responses (real-time chat)
- **DTOs**: CreateChatMessageDto, GenerateSectionDto, ChatHistoryQueryDto

**Features:**
- Contextual chat per application (knows about project, opportunity, funding source)
- Rate limiting (100 messages/day per user by default)
- Token usage tracking and cost estimation
- Both REST and WebSocket support

**API Endpoints:**
```
POST   /chat/message              # Send message, get AI response
POST   /chat/generate-section     # Generate specific grant section
GET    /chat/history              # Get chat history for application
```

**WebSocket:**
```
Connect to: ws://localhost:3001/chat
Emit: 'stream-message' { applicationId, content, userId }
Listen: 'chunk' (text streaming), 'done' (complete), 'error'
```

#### 2. GeneratedSectionsModule (`apps/backend/src/modules/generated-sections/`)
- **generated-sections.service.ts** - CRUD for generated sections
- **generated-sections.controller.ts** - REST API
- **DTOs**: UpdateSectionDto

**Features:**
- Version tracking for each section
- Status workflow: draft → under_review → approved/rejected
- Auto-creates review tasks when marked for review
- Auto-updates application stage to "drafting"
- Export all sections as single document

**API Endpoints:**
```
GET    /generated-sections?applicationId=xxx        # Get all sections
GET    /generated-sections/:id                      # Get specific section
GET    /generated-sections/:appId/history/:name     # Version history
PUT    /generated-sections/:id                      # Update section
PUT    /generated-sections/:id/set-current          # Set as current version
DELETE /generated-sections/:id                      # Delete section
GET    /generated-sections/meta/templates           # Get templates
GET    /generated-sections/:appId/export            # Export all sections
```

### NIH R01 Section Templates
Seeded 12 NIH R01 section templates in `002_nih_r01_sections.ts`:

1. **Project Summary/Abstract** (30 lines, ~400 words)
2. **Project Narrative** (2-3 sentences)
3. **Specific Aims** (1 page, ~600 words)
4. **Research Strategy - Significance** (2-3 pages)
5. **Research Strategy - Innovation** (1-2 pages)
6. **Research Strategy - Approach** (6-8 pages)
7. **Budget Justification** (2-4 pages)
8. **Biographical Sketch** (5 pages per person)
9. **Facilities & Other Resources** (2 pages)
10. **Equipment** (1 page)
11. **Data Management & Sharing Plan** (2 pages)
12. **Authentication of Key Resources** (2 pages)

Each template includes:
- Structured prompts for AI generation
- Page/word limits
- Metadata (key questions, formatting notes)
- Context placeholders (application_context, budget_data, etc.)

### Environment Variables
Added to `.env` and `.env.example`:

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-...

# AI Configuration
AI_MAX_MESSAGES_PER_USER_PER_DAY=100
AI_MAX_TOKENS_PER_REQUEST=4000
AI_DEFAULT_MODEL=claude-3-5-sonnet-20241022
AI_DEFAULT_TEMPERATURE=0.7
AI_STREAM_RESPONSES=true
```

### Dependencies Installed
```bash
@anthropic-ai/sdk
@nestjs/websockets@^10.0.0
@nestjs/platform-socket.io@^10.0.0
```

---

## 🚧 Frontend Implementation (IN PROGRESS)

### Next Steps - UI Components to Build:

#### 1. Chat Sidebar Component
**Location:** `apps/frontend/src/components/chat/ChatSidebar.tsx`

**Features:**
- Slide-in sidebar (right side of screen)
- Message history display
- Input field with send button
- Streaming response support (real-time typing effect)
- Contextual to current application
- Quick actions: "Generate Specific Aims", "Generate Significance", etc.

#### 2. Section Editor Component
**Location:** `apps/frontend/src/components/sections/SectionEditor.tsx`

**Features:**
- Rich text editor for AI-generated content
- Version history dropdown
- Status badges (draft, under_review, approved)
- Save/discard changes
- Request review button
- Export to Google Docs button (Phase 2)

#### 3. Application Detail Page Integration
**Location:** `apps/frontend/src/app/applications/[id]/page.tsx`

**Integration:**
- Add ChatSidebar component
- Add "AI Assistant" toggle button
- Add "Generated Sections" tab
- Show section cards with status indicators

#### 4. Sections Management Page
**Location:** `apps/frontend/src/app/applications/[id]/sections/page.tsx`

**Features:**
- List all generated sections
- Generate new section dropdown
- Edit/delete sections
- Export entire application

---

## 🔧 To Run the Backend

### Start Database (Docker)
```bash
docker-compose up -d
```

### Run Migrations
```bash
npm run migrate --workspace=backend
```

### Seed NIH Templates
```bash
npm run seed --workspace=backend
```

### Start Backend
```bash
npm run dev:backend
```

Backend will be available at: `http://localhost:3001`

---

## 📊 How It Works

### Chat Flow
1. User opens application detail page
2. Clicks "AI Assistant" to open chat sidebar
3. Types message: "Help me write the Specific Aims section"
4. Backend:
   - Retrieves application context (project, opportunity, funding source)
   - Retrieves recent chat history (last 10 messages)
   - Builds system prompt with context
   - Calls Anthropic Claude API
   - Streams response back via WebSocket
5. Frontend displays response in real-time (typing effect)
6. User can refine: "Make it more focused on clinical impact"
7. Repeat until satisfied

### Section Generation Flow
1. User clicks "Generate Section" → "Specific Aims"
2. Backend:
   - Retrieves section template for "specific_aims"
   - Gets application context
   - Replaces placeholders in template prompt
   - Calls Anthropic API (non-streaming)
   - Saves generated content to database (version 1)
   - Creates review task "Review: Specific Aims"
   - Updates application stage to "drafting"
3. Frontend displays generated section in editor
4. User can edit, approve, or request revisions
5. On approval: status → "approved", assigned PI can review

---

## 🎯 Key Features

### Context-Aware AI
- AI "knows" about the application (project name, funding opportunity, budget, stage)
- Can reference previous sections for consistency
- Understands NIH requirements and formatting

### Version Control
- Every section generation creates a new version
- Can compare versions and revert
- Only one "current" version per section

### Workflow Integration
- Generating a section automatically creates a review task
- Tasks are assigned with priority "high" and due 3 days before submission
- Application stage auto-updates to "drafting"

### Rate Limiting & Cost Tracking
- 100 messages per user per day (configurable)
- Tracks token usage per user/application
- Estimates costs (~$9 per million tokens)

### Storage Efficiency
- Text-only storage (minimal space)
- ~500-1000 words per section
- Full NIH R01 application: ~15-20 pages = ~10,000 words = ~50KB uncompressed
- 100 applications with 5 versions each = ~25MB total

---

## 🚀 Future Enhancements (Phase 2)

### Google Drive Integration
- Export sections to Google Docs
- Real-time collaboration
- Maintain formatting

### Advanced Features
- Compliance checking (page limits, format requirements)
- Bibliography management
- Automatic cross-referencing between sections
- Multi-language support
- Templates for other grant types (NSF, foundation grants)

### AI Improvements
- Fine-tuning on successful grants
- Feedback loop (track which sections get approved/funded)
- Style learning (adapt to organization's writing style)

---

## 📝 Testing Checklist

- [ ] Start Docker containers
- [ ] Run migrations successfully
- [ ] Seed templates successfully
- [ ] Backend builds without errors ✅
- [ ] Can send chat message via REST API
- [ ] Can generate section via REST API
- [ ] WebSocket streaming works
- [ ] Rate limiting works
- [ ] Review tasks are created
- [ ] Application stage updates
- [ ] Frontend chat sidebar displays
- [ ] Frontend section editor works
- [ ] End-to-end: Generate → Edit → Approve → Task created

---

## 💡 Usage Example

```typescript
// Chat with AI
const response = await fetch('/api/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    applicationId: 'uuid-here',
    content: 'Help me write a compelling opening for Specific Aims'
  })
});

// Generate a section
const section = await fetch('/api/chat/generate-section', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    applicationId: 'uuid-here',
    sectionKey: 'specific_aims',
    additionalContext: {
      focus: 'clinical translation',
      innovation: 'novel biomarker discovery'
    }
  })
});

// Stream chat (WebSocket)
const socket = io('http://localhost:3001/chat');
socket.emit('stream-message', {
  applicationId: 'uuid',
  content: 'Help me with innovation section',
  userId: 'user-uuid'
});
socket.on('chunk', ({ text }) => console.log(text)); // Real-time streaming
socket.on('done', ({ content }) => console.log('Complete:', content));
```

---

**Status: Backend ✅ Complete | Frontend 🚧 In Progress**
