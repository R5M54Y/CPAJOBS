-- Migration 001: Expand offers table for complete job data
-- Date: 2026-09-07
-- Purpose: Store full job information from job sources

-- Add new columns to offers table
ALTER TABLE offers ADD COLUMN company TEXT;
ALTER TABLE offers ADD COLUMN company_domain TEXT;
ALTER TABLE offers ADD COLUMN company_logo TEXT;

ALTER TABLE offers ADD COLUMN location_city TEXT;
ALTER TABLE offers ADD COLUMN location_state TEXT;
ALTER TABLE offers ADD COLUMN location_country TEXT;
ALTER TABLE offers ADD COLUMN location_country_code TEXT;
ALTER TABLE offers ADD COLUMN remote BOOLEAN DEFAULT FALSE;

ALTER TABLE offers ADD COLUMN employment_type TEXT;
ALTER TABLE offers ADD COLUMN experience TEXT;
ALTER TABLE offers ADD COLUMN skills TEXT; -- JSON array stored as TEXT

ALTER TABLE offers ADD COLUMN salary_min DECIMAL(15,2);
ALTER TABLE offers ADD COLUMN salary_max DECIMAL(15,2);
ALTER TABLE offers ADD COLUMN salary_currency TEXT;
ALTER TABLE offers ADD COLUMN salary_period TEXT; -- 'month', 'year', 'hour'
ALTER TABLE offers ADD COLUMN salary_display TEXT; -- Original formatted string

ALTER TABLE offers ADD COLUMN description_html TEXT; -- Full HTML description
ALTER TABLE offers ADD COLUMN apply_url TEXT; -- Separate apply URL

ALTER TABLE offers ADD COLUMN external_id TEXT; -- Source's original job ID
ALTER TABLE offers ADD COLUMN date_posted TIMESTAMP;
ALTER TABLE offers ADD COLUMN valid_through TIMESTAMP;

ALTER TABLE offers ADD COLUMN source_raw TEXT; -- JSON-LD or raw source data

-- Add structured job detail sections
ALTER TABLE offers ADD COLUMN responsibilities TEXT; -- Job responsibilities / duties
ALTER TABLE offers ADD COLUMN qualifications TEXT; -- Required qualifications
ALTER TABLE offers ADD COLUMN preferred_qualifications TEXT; -- Preferred qualifications
ALTER TABLE offers ADD COLUMN benefits TEXT; -- Job benefits (JSON array or text)
ALTER TABLE offers ADD COLUMN education TEXT; -- Education requirements

-- Create index on external_id for deduplication
CREATE INDEX IF NOT EXISTS idx_offers_external_id ON offers(external_id, source_id);
CREATE INDEX IF NOT EXISTS idx_offers_url_source ON offers(url, source_id);
CREATE INDEX IF NOT EXISTS idx_offers_date_posted ON offers(date_posted);
