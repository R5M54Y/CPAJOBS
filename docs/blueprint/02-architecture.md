# 02-architecture.md - System Architecture

## Target Architecture Stack

### GitHub
- Code source of truth
- Git version control
- Pull request workflow
- Issues for task tracking

### Cloudflare Pages
- Frontend hosting (free tier)
- Serves static HTML/CSS/JS
- Deployed from GitHub repository
- Custom domain optional

### Cloudflare Workers
- Backend JavaScript/TypeScript runtime
- Triggers on API requests
- D1 database access
- KV store access if needed
- Free tier: 100,000 requests/day, 50ms timeout

### Cloudflare D1
- SQL database (free tier)
- 10MB storage limit
- SQLite-compatible
- Queries via Workers
- Tables: users, offers, categories, offer_sources, clicks, conversions, revenue, system_events

## Architecture Diagram

```text
GitHub Repository
        │
        ▼
Cloudflare Pages          Cloudflare Workers
│   Static assets         │   API endpoints
│   (HTML/CSS/JS)         │   │
│        │                │   ▼
│        └──────► D1 DB   │   │
│                    │   │   requests
│                    │   │   │
│                    │   └──► KV (optional)
│                    │       │
│                    ▼       ▼
│                R2 (optional)   Cron
│
└──────► Optional Cron Jobs
```

## Component Responsibilities

### Frontend (Cloudflare Pages)
- Serve static website
- Handle user interactions
- Collect click/conversion data
- Submit to backend via API

### Backend (Cloudflare Workers)
- API endpoint processing
- Database operations
- Business rule enforcement
- Click/conversion tracking
- Status/expire offer automation

### Database (Cloudflare D1)
- Store all persistent data
- Users, offers, categories
- Click and conversion events
- Revenue tracking
- System events/audit log

## Data Flow

1. User visits site → Cloudflare Pages serves HTML
2. User clicks offer → frontend records click → POST /track/click to Worker
3. Worker stores click in D1 → redirects user to offer
4. User completes action → POST /track/conversion to Worker
5. Worker stores conversion → calculates revenue
6. Cron job checks expired offers → updates status in D1