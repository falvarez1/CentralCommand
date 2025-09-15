-- Create required users for Supabase services
-- Note: Password is set from POSTGRES_PASSWORD environment variable

-- Create the supabase_auth_admin user for Auth service
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'supabase_auth_admin') THEN

      EXECUTE format('CREATE USER supabase_auth_admin WITH PASSWORD %L CREATEDB CREATEROLE REPLICATION BYPASSRLS',
                     current_setting('custom.postgres_password', true));
   END IF;
END
$do$;

-- Create the supabase_admin user for general admin
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'supabase_admin') THEN

      EXECUTE format('CREATE USER supabase_admin WITH PASSWORD %L CREATEDB CREATEROLE REPLICATION BYPASSRLS',
                     current_setting('custom.postgres_password', true));
   END IF;
END
$do$;

-- Create the authenticator user for PostgREST
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'authenticator') THEN

      EXECUTE format('CREATE USER authenticator WITH PASSWORD %L',
                     current_setting('custom.postgres_password', true));
   END IF;
END
$do$;

-- Create the supabase_storage_admin user for Storage service
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'supabase_storage_admin') THEN

      EXECUTE format('CREATE USER supabase_storage_admin WITH PASSWORD %L CREATEDB CREATEROLE REPLICATION BYPASSRLS',
                     current_setting('custom.postgres_password', true));
   END IF;
END
$do$;

-- Create the supabase_replication_admin user for Realtime service
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'supabase_replication_admin') THEN

      EXECUTE format('CREATE USER supabase_replication_admin WITH PASSWORD %L REPLICATION BYPASSRLS',
                     current_setting('custom.postgres_password', true));
   END IF;
END
$do$;

-- Create the dashboard user for internal use
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'dashboard') THEN

      EXECUTE format('CREATE USER dashboard WITH PASSWORD %L',
                     current_setting('custom.postgres_password', true));
   END IF;
END
$do$;

-- Create anon and service_role roles for JWT
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'anon') THEN

      CREATE ROLE anon NOLOGIN NOINHERIT;
   END IF;

   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'service_role') THEN

      CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
   END IF;

   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'authenticated') THEN

      CREATE ROLE authenticated NOLOGIN NOINHERIT;
   END IF;
END
$do$;

-- Grant necessary permissions
GRANT anon TO authenticator;
GRANT service_role TO authenticator;
GRANT authenticated TO authenticator;

-- Create required schemas
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;
CREATE SCHEMA IF NOT EXISTS realtime AUTHORIZATION supabase_admin;
CREATE SCHEMA IF NOT EXISTS _realtime AUTHORIZATION supabase_admin;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA realtime TO supabase_admin;
GRANT ALL ON SCHEMA _realtime TO supabase_admin;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA public;

-- Grant permissions to supabase_auth_admin on auth schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin;

-- Allow auth admin to create tables in auth schema
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth
GRANT ALL ON TABLES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth
GRANT ALL ON SEQUENCES TO supabase_auth_admin;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth
GRANT ALL ON FUNCTIONS TO supabase_auth_admin;