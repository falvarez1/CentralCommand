using CentralCommand.Api.Configuration;
using CentralCommand.Api.Data;
using CentralCommand.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Supabase.Gotrue;
using Supabase.Gotrue.Exceptions;
using System.Text.Json;

namespace CentralCommand.Api.Services;

/// <summary>
/// Service for handling Supabase authentication
/// </summary>
public class SupabaseAuthService : ISupabaseAuthService
{
    private readonly Supabase.Client _supabaseClient;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _dbContext;
    private readonly SupabaseSettings _settings;
    private readonly ILogger<SupabaseAuthService> _logger;

    public SupabaseAuthService(
        Supabase.Client supabaseClient,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext dbContext,
        IOptions<SupabaseSettings> settings,
        ILogger<SupabaseAuthService> logger)
    {
        _supabaseClient = supabaseClient;
        _userManager = userManager;
        _dbContext = dbContext;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<(User? SupabaseUser, ApplicationUser? LocalUser, string? Error)> SignUpAsync(
        string email,
        string password,
        string firstName,
        string lastName)
    {
        try
        {
            // Sign up with Supabase Auth
            var signUpOptions = new SignUpOptions
            {
                Data = new Dictionary<string, object>
                {
                    { "first_name", firstName },
                    { "last_name", lastName },
                    { "display_name", $"{firstName} {lastName}" }
                }
            };

            var session = await _supabaseClient.Auth.SignUp(email, password, signUpOptions);

            if (session?.User == null)
            {
                return (null, null, "Failed to create user in Supabase");
            }

            // Sync with local database
            var localUser = await SyncUserWithLocalDatabaseAsync(session.User);

            return (session.User, localUser, null);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Supabase Auth error during sign up");
            return (null, null, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during sign up");
            return (null, null, "An unexpected error occurred during sign up");
        }
    }

    public async Task<(Session? Session, ApplicationUser? LocalUser, string? Error)> SignInAsync(
        string email,
        string password)
    {
        try
        {
            // Sign in with Supabase Auth
            var session = await _supabaseClient.Auth.SignIn(email, password);

            if (session?.User == null)
            {
                return (null, null, "Invalid email or password");
            }

            // Sync with local database
            var localUser = await SyncUserWithLocalDatabaseAsync(session.User);

            // Update last login
            if (localUser != null)
            {
                localUser.LastLoginAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
            }

            return (session, localUser, null);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Supabase Auth error during sign in");
            return (null, null, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during sign in");
            return (null, null, "An unexpected error occurred during sign in");
        }
    }

    public async Task<bool> SignOutAsync(string? accessToken = null)
    {
        try
        {
            await _supabaseClient.Auth.SignOut();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during sign out");
            return false;
        }
    }

    public async Task<(Session? Session, string? Error)> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            var session = await _supabaseClient.Auth.RefreshSession();
            return (session, null);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Error refreshing token");
            return (null, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error refreshing token");
            return (null, "Failed to refresh token");
        }
    }

    public async Task<(User? SupabaseUser, ApplicationUser? LocalUser, string? Error)> GetUserAsync(string accessToken)
    {
        try
        {
            // Get user from Supabase using the access token
            var user = await _supabaseClient.Auth.GetUser(accessToken);

            if (user == null)
            {
                return (null, null, "User not found");
            }

            // Get local user
            var localUser = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.ExternalId == user.Id);

            return (user, localUser, null);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Error getting user");
            return (null, null, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error getting user");
            return (null, null, "Failed to get user");
        }
    }

    public async Task<(bool IsValid, User? User, string? Error)> VerifyTokenAsync(string token)
    {
        try
        {
            // Verify token by attempting to get user
            var user = await _supabaseClient.Auth.GetUser(token);

            if (user != null)
            {
                return (true, user, null);
            }

            return (false, null, "Invalid token");
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Error verifying token");
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error verifying token");
            return (false, null, "Failed to verify token");
        }
    }

    public async Task<ApplicationUser?> SyncUserWithLocalDatabaseAsync(User supabaseUser)
    {
        try
        {
            // Check if user already exists locally
            var existingUser = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.ExternalId == supabaseUser.Id);

            if (existingUser != null)
            {
                // Update user information
                existingUser.Email = supabaseUser.Email;
                existingUser.EmailConfirmed = supabaseUser.EmailConfirmedAt.HasValue;
                existingUser.PhoneNumber = supabaseUser.Phone;
                existingUser.PhoneNumberConfirmed = supabaseUser.PhoneConfirmedAt.HasValue;
                existingUser.UpdatedAt = DateTime.UtcNow;

                // Update metadata if available
                if (supabaseUser.UserMetadata != null)
                {
                    UpdateUserFromMetadata(existingUser, supabaseUser.UserMetadata);
                }

                await _dbContext.SaveChangesAsync();
                return existingUser;
            }

            // Create new local user
            var newUser = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = supabaseUser.Email,
                Email = supabaseUser.Email,
                EmailConfirmed = supabaseUser.EmailConfirmedAt.HasValue,
                PhoneNumber = supabaseUser.Phone,
                PhoneNumberConfirmed = supabaseUser.PhoneConfirmedAt.HasValue,
                ExternalId = supabaseUser.Id,
                AuthProvider = AuthProvider.Supabase,
                Status = UserStatus.Active,
                Role = UserRole.Viewer, // Default role
                CreatedAt = supabaseUser.CreatedAt.ToUniversalTime(),
                UpdatedAt = DateTime.UtcNow,
                Timezone = "UTC",
                Language = "en",
                FirstName = "",
                LastName = ""
            };

            // Set user properties from metadata
            if (supabaseUser.UserMetadata != null)
            {
                UpdateUserFromMetadata(newUser, supabaseUser.UserMetadata);
            }

            // Create user in Identity system
            var result = await _userManager.CreateAsync(newUser);

            if (!result.Succeeded)
            {
                _logger.LogError("Failed to create local user: {Errors}",
                    string.Join(", ", result.Errors.Select(e => e.Description)));
                return null;
            }

            // Assign default role
            await _userManager.AddToRoleAsync(newUser, "Viewer");

            return newUser;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing user with local database");
            return null;
        }
    }

    public async Task<(User? User, string? Error)> UpdateUserMetadataAsync(
        string userId,
        Dictionary<string, object> metadata)
    {
        try
        {
            var attributes = new UserAttributes
            {
                Data = metadata
            };

            var user = await _supabaseClient.Auth.Update(attributes);
            return (user, null);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Error updating user metadata");
            return (null, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating user metadata");
            return (null, "Failed to update user metadata");
        }
    }

    public async Task<(bool Success, string? Error)> SendPasswordResetEmailAsync(string email)
    {
        try
        {
            var success = await _supabaseClient.Auth.ResetPasswordForEmail(email);
            return (success, null);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Error sending password reset email");
            return (false, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending password reset email");
            return (false, "Failed to send password reset email");
        }
    }

    public async Task<(bool Success, string? Error)> ResetPasswordAsync(string token, string newPassword)
    {
        try
        {
            var attributes = new UserAttributes
            {
                Password = newPassword
            };

            // Note: This requires the user to be signed in with the recovery token
            var user = await _supabaseClient.Auth.Update(attributes);
            return (user != null, null);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Error resetting password");
            return (false, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error resetting password");
            return (false, "Failed to reset password");
        }
    }

    public async Task<(ProviderAuthState? AuthState, string? Error)> SignInWithProviderAsync(
        Supabase.Gotrue.Constants.Provider provider,
        string? redirectUrl = null)
    {
        try
        {
            var options = new Supabase.Gotrue.SignInOptions
            {
                FlowType = Supabase.Gotrue.Constants.OAuthFlowType.PKCE,
                RedirectTo = redirectUrl ?? "http://localhost:5173/auth/callback"
            };

            var authState = await _supabaseClient.Auth.SignIn(provider, options);
            return (authState, null);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Error signing in with provider {Provider}", provider);
            return (null, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error signing in with provider {Provider}", provider);
            return (null, "Failed to sign in with provider");
        }
    }

    public async Task<(Session? Session, ApplicationUser? LocalUser, string? Error)> ExchangeCodeForSessionAsync(
        string code,
        string? codeVerifier = null)
    {
        try
        {
            var session = await _supabaseClient.Auth.ExchangeCodeForSession(codeVerifier ?? "", code);

            if (session?.User == null)
            {
                return (null, null, "Failed to exchange code for session");
            }

            // Sync with local database
            var localUser = await SyncUserWithLocalDatabaseAsync(session.User);

            return (session, localUser, null);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex, "Error exchanging code for session");
            return (null, null, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error exchanging code for session");
            return (null, null, "Failed to exchange code for session");
        }
    }

    private void UpdateUserFromMetadata(ApplicationUser user, Dictionary<string, object> metadata)
    {
        if (metadata.TryGetValue("first_name", out var firstName) && firstName != null)
        {
            user.FirstName = firstName.ToString() ?? "";
        }

        if (metadata.TryGetValue("last_name", out var lastName) && lastName != null)
        {
            user.LastName = lastName.ToString() ?? "";
        }

        if (metadata.TryGetValue("display_name", out var displayName) && displayName != null)
        {
            user.DisplayName = displayName.ToString();
        }

        if (metadata.TryGetValue("avatar_url", out var avatarUrl) && avatarUrl != null)
        {
            user.Avatar = avatarUrl.ToString();
        }

        if (metadata.TryGetValue("department", out var department) && department != null)
        {
            user.Department = department.ToString();
        }

        if (metadata.TryGetValue("job_title", out var jobTitle) && jobTitle != null)
        {
            user.JobTitle = jobTitle.ToString();
        }

        if (metadata.TryGetValue("timezone", out var timezone) && timezone != null)
        {
            user.Timezone = timezone.ToString() ?? "UTC";
        }

        if (metadata.TryGetValue("language", out var language) && language != null)
        {
            user.Language = language.ToString() ?? "en";
        }

        if (metadata.TryGetValue("country", out var country) && country != null)
        {
            user.Country = country.ToString();
        }
    }
}