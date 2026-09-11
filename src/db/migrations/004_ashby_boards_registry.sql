-- Migration 004: Ashby Multi-Board Registry
-- Date: 2026-09-10
-- Purpose: Support aggregation from multiple Ashby public job boards

-- Create ashby_boards registry table
CREATE TABLE IF NOT EXISTS ashby_boards (
    board_name TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    source_id TEXT NOT NULL,
    discovery_method TEXT NOT NULL DEFAULT 'manual',
    status TEXT NOT NULL DEFAULT 'active',
    job_count INTEGER DEFAULT 0,
    last_checked TIMESTAMP,
    last_success_at TIMESTAMP,
    last_error TEXT,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ashby_boards_status ON ashby_boards(status);
CREATE INDEX IF NOT EXISTS idx_ashby_boards_source_id ON ashby_boards(source_id);
CREATE INDEX IF NOT EXISTS idx_ashby_boards_created ON ashby_boards(created_at);

-- Seed initial verified boards from Phase 1 POC
INSERT OR IGNORE INTO ashby_boards (board_name, company_name, source_id, discovery_method, status)
VALUES
    ('notion', 'Notion', 'ashby-notion', 'poc_verified', 'active'),
    ('openai', 'OpenAI', 'ashby-openai', 'poc_verified', 'active'),
    ('ramp', 'Ramp', 'ashby-ramp', 'poc_verified', 'active'),
    ('replit', 'Replit', 'ashby-replit', 'poc_verified', 'active'),
    ('cursor', 'Cursor', 'ashby-cursor', 'poc_verified', 'active'),
    ('modal', 'Modal', 'ashby-modal', 'poc_verified', 'active'),
    ('watershed', 'Watershed', 'ashby-watershed', 'poc_verified', 'active'),
    ('anyscale', 'Anyscale', 'ashby-anyscale', 'poc_verified', 'active'),
    ('zapier', 'Zapier', 'ashby-zapier', 'poc_verified', 'active'),
    ('supabase', 'Supabase', 'ashby-supabase', 'poc_verified', 'active'),
    ('miro', 'Miro', 'ashby-miro', 'poc_verified', 'active'),
    ('linear', 'Linear', 'ashby-linear', 'poc_verified', 'active'),
    ('posthog', 'PostHog', 'ashby-posthog', 'poc_verified', 'active'),
    ('mux', 'Mux', 'ashby-mux', 'poc_verified', 'active'),
    ('runway', 'Runway', 'ashby-runway', 'poc_verified', 'active');
