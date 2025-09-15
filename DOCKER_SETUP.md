# Self-Hosted Supabase with Central Command

This setup provides a complete self-hosted Supabase instance integrated with the Central Command application, enabling authentication and portal management.

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- .NET 9.0 SDK installed (for API development)
- Visual Studio 2022 (optional, for Docker Compose integration)

### 1. Start the Services

#### Windows (PowerShell):
```powershell
.\docker-start.ps1
```

#### Linux/Mac:
```bash
chmod +x docker-start.sh
./docker-start.sh
```

#### Manual Start:
```bash
# Load environment variables
cp .env.supabase .env

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 2. Access the Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Supabase Studio | http://localhost:54323 | admin / admin |
| Supabase API | http://localhost:54321 | Use API keys |
| PostgreSQL | localhost:54322 | postgres / your-super-secret-and-long-postgres-password |
| Central Command API | http://localhost:5001 | JWT authentication |
| React App | http://localhost:5173 | Create account via UI |

### 3. Start the React Application

```bash
cd apps/web
npm install
npm run dev
```

The React app will be available at http://localhost:5173

### 4. Start the API (Optional - for development)

```bash
cd apps/api/CentralCommand.Api
dotnet run
```

The API will be available at http://localhost:5001

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│                  (localhost:5173)                        │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬─────────────────┐
        │                         │                 │
        ▼                         ▼                 ▼
┌───────────────┐      ┌──────────────────┐  ┌─────────────┐
│ Central       │      │ Supabase Kong    │  │ ASP.NET     │
│ Command API   │◄─────│ API Gateway      │  │ Core API    │
│ (Port 5001)   │      │ (Port 54321)     │  │ (Port 5001) │
└───────────────┘      └──────────────────┘  └─────────────┘
                                │
                ┌───────────────┼──────────────┐
                │               │              │
                ▼               ▼              ▼
        ┌──────────────┐ ┌──────────┐ ┌──────────────┐
        │ Supabase     │ │ Supabase │ │ Supabase     │
        │ Auth         │ │ Realtime │ │ Storage      │
        │ (Port 9999)  │ │ (Port    │ │ (Port 5000)  │
        └──────────────┘ │ 4000)    │ └──────────────┘
                         └──────────┘
                                │
                         ┌──────▼──────┐
                         │ PostgreSQL  │
                         │ Database    │
                         │ (Port 54322)│
                         └─────────────┘
```

## Features

### Authentication & Authorization
- ✅ Email/Password authentication via Supabase Auth
- ✅ JWT token-based authentication
- ✅ Row Level Security (RLS) policies
- ✅ Role-based access control

### Portal Management
- ✅ Create, Read, Update, Delete portals
- ✅ Real-time metrics updates
- ✅ Health monitoring
- ✅ Favorite portals
- ✅ Tags and metadata

### Incident Management
- ✅ Create and track incidents
- ✅ Severity levels (low, medium, high, critical)
- ✅ Status tracking (open, investigating, resolved, closed)
- ✅ Comments and internal notes

### Real-time Features
- ✅ SignalR for .NET API
- ✅ Supabase Realtime for database changes
- ✅ Live metrics updates
- ✅ Instant notifications

## Configuration

### Environment Variables

The `.env.supabase` file contains all configuration. Key variables:

```env
# Database
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password

# JWT (must be 32+ characters)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# API Keys (pre-generated for development)
ANON_KEY=eyJhbGc...  # Public key (safe for frontend)
SERVICE_ROLE_KEY=eyJhbGc...  # Secret key (backend only)

# URLs
SITE_URL=http://localhost:5173
API_EXTERNAL_URL=http://localhost:54321

# Dashboard Access
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=admin
```

### Generating New Keys

For production, generate new JWT keys:

```bash
# Generate JWT secret (32+ characters)
openssl rand -base64 32

# Generate API keys at:
# https://supabase.com/docs/guides/self-hosting#api-keys
# Use your JWT_SECRET to generate matching keys
```

## Database Schema

The database is automatically initialized with:

1. **Auth Schema** - User authentication tables
2. **Storage Schema** - File storage buckets
3. **Public Schema** - Application tables:
   - `portals` - Portal configurations
   - `portal_metrics` - Performance metrics
   - `incidents` - Incident tracking
   - `incident_comments` - Comment threads
   - `statistics` - System statistics

## Development Workflow

### 1. Making Database Changes

```sql
-- Connect to database
psql postgres://postgres:your-super-secret-and-long-postgres-password@localhost:54322/postgres

-- Make your changes
ALTER TABLE public.portals ADD COLUMN new_field TEXT;
```

### 2. Using Supabase Studio

1. Navigate to http://localhost:54323
2. Login with admin/admin
3. Use Table Editor for data management
4. Use SQL Editor for queries
5. Manage Auth users in Authentication section

### 3. Testing Authentication Flow

```javascript
// In React app
import { supabase } from '@/lib/supabase/client';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### 4. Testing Portal CRUD

```javascript
// Create portal
const { data, error } = await supabase
  .from('portals')
  .insert({
    name: 'New Portal',
    url: 'https://example.com',
    description: 'Test portal'
  });

// Read portals
const { data, error } = await supabase
  .from('portals')
  .select('*')
  .order('created_at', { ascending: false });

// Update portal
const { data, error } = await supabase
  .from('portals')
  .update({ is_favorite: true })
  .eq('id', portalId);

// Delete portal
const { data, error } = await supabase
  .from('portals')
  .delete()
  .eq('id', portalId);
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker info

# Check port conflicts
netstat -an | findstr "54321 54322 54323 5001 5173"

# View logs
docker-compose logs -f [service-name]

# Restart services
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Test connection
psql postgres://postgres:your-super-secret-and-long-postgres-password@localhost:54322/postgres

# Check database logs
docker-compose logs -f supabase-db

# Reset database
docker-compose down -v
docker-compose up -d
```

### Authentication Problems

1. Check JWT_SECRET matches between services
2. Verify ANON_KEY and SERVICE_ROLE_KEY are valid
3. Check CORS configuration in API
4. Verify Supabase URL in React app

## Visual Studio Integration

The project includes `docker-compose.dcproj` for Visual Studio integration:

1. Open `CentralCommand.sln` in Visual Studio 2022
2. Set `docker-compose` as startup project
3. Press F5 to debug with Docker Compose
4. Visual Studio will manage container lifecycle

## Production Deployment

For production deployment:

1. Generate new secure keys and passwords
2. Use environment-specific docker-compose files
3. Configure SSL/TLS certificates
4. Set up proper backup strategies
5. Implement monitoring and logging
6. Use managed PostgreSQL for better performance
7. Configure CDN for static assets

## Maintenance

### Backup Database

```bash
# Backup
docker exec supabase-db pg_dump -U postgres postgres > backup.sql

# Restore
docker exec -i supabase-db psql -U postgres postgres < backup.sql
```

### Update Services

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f supabase-auth

# Last 100 lines
docker-compose logs --tail=100 supabase-db
```

## Stop Services

```bash
# Stop all services (preserves data)
docker-compose down

# Stop and remove all data
docker-compose down -v

# Remove all containers and images
docker-compose down --rmi all
```

## Support

For issues or questions:
1. Check service logs: `docker-compose logs -f [service]`
2. Verify environment variables in `.env.supabase`
3. Ensure all ports are available
4. Check Docker Desktop resources (memory/CPU)

## License

This setup uses open-source Supabase components under the Apache 2.0 License.