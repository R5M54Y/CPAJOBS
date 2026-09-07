# 06-tracking-revenue.md - Click & Conversion Tracking & Revenue

## Overview

Revenue tracking system for CPA JOBS MVP. Focus on simplicity and deterministic processing without requiring AI.

## Tracking Flow

### Click Tracking (POST /track/click)

1. **Receive click event** from frontend
2. **Validate**: offer_id exists, IP format, user_agent present
3. **Check idempotency**: Query clicks table for same offer_id + ip_address + timestamp ± 5 min
4. **Insert**: If not duplicate, INSERT INTO clicks
5. **Update offer**: Increment click_count on offers table
6. **Return**: Success/failure response
7. **Redirect**: User to offer URL

**Idempotency Key**: `offer_id + ip_address + floor(timestamp / 300)` (5-minute buckets)

### Conversion Tracking (POST /track/conversion)

1. **Receive conversion event** from frontend
2. **Validate**: offer_id exists, amount is valid number
3. **Check idempotency**: Query conversions table for same offer_id + source + timestamp ± 10 min
4. **Insert**: If not duplicate, INSERT INTO conversions
5. **Update offer**: Increment conversion_count, add amount to revenue on offers table
6. **Insert revenue**: INSERT INTO revenue table (daily aggregation)
7. **Return**: Success/failure response

**Idempotency Key**: `offer_id + source + floor(timestamp / 600)` (10-minute buckets)

### Revenue Aggregation

1. **Daily aggregation**: Cron job runs once per day
2. **Process conversions**: Sum all confirmed conversions per offer_id per day
3. **Upsert revenue**: INSERT INTO revenue or UPDATE existing record
4. **Mark processed**: Set conversion status to confirmed
5. **Reporting**: Revenue data available for admin dashboard

## Daily Revenue Cron Job

```text
Trigger: Cloudflare Cron (every 24 hours)
Process:
  1. SELECT SUM(amount) FROM conversions 
     WHERE status = 'confirmed' 
     AND DATE(timestamp) = TODAY()
     GROUP BY offer_id
  2. For each offer:
     - INSERT INTO revenue (offer_id, source, amount, period_date = TODAY())
     - Or UPDATE existing revenue record
  3. UPDATE offers SET revenue = revenue + new_amount WHERE offer_id = ?
  4. Mark processed conversions
Failure Handling:
  - Rollback transaction on error
  - Retry on next cron run
  - Log failed records to system_events
Retry Behavior:
  - Exponential backoff: 1min, 5min, 15min
  - Max 3 retry attempts
  - If still failing: alert via system_events
Idempotency:
  - Daily aggregation is naturally idempotent
  - Same period_date processed only once per day
  - Revenue amounts are additive (SUM)
```

## Revenue Reporting API

### GET /admin/revenue

**Query Parameters:**
- `period`: day/week/month (default: day)
- `start_date`: ISO date string
- `end_date`: ISO date string
- `offer_id`: Optional filter

**Response:**
```json
{
  "revenue": [
    {
      "offer_id": "uuid",
      "offer_title": "Offer Title",
      "source": "network_name",
      "amount": 500.00,
      "period_date": "2024-01-15",
      "conversion_count": 25
    }
  ],
  "totals": {
    "gross": 5000.00,
    "net": 4500.00,
    "conversions": 250
  }
}
```

## Click & Conversion Summary

| Metric | Table | Description |
|--------|-------|-------------|
| click_count | offers | Total clicks per offer |
| conversion_count | offers | Total conversions per offer |
| revenue | offers | Total revenue per offer |
| SUM(amount) | revenue | Daily revenue aggregation |
| COUNT(*) | conversions | Total conversions |
| AVG(amount) | conversions | Average conversion value |