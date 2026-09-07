# 08-security.md - Security

## Overview

Security considerations for CPA JOBS MVP to protect the system, data, and users while maintaining zero-cost operation.

## Security Architecture

### 1. Secrets Management

**Cloudflare KV + GitHub Secrets**
- API keys stored in Cloudflare KV
- GitHub Actions use repository secrets
- Environment-specific secrets (development/production)
- No hardcoded secrets in source code

### 2. Authentication & Authorization

**API Authentication**
- Admin endpoints protected by API keys
- Keys stored in Cloudflare KV
- Rate limiting by IP and API key
- No user authentication required for public endpoints

**Admin Access**
- API key-based authentication
- Role-based access control (admin/editor/viewer)
- IP whitelist optional
- Logs all admin actions

### 3. Input Validation

**Request Validation**
- All API endpoints validate request bodies against schemas
- UUID validation
- URL validation
- Amount validation (numeric, positive)
- Content type enforcement

**SQL Injection Prevention**
- Use parameterized queries (Cloudflare D1 supports prepared statements)
- Never concatenate user input into SQL
- Use ORM or query builder patterns

### 4. Rate Limiting

**API Rate Limits**
- Click tracking: 100 requests/minute per IP
- Conversion tracking: 10 requests/minute per IP
- Offer listing: 200 requests/minute per IP
- Admin endpoints: 30 requests/minute per API key

**Implementation**
- Cloudflare Workers middleware for rate limiting
- Redis/KV store for tracking request counts
- Exponential backoff for exceeded limits

### 5. Webhook Validation

**Webhook Security**
- HMAC signature verification for external webhooks
- Timestamp validation (prevent replay attacks)
- IP allowlisting for webhook sources

### 6. Replay Protection

**Click Tracking Replay**
- Idempotency key validation (5-minute windows)
- Timestamp validation
- Reject duplicate clicks from same IP

**Conversion Tracking Replay**
- Idempotency key validation (10-minute windows)
- Source validation
- Reject duplicate conversions

### 7. CORS Configuration

**CORS Policy**
- Restrict to specific domains only
- Allow methods: GET, POST
- Allow headers: Content-Type, Authorization
- Credentials not supported for security

### 8. Logging

**Audit Logging**
- All critical actions logged to system_events table
- Log level: INFO for normal operations, ERROR for failures
- Include request ID for traceability
- Sanitize sensitive data

**Security Events**
- Failed authentication attempts
- Rate limit violations
- Invalid requests
- Database errors

### 9. Environment Separation

**Development vs Production**
- Different KV stores for environments
- Environment-specific GitHub secrets
- Feature flags for controlled rollout
- Separate monitoring and alerting

### 10. Error Handling

**Secure Error Messages**
- Generic error messages for production
- Detailed error messages only in development
- Never expose stack traces to users
- Log errors internally for debugging

## Security Testing

### Penetration Testing
- API endpoint security
- Rate limiting bypass attempts
- Authentication bypass attempts
- SQL injection attempts

### Security Auditing
- Code review for security issues
- Dependency vulnerability scanning
- Configuration security review
- Access control validation

## Security Monitoring

### Alerting
- Unusual activity detection
- Rate limit threshold breaches
- Failed authentication patterns
- Database connectivity issues

### Incident Response
- 24/7 monitoring of security events
- Automated ticket creation for critical events
- Regular security reviews
- Update security controls as needed