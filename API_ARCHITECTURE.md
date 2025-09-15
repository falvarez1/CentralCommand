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

### Current Status: 🚧 Phase 1 Complete
- ✅ Authentication system implemented with Supabase
- ✅ Mock data removed (clean architecture)
- ⏳ Full database integration pending (Phase 2)

### Features:
- ✅ Supabase Authentication (replaces ASP.NET Core Identity)
- ✅ PostgreSQL database via Supabase
- ✅ JWT authentication handled by Supabase
- ✅ Row Level Security (RLS) for data access control
- ✅ Built-in user management via Supabase Dashboard
- ✅ OAuth providers support (Google, GitHub, etc.)
- ✅ Magic link authentication
- ✅ Rate limiting via Supabase
- ✅ Security headers middleware
- ✅ Session management via Supabase
- ✅ Password reset via Supabase Auth
- ✅ Email verification via Supabase Auth
- ✅ SignalR with Supabase JWT validation

### Prerequisites:
- Supabase project configured
- .env file with Supabase URL and keys

### How to Run:
```bash
cd apps/api/CentralCommand.Api

# Create .env file from example
cp .env.example .env

# Edit .env with your Supabase settings:
# - SUPABASE_URL: Your Supabase project URL
# - SUPABASE_ANON_KEY: Your Supabase anon/public key
# - SUPABASE_SERVICE_KEY: Your Supabase service role key (for admin operations)

# Run the API
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
| Authentication | ❌ None | ✅ Supabase Auth (JWT) |
| Database | ❌ In-memory | ✅ Supabase PostgreSQL |
| User Management | ❌ None | ✅ Supabase Auth + RLS |
| Data Persistence | ❌ Lost on restart | ✅ Persisted |
| Security | ❌ Basic CORS | ✅ Supabase RLS + API security |
| Setup Time | ✅ Instant | ⚠️ Requires Supabase setup |
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
1. Create a Supabase project at https://supabase.com
2. Configure .env with Supabase credentials
3. Switch frontend to use port 5001
4. Enable Supabase authentication in frontend (.env)
5. Register/login via Supabase Auth UI
6. Test authenticated features with Supabase JWT

## Endpoints

Both APIs share the same endpoint structure:

- `/api/v1/portals` - Portal management
- `/api/v1/incidents` - Incident tracking
- `/api/v1/statistics` - System statistics
- `/hubs/metrics` - SignalR real-time updates

Production API adds:
- Supabase Auth handles authentication (no custom auth endpoints needed)
- User management via Supabase Dashboard
- `/api/teams/*` - Team management (with RLS)

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
- Verify Supabase project is active
- Check .env file has valid Supabase URL and keys
- Ensure Supabase RLS policies are configured
- Check Supabase Auth settings in dashboard
- Verify CORS settings in Supabase project

## Summary

This dual-API architecture provides the best of both worlds:
- **Fast development** with the Mock API
- **Production-ready security** with the Production API
- **Easy switching** between environments
- **Clear separation** of concerns