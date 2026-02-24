# Citation Automation System - User Guide

## Overview
The citation automation system helps you manage references for your grant applications by automatically fetching citation data from DOI or PubMed ID and formatting them in NIH, APA, MLA, or Chicago styles.

---

## Features

### 1. Auto-Fetch Citations
- **By DOI:** Enter a DOI (e.g., `10.1038/nature12373`) and automatically fetch title, authors, journal, year, etc.
- **By PMID:** Enter a PubMed ID (e.g., `12345678`) and fetch from PubMed database
- **Manual Entry:** Add citations manually if no DOI/PMID available

### 2. Multiple Citation Formats
Each citation is automatically formatted in:
- **NIH Format:** Numbered reference list style used in NIH grant applications
- **APA Format:** 7th edition APA style
- **MLA Format:** 9th edition MLA style
- **Chicago Format:** 17th edition Author-Date style

### 3. Bibliography Generation
Generate a complete formatted bibliography in any style with one click. Perfect for the References section of your grant.

### 4. Search & Organization
- Search citations by title, author, or journal
- View all citations for an application
- Track citation usage

---

## How to Use

### Accessing the Citation Manager

1. Go to: http://localhost:3004
2. Click "Test Login" (or "Login & Go to AI Assistant")
3. Click "✨ AI Assistant" button on any application
4. Click the **"Citations & Bibliography"** tab

### Adding a Citation

#### Option 1: Add by DOI
1. Click **"+ Add Citation"**
2. Ensure "DOI" tab is selected
3. Enter the DOI (accepts multiple formats):
   - `10.1234/example`
   - `https://doi.org/10.1234/example`
   - `doi:10.1234/example`
4. Click **"Add Citation"**

The system will:
- Fetch citation data from Crossref API
- Extract title, authors, journal, year, volume, issue, pages
- Format in all 4 citation styles automatically
- Store in your application

#### Option 2: Add by PMID
1. Click **"+ Add Citation"**
2. Click "PMID" tab
3. Enter the PubMed ID (e.g., `12345678`)
4. Click **"Add Citation"**

The system will:
- Fetch citation data from PubMed API
- Extract all metadata including abstract
- Format in all 4 citation styles

### Viewing Citations

Each citation card shows:
- **Title** (bold)
- **Authors** (comma-separated)
- **Journal & Publication Info** (journal, year, volume, issue, pages)
- **Identifiers** (clickable DOI and PMID links)
- **Formatted Citation** (NIH style preview in gray box)

### Searching Citations

1. Use the search bar at the top
2. Type keywords (searches title, authors, journal)
3. Press Enter or click "Search"
4. Click "Clear" to see all citations again

### Generating Bibliography

1. Click **"Generate Bibliography"** button
2. A modal opens showing all citations formatted
3. Switch between NIH/APA/MLA/Chicago tabs to see different formats
4. Click **"Copy to Clipboard"** to copy the entire bibliography
5. Paste into your grant application's References section

### Deleting Citations

- Click **"Delete"** button on any citation card
- Confirm the deletion

---

## Testing with Real DOIs

Here are some real DOIs you can test with:

### Medical/Biology Research
- `10.1038/nature12373` - Nature paper on CRISPR-Cas9
- `10.1126/science.1260352` - Science paper on gene editing
- `10.1056/NEJMoa1200303` - NEJM clinical trial

### PubMed IDs
- `23827677` - CRISPR paper
- `24336571` - Gene editing paper
- `22722868` - Clinical research

---

## API Endpoints

### Create Citation
```bash
POST /api/v1/citations
{
  "applicationId": "70000001-0000-0000-0000-000000000001",
  "doi": "10.1234/example"
}
```

### Get All Citations
```bash
GET /api/v1/citations?applicationId=70000001-0000-0000-0000-000000000001
```

### Search Citations
```bash
GET /api/v1/citations/search?applicationId=xxx&q=CRISPR
```

### Generate Bibliography
```bash
GET /api/v1/citations/bibliography?applicationId=xxx&format=nih
```

### Batch Import
```bash
POST /api/v1/citations/batch-import
{
  "applicationId": "xxx",
  "source": "doi",
  "identifiers": ["10.1234/example1", "10.1234/example2"]
}
```

---

## Database Schema

### `citations` Table
- Stores all citation metadata
- Cached formatted versions (NIH, APA, MLA, Chicago)
- Usage tracking (usage_count, last_used_at)

### `citation_links` Table
- Tracks where citations are used in sections
- In-text citation positioning
- Context tracking

### `citation_import_jobs` Table
- Tracks batch import jobs
- Success/failure counts
- Error logging

---

## External APIs Used

### 1. Crossref API (Free)
- **Endpoint:** `https://api.crossref.org/works/{doi}`
- **Rate Limit:** None (polite usage)
- **Data:** Journal articles, books, conference papers
- **Coverage:** 134M+ records

### 2. PubMed API (Free)
- **Endpoint:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
- **Rate Limit:** 3 requests/second (no API key)
- **Data:** Biomedical literature
- **Coverage:** 36M+ citations

### 3. DOI.org API (Free)
- Backup for resolving DOIs
- Content negotiation for metadata

---

## Cost Analysis

### Token Usage (AI-powered formatting)
- **Per Citation:** ~500 tokens (only if using AI formatter fallback)
- **Primary Formatting:** Rule-based (0 tokens)
- **AI Fallback:** Only for complex/ambiguous citations

### Estimated Monthly Costs
- **100 citations/month:** ~$0.15 (mostly rule-based)
- **500 citations/month:** ~$0.75
- **1000 citations/month:** ~$1.50

**Why so cheap?**
- Most formatting is rule-based (NIH, APA, MLA, Chicago)
- AI (Claude Haiku) only used for edge cases
- Citation data fetching is free (Crossref, PubMed APIs)

---

## Troubleshooting

### "Could not fetch citation data for DOI: xxx"
- Check if DOI is valid
- Try searching the DOI on https://doi.org first
- Some DOIs may not be in Crossref database
- Try PMID if it's a biomedical paper

### "Failed to add citation"
- Check network connectivity
- Verify backend is running (http://localhost:3001)
- Check browser console for errors

### Search not working
- Ensure you've added citations first
- Try different search terms
- Search is case-insensitive

---

## Future Enhancements (Phase 2+)

1. **BibTeX Import:** Import citations from .bib files
2. **In-Text Citation Management:** Track where citations are used in sections
3. **Citation Suggestions:** AI suggests relevant papers based on grant topic
4. **Duplicate Detection:** Prevent adding the same citation twice
5. **Citation Networking:** Find related papers automatically
6. **Export Options:** Export to EndNote, Zotero, Mendeley
7. **Collaborative Libraries:** Share citation libraries with team

---

## Questions?

- Backend logs: `/private/tmp/claude-503/.../tasks/b83a088.output`
- Frontend: http://localhost:3004
- Backend API: http://localhost:3001/api/v1

Test with the two sample applications:
1. **CardioAI Study** - ID: `70000001-0000-0000-0000-000000000001`
2. **Remote Monitoring** - ID: `70000001-0000-0000-0000-000000000002`
