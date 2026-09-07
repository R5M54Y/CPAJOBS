# 00-overview.md - Blueprint Overview

## Purpose

This blueprint defines the MVP implementation plan for CPA JOBS, a cost-free CPA (Cost-Per-Action) job listing platform built on GitHub + Cloudflare free tier.

## Target Infrastructure

- **GitHub**: Code repository
- **Cloudflare Pages**: Frontend hosting (free tier)
- **Cloudflare Workers**: Backend logic (free tier)
- **Cloudflare D1**: Database (free tier)
- **Cloudflare KV/R2**: Optional, only when genuinely justified

## MVP Scope

### Included

- Landing page
- Offer listing
- Offer detail
- Categories/basic filtering
- Offer management
- Outbound click tracking
- CPA conversion tracking where supported
- Basic revenue tracking
- Basic admin visibility
- Basic offer validation
- Basic automated expiration/status handling

### Excluded (future phases)

- Mobile app
- Advanced AI recommendations
- Machine learning
- Complex fraud detection
- Content factory
- Advanced personalization
- Sophisticated analytics
- Multi-service architecture
- Paid advertising optimization

## Architecture

```text
GitHub
   ↓
Cloudflare Pages (Frontend)
   ↓
Cloudflare Workers (Backend)
   ↓
Cloudflare D1 (Database)
```

## Cost Strategy

- Primary: GitHub + Cloudflare free tier = $0/month
- AI: Optional with deterministic fallback
- No paid services, no VPS, no microservices unless absolutely necessary

## Freeze Status

This blueprint is frozen. Implementation is blocked until explicitly authorized.