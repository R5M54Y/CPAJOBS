-- Migration 006: Company Logo Extraction Tracking
-- Date: 2026-09-10
-- Purpose: Add metadata fields for company logo extraction from apply URLs

-- Add logo tracking fields
-- Note: company_logo field already exists from migration 001
ALTER TABLE offers ADD COLUMN company_logo_source TEXT; -- 'apply_page_jsonld' | 'apply_page_og' | 'apply_page_img' | 'apply_page_favicon' | 'manual'
ALTER TABLE offers ADD COLUMN company_logo_updated_at TIMESTAMP;

-- Create index for logo backfill queries
CREATE INDEX IF NOT EXISTS idx_offers_logo_backfill ON offers(apply_url, company_logo) WHERE apply_url IS NOT NULL;
