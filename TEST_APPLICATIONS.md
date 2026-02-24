# Test Applications Available

## Quick Test URLs

You can immediately test the chatbot with these pre-seeded applications:

### Application #1: NIH R01 - CardioAI
- **ID:** `70000001-0000-0000-0000-000000000001`
- **Project:** CardioAI Platform
- **Opportunity:** AI for Cardiovascular Disease Prediction (RFA-HL-26-001)
- **Amount:** $450,000
- **Deadline:** June 15, 2026
- **Stage:** Drafting

**Test URL:**
```
http://localhost:3000/applications/70000001-0000-0000-0000-000000000001/ai-assistant
```

### Application #2: SBIR - Remote Monitoring
- **ID:** `70000001-0000-0000-0000-000000000002`
- **Project:** Remote Patient Monitoring System
- **Opportunity:** Digital Health Tools (PAR-26-100)
- **Amount:** $300,000
- **Deadline:** May 1, 2026
- **Stage:** Planning

**Test URL:**
```
http://localhost:3000/applications/70000001-0000-0000-0000-000000000002/ai-assistant
```

## Quick Test with Direct API

You can also test the API directly without the UI:

```bash
# Get section templates (no auth needed for this endpoint potentially)
curl http://localhost:3001/api/v1/generated-sections/meta/templates?grantType=NIH_R01

# With authentication, generate a section:
# (You'll need a JWT token from Google OAuth)
curl -X POST http://localhost:3001/api/v1/chat/generate-section \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "applicationId": "70000001-0000-0000-0000-000000000001",
    "sectionKey": "specific_aims"
  }'
```

## Test Users Available

From seed data:
- **Founder:** `founder@webslinger.ai` (ID: `20000001-0000-0000-0000-000000000001`)
- **Writer:** `writer@webslinger.ai` (ID: `20000001-0000-0000-0000-000000000002`)
- **Clinician:** `clinician@webslinger.ai` (ID: `20000001-0000-0000-0000-000000000003`)

## To Test Right Now:

1. **Start Frontend:**
   ```bash
   npm run dev --workspace=frontend
   ```

2. **Navigate to test page:**
   ```
   http://localhost:3000/applications/70000001-0000-0000-0000-000000000001/ai-assistant
   ```

3. **You'll see:**
   - Generate Section dropdown with 12 NIH R01 sections
   - "Open AI Chat" button
   - Sections list (empty initially)

4. **Try it:**
   - Click "Generate Section" → "Specific Aims"
   - Or click "Open AI Chat" and type a message

**Note:** You'll need to be authenticated (Google OAuth) for the API calls to work. The UI components will handle this automatically if you have the auth flow set up.

## Without Auth (Quick Test)

If you want to test immediately without setting up Google OAuth:

1. Temporarily modify the API client to skip auth
2. Or use the backend directly with a mock user ID
3. Or set up Google OAuth (recommended for full testing)

## Application Context

When you chat about application `70000001-0000-0000-0000-000000000001`, the AI will know:
- Project: CardioAI Platform
- Focus: AI-powered cardiovascular disease prediction
- Clinical Area: Cardiology
- Funding: NIH R01, $450,000
- Opportunity: AI for Cardiovascular Disease Prediction

This makes the AI responses contextual and relevant!
