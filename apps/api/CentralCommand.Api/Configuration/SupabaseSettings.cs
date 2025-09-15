namespace CentralCommand.Api.Configuration;

/// <summary>
/// Configuration settings for Supabase integration
/// </summary>
public class SupabaseSettings
{
    /// <summary>
    /// The Supabase project URL
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// The Supabase anon/public key for client-side operations
    /// </summary>
    public string AnonKey { get; set; } = string.Empty;

    /// <summary>
    /// The Supabase service role key for server-side admin operations
    /// WARNING: Never expose this to the client
    /// </summary>
    public string ServiceRoleKey { get; set; } = string.Empty;

    /// <summary>
    /// The PostgreSQL connection string for Entity Framework
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// JWT secret for token validation (optional if using JWKS)
    /// </summary>
    public string JwtSecret { get; set; } = string.Empty;

    /// <summary>
    /// Enable Supabase Auth integration
    /// </summary>
    public bool EnableSupabaseAuth { get; set; } = false;

    /// <summary>
    /// Enable Supabase Realtime integration
    /// </summary>
    public bool EnableRealtime { get; set; } = false;

    /// <summary>
    /// Validate the settings
    /// </summary>
    public void Validate()
    {
        if (string.IsNullOrEmpty(Url))
            throw new InvalidOperationException("Supabase URL is required");

        if (string.IsNullOrEmpty(AnonKey))
            throw new InvalidOperationException("Supabase Anon Key is required");

        if (string.IsNullOrEmpty(ConnectionString))
            throw new InvalidOperationException("Supabase Connection String is required");

        // Service role key is optional but recommended for server operations
        if (EnableSupabaseAuth && string.IsNullOrEmpty(ServiceRoleKey))
        {
            Console.WriteLine("Warning: Service Role Key not configured. Some admin operations may be limited.");
        }
    }
}