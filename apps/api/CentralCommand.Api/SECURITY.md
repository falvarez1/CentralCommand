# Security Configuration Guide

## Overview

This document describes the security improvements implemented in the Central Command API to address critical security vulnerabilities.

## Security Improvements Implemented

### 1. Environment-Based Configuration

**Issue Fixed**: Hardcoded secrets in configuration files

**Solution**:
- All sensitive configuration moved to environment variables
- JWT secrets and database credentials are no longer stored in `appsettings.json`
- Added `.env.example` file documenting required environment variables

**Configuration Priority**:
1. Environment variables (highest priority)
2. User secrets (development only)
3. Configuration files (fallback)

### 2. Security Headers Middleware

**Issue Fixed**: Missing security headers exposing application to various attacks

**Headers Added**:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection for older browsers
- `Content-Security-Policy` - Prevents XSS and injection attacks
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features
- `Strict-Transport-Security` (HSTS) - Forces HTTPS in production

### 3. Rate Limiting

**Issue Fixed**: No protection against brute force attacks

**Features**:
- General rate limiting for all endpoints
- Stricter limits for authentication endpoints
- Exponential backoff for repeated login failures
- IP-based and user-based tracking
- Configurable limits via settings

**Default Limits**:
- General: 10 requests per minute
- Auth endpoints: 5 attempts per minute
- Account lockout: 15 minutes after 5 failed attempts

### 4. CSRF Protection

**Issue Fixed**: No protection against Cross-Site Request Forgery attacks

**Implementation**:
- CSRF tokens generated for authenticated users
- Tokens validated on state-changing operations
- `ValidateCsrfToken` attribute for protected endpoints
- Tokens included in auth responses
- Automatic token invalidation on logout

### 5. JWT Security Enhancements

**Issue Fixed**: Weak token configuration

**Improvements**:
- Minimum 32-character secret requirement
- Environment-based secret configuration
- Reduced access token lifetime to 15 minutes
- `RequireHttpsMetadata` enabled in production
- Token validation with zero clock skew

### 6. Database Security

**Issue Fixed**: Hardcoded database credentials

**Solution**:
- Connection string built from environment variables
- Support for `DATABASE_CONNECTION_STRING` or individual components
- Secure fallback mechanism for development

## Environment Variables

### Required for Production

```bash
# Database
DATABASE_CONNECTION_STRING=<full_connection_string>
# OR individual components:
DATABASE_HOST=<host>
DATABASE_PORT=<port>
DATABASE_NAME=<database>
DATABASE_USER=<username>
DATABASE_PASSWORD=<password>

# JWT Configuration
JWT_SECRET=<minimum_32_characters>
JWT_ISSUER=<issuer>
JWT_AUDIENCE=<audience>

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Optional Security Settings

```bash
# Rate Limiting
ENABLE_RATE_LIMITING=true
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
RATE_LIMIT_WINDOW_MINUTES=1
RATE_LIMIT_MAX_REQUESTS=10

# Security Headers
ENABLE_SECURITY_HEADERS=true
REQUIRE_HTTPS=true

# Session Management
SESSION_TIMEOUT_MINUTES=60
MAX_SESSION_LIFETIME_HOURS=24

# HSTS (Production)
HSTS_MAX_AGE_DAYS=365
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true
```

## Development Configuration

For development, a less restrictive configuration is provided in `appsettings.Development.json`:
- HTTPS not required
- Higher rate limits
- Longer token lifetimes
- CORS allows all localhost ports

**Note**: Development settings should NEVER be used in production.

## Security Checklist

Before deploying to production:

- [ ] Set strong JWT_SECRET (minimum 32 characters, cryptographically random)
- [ ] Configure database credentials via environment variables
- [ ] Enable HTTPS and configure HSTS
- [ ] Set appropriate CORS origins (no wildcards)
- [ ] Review and adjust rate limiting settings
- [ ] Enable all security headers
- [ ] Configure proper session timeouts
- [ ] Set up monitoring and alerting for security events
- [ ] Review audit logs regularly
- [ ] Keep dependencies updated

## Testing Security Features

### Rate Limiting Test
```bash
# Test rate limiting (should block after configured limit)
for i in {1..20}; do curl -X POST http://localhost:5000/api/auth/login; done
```

### CSRF Token Test
```bash
# Get CSRF token with login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"test","password":"test"}'

# Use token in protected endpoint
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "X-CSRF-Token: <csrf_token>"
```

### Security Headers Test
```bash
# Check response headers
curl -I http://localhost:5000
```

## Monitoring and Logging

The application logs security-relevant events:
- Failed login attempts
- Rate limit violations
- CSRF token failures
- JWT validation failures
- Account lockouts

Monitor these logs for potential security incidents.

## Additional Recommendations

1. **Use a Web Application Firewall (WAF)** in production
2. **Implement IP allowlisting** for admin endpoints
3. **Use certificate pinning** for mobile apps
4. **Regular security audits** and penetration testing
5. **Implement anomaly detection** for unusual access patterns
6. **Use a secrets management service** (Azure Key Vault, AWS Secrets Manager)
7. **Enable database encryption** at rest and in transit
8. **Implement API versioning** for security updates
9. **Use OAuth2/OpenID Connect** for third-party integrations
10. **Regular dependency updates** and vulnerability scanning