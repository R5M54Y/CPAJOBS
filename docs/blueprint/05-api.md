# 05-api.md - API Contract

## API Overview

Cloudflare Workers backend API designed for CPA JOBS MVP with Cloudflare D1 database integration.

## API Endpoints

### 1. GET /offers

**Description**: List all active offers with basic filtering

**Request Parameters**:
- `category` (optional): Filter by category slug
- `status` (optional): Filter by status (active/expired/draft)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response**:
```json
{
  "offers": [
    {
      "id": "uuid",
      "title": "Offer title",
      "description": "Offer description",
      "url": "https://offer.url",
      "payout": 10.00,
      "payout_type": "cpa",
      "category": {
        "id": "uuid",
        "name": "Category Name",
        "slug": "category-slug"
      },
      "source": {
        "id": "uuid",
        "name": "Source Name",
        "type": "manual"
      },
      "status": "active",
      "expires_at": "2024-12-31T23:59:59Z",
      "click_count": 100,
      "conversion_count": 10,
      "revenue": 500.00,
      "requirements": ["req1", "req2"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### 2. GET /offers/:id

**Description**: Get detailed information about a specific offer

**Response**:
```json
{
  "id": "uuid",
  "title": "Offer title",
  "description": "Full offer description",
  "url": "https://offer.url",
  "payout": 10.00,
  "payout_type": "cpa",
  "requirements": ["req1", "req2"],
  "category": {
    "id": "uuid",
    "name": "Category Name",
    "slug": "category-slug",
    "description": "Category description"
  },
  "source": {
    "id": "uuid",
    "name": "Source Name",
    "type": "manual",
    "config": {}
  },
  "status": "active",
  "expires_at": "2024-12-31T23:59:59Z",
  "click_count": 100,
  "conversion_count": 10,
  "revenue": 500.00,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "metadata": {}
}
```

### 3. GET /categories

**Description**: List all active categories

**Response**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description",
      "metadata": {}
    }
  ]
}
```

### 4. POST /track/click

**Description**: Track a click on an offer

**Request Body**:
```json
{
  "offer_id": "uuid",
  "user_id": "optional_uuid",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "referrer": "https://example.com",
  "metadata": {}
}
```

**Response**:
```json
{
  "success": true,
  "click_id": "uuid",
  "message": "Click tracked successfully"
}
```

**Idempotency**: Duplicate clicks within 5 minutes from same IP are ignored

### 5. POST /track/conversion

**Description**: Track a conversion from an offer

**Request Body**:
```json
{
  "offer_id": "uuid",
  "user_id": "optional_uuid",
  "source": "direct",
  "amount": 10.00,
  "metadata": {}
}
```

**Response**:
```json
{
  "success": true,
  "conversion_id": "uuid",
  "message": "Conversion tracked successfully"
}
```

**Idempotency**: Duplicate conversions within 10 minutes from same source are ignored

## API Security

### Rate Limiting
- Click tracking: 100 requests/minute per IP
- Conversion tracking: 10 requests/minute per IP
- Offer listing: 200 requests/minute per IP

### CORS
- Allow origins: specific domains only
- Methods: GET, POST
- Headers: Content-Type, Authorization

### Input Validation
- All UUIDs validated
- All numeric amounts validated
- URLs validated
- JSON schema validation

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input data",
  "details": ["field1 is required", "field2 must be a valid UUID"]
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## API Documentation

### Request Headers
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer *** (if required)
```

### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-Request-ID: unique-request-id
```

## API Versioning

Current version: v1

### Future Versioning Strategy
```
GET /v1/offers
GET /v2/offers (future)
```

## API Authentication

### Basic Setup
- No authentication required for public endpoints
- Admin endpoints require API key authentication
- API keys stored in Cloudflare KV

### Admin Endpoints (Future Phase)
```
GET /admin/offers
POST /admin/offers
DELETE /admin/offers/:id
GET /admin/analytics
```

## API Monitoring

### Health Check
```
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": "connected",
  "cache": "available"
}
```

## API Documentation Format

All API endpoints documented in OpenAPI/Swagger format (to be implemented in Phase 2)