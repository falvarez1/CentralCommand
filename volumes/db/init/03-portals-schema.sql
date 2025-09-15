-- Create portals and related tables
CREATE SCHEMA IF NOT EXISTS public;

-- Create enum types
DO $$ BEGIN
    CREATE TYPE portal_status AS ENUM ('active', 'inactive', 'maintenance', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE portal_environment AS ENUM ('production', 'staging', 'development', 'testing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM ('open', 'investigating', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create portals table
CREATE TABLE IF NOT EXISTS public.portals (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    description text,
    status portal_status DEFAULT 'active',
    environment portal_environment DEFAULT 'production',
    response_time integer,
    uptime_percentage numeric(5,2),
    last_checked timestamp with time zone DEFAULT now(),
    health_endpoint text,
    is_favorite boolean DEFAULT false,
    tags text[],
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT portals_pkey PRIMARY KEY (id),
    CONSTRAINT portals_url_unique UNIQUE (url)
);

-- Create portal metrics table
CREATE TABLE IF NOT EXISTS public.portal_metrics (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    portal_id uuid NOT NULL REFERENCES public.portals(id) ON DELETE CASCADE,
    response_time integer,
    status_code integer,
    is_healthy boolean,
    error_message text,
    checked_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}',
    CONSTRAINT portal_metrics_pkey PRIMARY KEY (id)
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    portal_id uuid REFERENCES public.portals(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    severity incident_severity DEFAULT 'medium',
    status incident_status DEFAULT 'open',
    reported_by uuid REFERENCES auth.users(id),
    assigned_to uuid REFERENCES auth.users(id),
    resolved_at timestamp with time zone,
    resolution_notes text,
    tags text[],
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT incidents_pkey PRIMARY KEY (id)
);

-- Create incident comments table
CREATE TABLE IF NOT EXISTS public.incident_comments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    comment text NOT NULL,
    is_internal boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT incident_comments_pkey PRIMARY KEY (id)
);

-- Create statistics table
CREATE TABLE IF NOT EXISTS public.statistics (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    stat_name text NOT NULL,
    stat_value numeric,
    stat_unit text,
    category text,
    metadata jsonb DEFAULT '{}',
    recorded_at timestamp with time zone DEFAULT now(),
    CONSTRAINT statistics_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portals_status ON public.portals(status);
CREATE INDEX IF NOT EXISTS idx_portals_environment ON public.portals(environment);
CREATE INDEX IF NOT EXISTS idx_portals_is_favorite ON public.portals(is_favorite);
CREATE INDEX IF NOT EXISTS idx_portal_metrics_portal_id ON public.portal_metrics(portal_id);
CREATE INDEX IF NOT EXISTS idx_portal_metrics_checked_at ON public.portal_metrics(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_portal_id ON public.incidents(portal_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_incident_id ON public.incident_comments(incident_id);

-- Insert sample data for testing
INSERT INTO public.portals (name, url, description, status, environment, response_time, uptime_percentage, health_endpoint, is_favorite, tags) VALUES
    ('Production API', 'https://api.centralcommand.com', 'Main production API endpoint', 'active', 'production', 45, 99.98, '/health', true, ARRAY['api', 'critical', 'production']),
    ('Customer Portal', 'https://portal.centralcommand.com', 'Customer-facing web portal', 'active', 'production', 120, 99.95, '/api/health', true, ARRAY['web', 'customer', 'production']),
    ('Admin Dashboard', 'https://admin.centralcommand.com', 'Administrative dashboard', 'active', 'production', 85, 99.99, '/status', false, ARRAY['admin', 'internal', 'production']),
    ('Staging Environment', 'https://staging.centralcommand.com', 'Staging environment for testing', 'active', 'staging', 150, 98.50, '/health', false, ARRAY['staging', 'test']),
    ('Development Server', 'https://dev.centralcommand.com', 'Development server', 'maintenance', 'development', 200, 95.00, '/api/status', false, ARRAY['dev', 'internal'])
ON CONFLICT (url) DO NOTHING;

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Enable Row Level Security
ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portals
CREATE POLICY "Portals are viewable by everyone" ON public.portals
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert portals" ON public.portals
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update portals" ON public.portals
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete portals" ON public.portals
    FOR DELETE TO authenticated USING (true);

-- Create RLS policies for portal metrics
CREATE POLICY "Portal metrics are viewable by everyone" ON public.portal_metrics
    FOR SELECT USING (true);

CREATE POLICY "Service role can insert metrics" ON public.portal_metrics
    FOR INSERT TO service_role WITH CHECK (true);

-- Create RLS policies for incidents
CREATE POLICY "Incidents are viewable by everyone" ON public.incidents
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create incidents" ON public.incidents
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update incidents" ON public.incidents
    FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for incident comments
CREATE POLICY "Comments are viewable by everyone" ON public.incident_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add comments" ON public.incident_comments
    FOR INSERT TO authenticated WITH CHECK (true);

-- Create RLS policies for statistics
CREATE POLICY "Statistics are viewable by everyone" ON public.statistics
    FOR SELECT USING (true);

-- Create functions for updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_portals_updated_at BEFORE UPDATE ON public.portals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_incidents_updated_at BEFORE UPDATE ON public.incidents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_incident_comments_updated_at BEFORE UPDATE ON public.incident_comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();