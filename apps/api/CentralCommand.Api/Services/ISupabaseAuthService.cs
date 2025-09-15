using CentralCommand.Api.Data.Entities;
using Supabase.Gotrue;

namespace CentralCommand.Api.Services;

/// <summary>
/// Interface for Supabase authentication service
/// </summary>
public interface ISupabaseAuthService
{
    /// <summary>
    /// Sign up a new user with Supabase Auth
    /// </summary>
    Task<(User? SupabaseUser, ApplicationUser? LocalUser, string? Error)> SignUpAsync(
        string email,
        string password,
        string firstName,
        string lastName);

    /// <summary>
    /// Sign in a user with Supabase Auth
    /// </summary>
    Task<(Session? Session, ApplicationUser? LocalUser, string? Error)> SignInAsync(
        string email,
        string password);

    /// <summary>
    /// Sign out the current user
    /// </summary>
    Task<bool> SignOutAsync(string? accessToken = null);

    /// <summary>
    /// Refresh the access token
    /// </summary>
    Task<(Session? Session, string? Error)> RefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Get user by access token
    /// </summary>
    Task<(User? SupabaseUser, ApplicationUser? LocalUser, string? Error)> GetUserAsync(string accessToken);

    /// <summary>
    /// Verify and decode a Supabase JWT
    /// </summary>
    Task<(bool IsValid, User? User, string? Error)> VerifyTokenAsync(string token);

    /// <summary>
    /// Sync a Supabase user with local Identity database
    /// </summary>
    Task<ApplicationUser?> SyncUserWithLocalDatabaseAsync(User supabaseUser);

    /// <summary>
    /// Update user metadata in Supabase
    /// </summary>
    Task<(User? User, string? Error)> UpdateUserMetadataAsync(
        string userId,
        Dictionary<string, object> metadata);

    /// <summary>
    /// Send password reset email
    /// </summary>
    Task<(bool Success, string? Error)> SendPasswordResetEmailAsync(string email);

    /// <summary>
    /// Reset password with token
    /// </summary>
    Task<(bool Success, string? Error)> ResetPasswordAsync(string token, string newPassword);

    /// <summary>
    /// Sign in with OAuth provider
    /// </summary>
    Task<(ProviderAuthState? AuthState, string? Error)> SignInWithProviderAsync(
        Supabase.Gotrue.Constants.Provider provider,
        string? redirectUrl = null);

    /// <summary>
    /// Exchange OAuth code for session
    /// </summary>
    Task<(Session? Session, ApplicationUser? LocalUser, string? Error)> ExchangeCodeForSessionAsync(
        string code,
        string? codeVerifier = null);
}