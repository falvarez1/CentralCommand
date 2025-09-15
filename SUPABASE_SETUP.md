# Supabase Setup Guide

## Overview

Central Command uses Supabase for authentication and database services. This guide covers both local development (using Docker) and cloud setup.

## Local Development with Docker

### Prerequisites
- Docker and Docker Compose installed
- Git
- Node.js 18+
- .NET 8.0 or 9.0 SDK

### Quick Start

1. **Start Supabase locally:**
```bash
# Start Supabase services
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
# Check status
docker-compose ps
```

2. **Access Supabase Studio:**
- URL: http://localhost:54323
- Default credentials are shown in the terminal after startup

3. **Configure environment variables:**

Create `.env.supabase` file:
```env
# Supabase Local Development
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key-from-docker-output
SUPABASE_SERVICE_KEY=your-service-key-from-docker-output
SUPABASE_JWT_SECRET=your-jwt-secret-from-docker-output
```

For React app (`apps/web/.env`):
```env
# Enable Supabase
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Docker Services

The docker-compose.yml includes:
- **PostgreSQL** (port 54322): Main database
- **Supabase Studio** (port 54323): Database management UI
- **Kong API Gateway** (port 54321): API endpoint
- **GoTrue** (port 54324): Authentication service
- **Realtime** (port 54327): WebSocket connections
- **Storage** (port 54325): File storage
- **Meta** (port 54326): Service metadata
- **Edge Functions** (port 54328): Serverless functions

### Common Issues and Solutions

#### Issue: Authentication failures
**Solution:**
- Check that all services are running: `docker-compose ps`
- Verify environment variables match docker output
- Restart services: `docker-compose restart`

#### Issue: Database connection errors
**Solution:**
- Ensure PostgreSQL is running on port 54322
- Check logs: `docker-compose logs db`
- Verify connection string in .env

#### Issue: CORS errors
**Solution:**
- Add your frontend URL to Supabase allowed origins
- For local dev, ensure using correct ports

## Cloud Setup (Production)

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Choose a region close to your users
4. Set a strong database password

### 2. Configure Authentication

In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Enable desired providers:
   - Email/Password
   - Magic Link
   - OAuth (Google, GitHub, etc.)

3. Configure **Authentication** → **URL Configuration**:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: Add your app URLs

### 3. Set Up Database

1. Go to **SQL Editor**
2. Run migrations for your schema:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create portals table
CREATE TABLE portals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'operational',
  is_favorite BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES auth.users(id),
  team_id UUID,
  metrics JSONB
);

-- Enable RLS for portals
ALTER TABLE portals ENABLE ROW LEVEL SECURITY;

-- Policies for portals
CREATE POLICY "Portals are viewable by authenticated users" ON portals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create portals" ON portals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own portals" ON portals
  FOR UPDATE USING (auth.uid() = owner_id);
```

### 4. Configure Row Level Security (RLS)

Ensure RLS is enabled for all tables containing user data:

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 5. Get API Keys

From **Settings** → **API**:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Public key for client-side
- `SUPABASE_SERVICE_KEY`: Secret key for server-side (keep secure!)

### 6. Environment Variables (Production)

For .NET API (`apps/api/CentralCommand.Api/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

For React App (`apps/web/.env.production`):
```env
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Authentication Flow

### 1. User Registration
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'user'
    }
  }
});
```

### 2. User Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### 3. OAuth Login
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});
```

### 4. Magic Link
```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com'
});
```

### 5. Session Management
```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session);
});

// Sign out
await supabase.auth.signOut();
```

## Security Best Practices

1. **Never expose service keys**: Only use in server-side code
2. **Enable RLS**: Always use Row Level Security for data access
3. **Validate JWTs**: Verify tokens on the server
4. **Use HTTPS**: Always use SSL in production
5. **Rotate keys**: Regularly rotate API keys
6. **Monitor usage**: Check Supabase dashboard for unusual activity
7. **Backup data**: Regular database backups

## Monitoring and Debugging

### Check Service Health
```bash
# Local development
docker-compose ps
docker-compose logs [service-name]

# Production
# Check Supabase Dashboard → Reports
```

### Debug Authentication Issues
1. Check Supabase Dashboard → Authentication → Logs
2. Verify JWT expiration settings
3. Check browser console for errors
4. Verify CORS settings

### Database Queries
Use Supabase SQL Editor or connect with any PostgreSQL client:
```bash
psql "postgresql://postgres:your-password@localhost:54322/postgres"
```

## Migration from ASP.NET Core Identity

If migrating from ASP.NET Core Identity:

1. Export user data from Identity tables
2. Import into Supabase auth.users
3. Update password hashes (Supabase uses bcrypt)
4. Map roles to Supabase custom claims
5. Update API to validate Supabase JWTs
6. Update frontend to use Supabase client

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Local Development](https://supabase.com/docs/guides/local-development)
- [Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)