# Supabase Cloud Quick Setup Guide

## Step 1: Create Your Supabase Cloud Project (5 minutes)

1. **Go to Supabase Cloud Dashboard**
   - Navigate to: https://supabase.com
   - Click "Start your project" or "Sign In"

2. **Sign Up / Sign In**
   - Use GitHub, Google, or email to create an account
   - Verify your email if using email signup

3. **Create New Project**
   - Click "New Project"
   - Fill in:
     - **Project Name**: `central-command` (or any name you prefer)
     - **Database Password**: Choose a strong password (you'll need this later)
     - **Region**: Select the closest region to you for best performance
     - **Pricing Plan**: Choose "Free" (perfect for development)
   - Click "Create new project"
   - Wait ~2 minutes for provisioning

4. **Get Your Project Credentials**
   Once your project is ready, you'll see the dashboard. Go to:
   - **Settings** (gear icon in sidebar) → **API**
   - You'll see:
     - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
     - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this secret!)

## Step 2: Configure Your .NET API (2 minutes)

### Update your API environment variables

**File: `apps/api/CentralCommand.Api/.env`**
```env
# Supabase Cloud Configuration
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[your-anon-key]
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[your-service-key]
SUPABASE_JWT_SECRET=[your-jwt-secret]

# Database Connection (optional - for Entity Framework)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Update appsettings.json

**File: `apps/api/CentralCommand.Api/appsettings.json`**
```json
{
  "Supabase": {
    "Url": "${SUPABASE_URL}",
    "AnonKey": "${SUPABASE_ANON_KEY}",
    "ServiceKey": "${SUPABASE_SERVICE_KEY}",
    "JwtSecret": "${SUPABASE_JWT_SECRET}"
  },
  "ConnectionStrings": {
    "DefaultConnection": "${DATABASE_URL}"
  }
}
```

## Step 3: Configure Your React App (2 minutes)

### Update React environment variables

**File: `apps/web/.env`**
```env
# Supabase Cloud Configuration
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[your-anon-key]

# API Configuration
VITE_API_URL=http://localhost:5001
```

## Step 4: Initialize Your Database (3 minutes)

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the sidebar
3. Create your initial tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create portals table
CREATE TABLE public.portals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT CHECK (status IN ('online', 'offline', 'degraded')) DEFAULT 'online',
    health_score INTEGER DEFAULT 100,
    last_check TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incidents table
CREATE TABLE public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('critical', 'major', 'minor')) DEFAULT 'minor',
    status TEXT CHECK (status IN ('open', 'investigating', 'resolved')) DEFAULT 'open',
    portal_id UUID REFERENCES public.portals(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create statistics table
CREATE TABLE public.statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    portal_id UUID REFERENCES public.portals(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Allow authenticated users to read all data)
CREATE POLICY "Public read access" ON public.portals
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert" ON public.portals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public read access" ON public.incidents
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage incidents" ON public.incidents
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public read access" ON public.statistics
    FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_portals_status ON public.portals(status);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_portal_id ON public.incidents(portal_id);
CREATE INDEX idx_statistics_portal_id ON public.statistics(portal_id);
CREATE INDEX idx_statistics_timestamp ON public.statistics(timestamp);
```

4. Click **Run** to execute the SQL

### Option B: Using Entity Framework Migrations

```bash
cd apps/api/CentralCommand.Api

# Update database with existing migrations
dotnet ef database update

# Or create a new migration if needed
dotnet ef migrations add InitialSupabaseCloud
dotnet ef database update
```

## Step 5: Enable Authentication (2 minutes)

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable the providers you want:
   - **Email**: Already enabled by default
   - **Google**: Add your OAuth credentials
   - **GitHub**: Add your OAuth credentials
   - **Microsoft**: Add your Azure AD credentials

3. Configure **Authentication Settings**:
   - Go to **Authentication** → **URL Configuration**
   - Set your redirect URLs:
     ```
     http://localhost:5173/auth/callback
     http://localhost:5001/auth/callback
     https://your-production-domain.com/auth/callback
     ```

## Step 6: Test Your Setup (2 minutes)

### Start your API:
```bash
cd apps/api/CentralCommand.Api
dotnet run
# API will be running at http://localhost:5001
# Swagger UI at http://localhost:5001/swagger
```

### Start your React app:
```bash
cd apps/web
npm install
npm run dev
# App will be running at http://localhost:5173
```

### Test Authentication:
1. Open http://localhost:5173
2. Try to sign up with email
3. Check your email for the confirmation link
4. Sign in and verify you're authenticated

## Step 7: Quick Verification Checklist

- [ ] Supabase project is created and running
- [ ] Environment variables are set in both API and React app
- [ ] Database tables are created
- [ ] Row Level Security is enabled
- [ ] Authentication providers are configured
- [ ] API starts without errors
- [ ] React app connects to Supabase
- [ ] You can sign up and sign in

## Troubleshooting

### Common Issues and Solutions:

1. **"Invalid API key" error**
   - Double-check your anon key in the .env file
   - Make sure there are no extra spaces or quotes

2. **"Connection refused" to database**
   - Verify your database password is correct
   - Check if your IP is allowed (Supabase Dashboard → Settings → Database)

3. **CORS errors**
   - Add your local URLs to Supabase allowed origins
   - Dashboard → Authentication → URL Configuration

4. **Email not sending**
   - Check spam folder
   - Verify SMTP settings in Supabase Dashboard → Authentication → Email Templates

5. **JWT verification failed**
   - Make sure your JWT secret matches between Supabase and your API
   - Find it in Dashboard → Settings → API → JWT Secret

## Next Steps

1. **Set up Realtime**:
   ```sql
   -- Enable realtime for tables
   ALTER PUBLICATION supabase_realtime ADD TABLE public.portals;
   ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
   ```

2. **Add Storage Bucket** (if needed):
   - Dashboard → Storage → New Bucket
   - Name: `avatars` or `documents`
   - Set public/private access

3. **Configure Edge Functions** (optional):
   - For custom business logic
   - Dashboard → Functions

4. **Set up Database Backups**:
   - Automatic daily backups on paid plans
   - Manual backups available on free tier

## Useful Supabase Cloud Links

- **Dashboard**: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]
- **Documentation**: https://supabase.com/docs
- **SQL Editor**: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/sql
- **Table Editor**: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/editor
- **Auth Users**: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/auth/users
- **API Docs**: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/api

---

## Why Supabase Cloud is Better Than Self-Hosted (for now)

1. **Zero DevOps**: No Docker, no configuration files, no container orchestration
2. **Instant Updates**: Automatic security patches and feature updates
3. **Built-in Monitoring**: Real-time metrics and logs
4. **Automatic Backups**: Daily backups on paid plans
5. **Global CDN**: Better performance for auth and storage
6. **Support**: Community and paid support options
7. **Free Tier**: 500MB database, 2 projects, unlimited auth users

Once you're in production and need more control, you can always migrate to self-hosted or a managed Kubernetes deployment.

---

**Your Supabase Cloud instance should now be working 100%!** No Docker headaches, no configuration hell - just a working database with authentication ready to go.