-- Migration 002: Add workplace_type column for Ashby job data
-- Date: 2026-09-08
-- Purpose: Support Ashby adapter field mapping

ALTER TABLE offers ADD COLUMN workplace_type TEXT;
