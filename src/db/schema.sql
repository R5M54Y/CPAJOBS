-- CPA JOBS Database Schema for Cloudflare D1
-- Phase 1: Core database setup

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
);

-- Categories table
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

-- Offer sources table
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

-- Offers table
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

-- Clicks table
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

-- Conversions table
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

-- Revenue table
CREATE TABLE revenue (
    id TEXT PRIMARY KEY,
    offer_id TEXT NOT NULL,
    source TEXT NOT NULL,
    amount INTEGER NOT NULL,
    period_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending'
);

-- System events table
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

-- Indexes
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_expires_at ON offers(expires_at);
CREATE INDEX idx_offers_category_status ON offers(category_id, status);
CREATE INDEX idx_clicks_offer ON clicks(offer_id);
CREATE INDEX idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX idx_conversions_offer ON conversions(offer_id);
CREATE INDEX idx_conversions_timestamp ON conversions(timestamp);
CREATE INDEX idx_revenue_period ON revenue(period_date, offer_id);
CREATE INDEX idx_system_events_status ON system_events(status);
CREATE INDEX idx_system_events_timestamp ON system_events(timestamp);