# 04-database.md - Database Schema

## Schema Overview

Cloudflare D1 database schema designed for CPA JOBS MVP with free tier constraints (10MB). Focus on simplicity, performance, and data integrity.

## Tables

### 1. users

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);
```

**Fields:**
- `id`: UUID primary key
- `email`: Unique email address
- `name`: Display name
- `status`: User account status (active/inactive)
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp
- `metadata`: JSON for future extensibility

**Indexes:**
- Unique index on `email`

**Uniqueness:**
- Email must be unique

**Timestamps:**
- `created_at` set once on creation
- `updated_at` updated on any change

### 2. categories

```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);
```

**Fields:**
- `id`: UUID primary key
- `name`: Display name
- `slug`: URL-friendly identifier
- `description`: Category description
- `status`: Category status (active/inactive)
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp
- `metadata`: JSON for future extensibility

**Indexes:**
- Unique index on `name`
- Unique index on `slug`

**Uniqueness:**
- Name and slug must be unique

### 3. offer_sources

```sql
CREATE TABLE offer_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);
```

**Fields:**
- `id`: UUID primary key
- `name`: Source name
- `type`: Source type (manual/network)
- `config`: JSON configuration
- `status`: Source status (active/inactive)
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp
- `metadata`: JSON for future extensibility

**Indexes:**
- Index on `type`
- Index on `status`

### 4. offers

```sql
CREATE TABLE offers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    url TEXT NOT NULL,
    payout DECIMAL(10,2) NOT NULL,
    payout_type TEXT NOT NULL DEFAULT 'cpa',
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    click_count INTEGER NOT NULL DEFAULT 0,
    conversion_count INTEGER NOT NULL DEFAULT 0,
    revenue INTEGER NOT NULL DEFAULT 0,
    metadata TEXT
);
```

**Fields:**
- `id`: UUID primary key
- `title`: Offer title
- `description`: Offer description
- `category_id`: Foreign key to categories
- `source_id`: Foreign key to offer_sources
- `url`: Offer URL
- `payout`: Offer payout amount
- `payout_type`: Payout type (cpa/lead/cpc)
- `requirements`: JSON requirements
- `status`: Status (draft/active/expired/inactive)
- `expires_at`: Expiration date
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp
- `click_count`: Number of clicks
- `conversion_count`: Number of conversions
- `revenue`: Total revenue generated
- `metadata`: JSON for future extensibility

**Relationships:**
- Foreign key `category_id` → categories(id)
- Foreign key `source_id` → offer_sources(id)

**Indexes:**
- Index on `status`
- Index on `expires_at`
- Composite index on `category_id`, `status`
- Index on `created_at`

**Uniqueness:**
- Combination of `source_id`, `url` should be unique (enforced in application)

### 5. clicks

```sql
CREATE TABLE clicks (
    id TEXT PRIMARY KEY,
    offer_id TEXT NOT NULL,
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);
```

**Fields:**
- `id`: UUID primary key
- `offer_id`: Foreign key to offers
- `user_id`: Foreign key to users (nullable)
- `ip_address`: IP address
- `user_agent`: Browser user agent
- `referrer`: Referring URL
- `timestamp`: Click timestamp
- `metadata`: JSON for future extensibility

**Relationships:**
- Foreign key `offer_id` → offers(id)
- Foreign key `user_id` → users(id)

**Indexes:**
- Index on `offer_id`
- Index on `timestamp`
- Index on `user_id`

**Uniqueness:**
- Idempotency: Unique constraint on `offer_id`, `ip_address`, `timestamp` (within 5 minutes)

### 6. conversions

```sql
CREATE TABLE conversions (
    id TEXT PRIMARY KEY,
    offer_id TEXT NOT NULL,
    user_id TEXT,
    source TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending'
);
```

**Fields:**
- `id`: UUID primary key
- `offer_id`: Foreign key to offers
- `user_id`: Foreign key to users (nullable)
- `source`: Conversion source (direct/network)
- `amount`: Conversion amount/revenue
- `metadata`: JSON for future extensibility
- `timestamp`: Conversion timestamp
- `status`: Status (pending/confirmed/rejected)

**Relationships:**
- Foreign key `offer_id` → offers(id)
- Foreign key `user_id` → users(id)

**Indexes:**
- Index on `offer_id`
- Index on `timestamp`
- Index on `status`
- Index on `source`

**Uniqueness:**
- Idempotency: Unique constraint on `offer_id`, `source`, `timestamp` (within 10 minutes)

### 7. revenue

```sql
CREATE TABLE revenue (
    id TEXT PRIMARY KEY,
    offer_id TEXT NOT NULL,
    source TEXT NOT NULL,
    amount INTEGER NOT NULL,
    period_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending'
);
```

**Fields:**
- `id`: UUID primary key
- `offer_id`: Foreign key to offers
- `source`: Revenue source
- `amount`: Revenue amount
- `period_date`: Revenue period (daily aggregation)
- `created_at`: Record creation timestamp
- `status`: Status (pending/confirmed/rejected)

**Relationships:**
- Foreign key `offer_id` → offers(id)

**Indexes:**
- Composite index on `period_date`, `offer_id`
- Index on `status`

**Uniqueness:**
- Unique constraint on `offer_id`, `source`, `period_date`

### 8. system_events

```sql
CREATE TABLE system_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    payload TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processing_time INTEGER,
    retry_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending'
);
```

**Fields:**
- `id`: UUID primary key
- `event_type`: Event type (click/conversion/expire)
- `entity_type`: Entity type (offer/user)
- `entity_id`: Entity ID
- `payload`: JSON event data
- `timestamp`: Event timestamp
- `processing_time`: Processing duration in ms
- `retry_count`: Number of retry attempts
- `status`: Status (pending/success/failed)

**Indexes:**
- Index on `timestamp`
- Index on `status`
- Index on `event_type`

## Constraints & Rules

1. **Foreign Key Constraints**: All foreign keys have ON DELETE CASCADE
2. **Timestamps**: All records include created_at and updated_at
3. **Idempotency**: Click and conversion tables have unique constraints to prevent duplicates
4. **Status Management**: All tables have status field for soft deletion
5. **Revenue Aggregation**: Daily revenue tracking for reporting
6. **Audit Trail**: system_events table for tracking all operations

## Storage Estimate

Approximate storage per table (rough estimates):
- users: ~1KB per user
- categories: ~500B per category
- offer_sources: ~500B per source
- offers: ~2KB per offer
- clicks: ~1KB per click
- conversions: ~1KB per conversion
- revenue: ~500B per daily record
- system_events: ~500B per event

Estimated total for MVP: < 2MB