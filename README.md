# USA JOBS ENGINE

Multi-deployment job aggregation platform built on Cloudflare Workers.

## Architecture

**One codebase, multiple site deployments.**

```
src/
  core/          # Shared configuration, routing, SEO utilities
  handlers/      # Request handlers (API, pages, static assets)
  importers/     # Job data importers (Ashby)
  db/            # Database schema and migrations
  main.js        # Entry point

deployments/
  <site-id>/
    site.json    # Deployment-specific configuration

static/          # Frontend assets (HTML, CSS, JS)
```

## Deployment Profiles

Each deployment profile (`deployments/<site-id>/site.json`) defines:

- Brand identity (name, title, description, domain)
- Target audience (location, keywords, industry)
- SEO configuration (base URL, locale)
- Feature flags (ads, analytics)

**Current deployments:**
- `usajobs-accounting` - General US accounting/finance jobs

## Configuration

### Environment Variables (Wrangler Secrets)

```bash
wrangler secret put ASHBY_JOB_BOARD_NAME
```

### Wrangler Configuration

- `wrangler.toml` - Base configuration
- `DB` binding - Cloudflare D1 database
- `CPAJOBS_KV` binding - KV namespace for caching

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Deploy (dry-run)
npm run deploy
```

## SEO Architecture

✅ Crawlable HTTP routes:
- `/` - Homepage
- `/jobs/` - Jobs index
- `/jobs/<slug>-<id>` - Job detail pages
- `/jobs/category/<category-slug>` - Category landing pages
- `/sitemap.xml` - Dynamic sitemap
- `/robots.txt` - Robots configuration

✅ Metadata:
- Unique titles and descriptions
- Canonical URLs
- Open Graph tags
- JobPosting JSON-LD schema

## Data Sources

- **Ashby** - Public Job Postings API
- Scheduled daily import via cron trigger (15:59 UTC)

## API Endpoints

- `GET /offers` - List job offers
- `GET /offers/:id` - Get offer details
- `GET /categories` - List categories
- `POST /track/click` - Track click events
- `GET /health` - Health check

## Repository Cleanliness

✅ No `.bak`, `.old`, `.tmp` files
✅ No embedded template literals for frontend code
✅ Modular architecture (874 lines vs 2519 monolithic)
✅ Clean git status

## Production Deployment

```bash
wrangler deploy
```

Ensure secrets are configured:
- `ASHBY_JOB_BOARD_NAME` - Your Ashby job board identifier
