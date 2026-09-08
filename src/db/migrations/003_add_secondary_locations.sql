-- Migration 003: Add secondary_locations column for Ashby job data
-- Date: 2026-09-08
-- Purpose: Support Ashby adapter secondary locations field

ALTER TABLE offers ADD COLUMN secondary_locations TEXT;
