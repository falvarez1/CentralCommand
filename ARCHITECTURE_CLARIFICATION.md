# Architecture Clarification - Central Command

## Current Situation (Incorrect)

We've been implementing production features in the wrong project:

- **CentralCommand.MockApi** - Currently has:
  - ✅ Entity Framework Core with PostgreSQL
  - ✅ ASP.NET Core Identity
  - ✅ JWT Authentication
  - ✅ Security middleware
  - ✅ CSRF protection
  - ✅ Rate limiting
  - ❌ Should only have: Simple in-memory mock data with Bogus

- **CentralCommand.Api** - Currently has:
  - ❌ Missing .csproj file (now created)
  - ❌ No authentication implementation
  - ❌ No database integration
  - ✅ Should have: All production features

## Correct Architecture

### CentralCommand.MockApi (Port 5000)
**Purpose**: Simple mock API for frontend development
- In-memory data using Bogus
- Basic CRUD endpoints
- SignalR for real-time updates
- No authentication required
- No database
- Quick to start, zero configuration

### CentralCommand.Api (Port 5001)
**Purpose**: Production API with full features
- Entity Framework Core with PostgreSQL
- ASP.NET Core Identity
- JWT Authentication with HttpOnly cookies
- Role-based authorization
- CSRF protection
- Rate limiting
- Security headers
- Audit logging
- Redis caching
- Full business logic

## Migration Plan

### Option 1: Move Authentication to Production API (Recommended)
1. Keep MockApi simple (revert to basic mock functionality)
2. Move all authentication code to CentralCommand.Api
3. Frontend can switch between APIs via environment variable

### Option 2: Keep Current Implementation
1. Rename CentralCommand.MockApi to CentralCommand.Api
2. Create new simple MockApi project
3. Update all references

### Option 3: Dual Purpose MockApi
1. Keep MockApi with all features
2. Add feature flags to disable auth in development
3. Less clean but functional

## Immediate Actions Needed

1. **Decide on migration strategy**
2. **Fix CentralCommand.Api project** (missing packages, no implementation)
3. **Update frontend to use correct API endpoint**
4. **Update documentation to reflect correct architecture**

## Impact on Current Work

- Phase 1 authentication was implemented in the wrong project
- Need to either move it or rename projects
- Frontend needs to know which API to connect to

## Recommendation

**Use Option 1**: Keep separation of concerns clean
- MockApi remains simple for easy testing
- Production API has all security features
- Frontend can easily switch between them

This maintains the original architectural intent and makes development easier.