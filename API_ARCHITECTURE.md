# Central Command API Architecture

## Overview

Central Command has two separate API projects serving different purposes:

## 1. CentralCommand.MockApi (Port 5000)
**Purpose**: Simple mock API for frontend development

### Features:
- ✅ In-memory data using Bogus library
- ✅ No authentication required
- ✅ No database setup needed
- ✅ SignalR for real-time updates
- ✅ Full CRUD operations with mock data
- ✅ Automatic metrics updates every 30 seconds
- ✅ Swagger UI at http://localhost:5000/swagger

### Use Cases:
- Frontend development without backend dependencies
- UI/UX testing with realistic data
- Quick prototyping
- Demo environments
- Offline development

### How to Run:
```bash
cd apps/api/CentralCommand.MockApi
dotnet run
```

## 2. CentralCommand.Api (Port 5001)
**Purpose**: Production API with full security and persistence

### Features:
- ✅ PostgreSQL database with Entity Framework Core
- ✅ ASP.NET Core Identity for user management
- ✅ JWT authentication with HttpOnly cookies
- ✅ Role-based authorization (Admin, Manager, User, etc.)
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Security headers middleware
- ✅ Token blacklist for logout
- ✅ Audit logging
- ✅ Session management
- ✅ Password reset functionality
- ✅ Email verification
- ✅ SignalR with authentication

### Prerequisites:
- PostgreSQL installed and running
- .env file with JWT_SECRET and database credentials

### How to Run:
```bash
cd apps/api/CentralCommand.Api

# Create .env file from example
cp .env.example .env

# Edit .env with your settings (JWT secret, database connection)
# Generate JWT secret: openssl rand -base64 32

# Run the API (migrations apply automatically in development)
dotnet run
```

## Frontend Configuration

The frontend can switch between APIs by updating the `.env` file:

### For Development (Mock API):
```env
VITE_API_BASE_URL=http://localhost:5000
```

### For Production (Full API):
```env
VITE_API_BASE_URL=http://localhost:5001
```

## API Comparison

| Feature | MockApi (5000) | Production Api (5001) |
|---------|---------------|----------------------|
| Authentication | ❌ None | ✅ JWT with HttpOnly cookies |
| Database | ❌ In-memory | ✅ PostgreSQL |
| User Management | ❌ None | ✅ Full RBAC |
| Data Persistence | ❌ Lost on restart | ✅ Persisted |
| Security | ❌ Basic CORS | ✅ Full security stack |
| Setup Time | ✅ Instant | ⚠️ Requires PostgreSQL |
| Use Case | Development | Production |

## Architecture Decisions

### Why Two APIs?

1. **Development Speed**: Frontend developers can work without backend dependencies
2. **Separation of Concerns**: Mock API stays simple, Production API has all features
3. **Testing**: Easy to test UI with consistent mock data
4. **Demo/POC**: Quick demos without infrastructure setup
5. **Parallel Development**: Frontend and backend can develop independently

### Migration Path

When ready to use authentication:
1. Switch frontend to use port 5001
2. Ensure PostgreSQL is running
3. Configure .env with credentials
4. Run migrations (automatic in dev)
5. Register a user account
6. Login and test authenticated features

## Endpoints

Both APIs share the same endpoint structure:

- `/api/v1/portals` - Portal management
- `/api/v1/incidents` - Incident tracking
- `/api/v1/statistics` - System statistics
- `/hubs/metrics` - SignalR real-time updates

Production API adds:
- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management (admin)
- `/api/teams/*` - Team management

## Development Workflow

### Frontend Development:
1. Use MockApi (5000) for rapid development
2. No auth setup required
3. Consistent test data

### Integration Testing:
1. Switch to Production API (5001)
2. Test auth flows
3. Verify data persistence
4. Test security features

### Production Deployment:
1. Use Production API only
2. Configure proper secrets
3. Set up PostgreSQL
4. Enable all security features

## Troubleshooting

### MockApi Issues:
- Ensure port 5000 is free
- Check CORS settings match frontend port

### Production API Issues:
- Verify PostgreSQL is running
- Check .env file exists with valid JWT_SECRET
- Ensure database connection string is correct
- Run migrations if needed: `dotnet ef database update`

## Summary

This dual-API architecture provides the best of both worlds:
- **Fast development** with the Mock API
- **Production-ready security** with the Production API
- **Easy switching** between environments
- **Clear separation** of concerns