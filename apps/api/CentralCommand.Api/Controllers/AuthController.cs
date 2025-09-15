using CentralCommand.Api.Data;
using CentralCommand.Api.Data.Entities;
using CentralCommand.Api.Models.Auth;
using CentralCommand.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CentralCommand.Api.Controllers;

/// <summary>
/// Controller for authentication operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuthController> _logger;
    private readonly ICsrfProtectionService _csrfProtectionService;
    private readonly ITokenBlacklistService _tokenBlacklistService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenService jwtTokenService,
        ApplicationDbContext context,
        ILogger<AuthController> logger,
        ICsrfProtectionService csrfProtectionService,
        ITokenBlacklistService tokenBlacklistService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
        _context = context;
        _logger = logger;
        _csrfProtectionService = csrfProtectionService;
        _tokenBlacklistService = tokenBlacklistService;
    }

    /// <summary>
    /// Login with username/email and password
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            // Find user by username or email
            var user = await _userManager.FindByNameAsync(request.UsernameOrEmail)
                ?? await _userManager.FindByEmailAsync(request.UsernameOrEmail);

            if (user == null)
            {
                _logger.LogWarning("Login attempt failed: User not found for {UsernameOrEmail}", request.UsernameOrEmail);
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Failed",
                    Detail = "Invalid username/email or password",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            // Check if user account is active
            if (user.Status != UserStatus.Active)
            {
                _logger.LogWarning("Login attempt failed: User {UserId} account is {Status}", user.Id, user.Status);
                return Unauthorized(new ProblemDetails
                {
                    Title = "Account Inactive",
                    Detail = $"Your account is currently {user.Status.ToString().ToLower()}. Please contact support.",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            // Verify password
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

            if (result.IsLockedOut)
            {
                _logger.LogWarning("Login attempt failed: User {UserId} is locked out", user.Id);
                return Unauthorized(new ProblemDetails
                {
                    Title = "Account Locked",
                    Detail = "Your account has been locked due to multiple failed login attempts. Please try again later.",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            if (!result.Succeeded)
            {
                _logger.LogWarning("Login attempt failed: Invalid password for user {UserId}", user.Id);
                return Unauthorized(new ProblemDetails
                {
                    Title = "Authentication Failed",
                    Detail = "Invalid username/email or password",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            // Update user login information
            user.LastLoginAt = DateTime.UtcNow;
            user.LastActivityAt = DateTime.UtcNow;
            user.LoginCount++;
            await _userManager.UpdateAsync(user);

            // Generate tokens
            var accessToken = await _jwtTokenService.GenerateAccessTokenAsync(user);
            var refreshToken = _jwtTokenService.CreateRefreshToken(GetIpAddress());
            refreshToken.UserId = user.Id;

            // Save refresh token
            _context.RefreshTokens.Add(refreshToken);

            // Create user session
            var session = new UserSession
            {
                UserId = user.Id,
                Token = accessToken,
                RefreshToken = refreshToken.Token,
                IpAddress = GetIpAddress(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                ExpiresAt = refreshToken.ExpiresAt,
                Device = GetDeviceInfo()
            };
            _context.UserSessions.Add(session);

            // Create audit log
            var auditLog = new UserAuditLog
            {
                UserId = user.Id,
                Action = "Login",
                EntityType = "User",
                EntityId = user.Id.ToString(),
                IpAddress = GetIpAddress(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Success = true
            };
            _context.UserAuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} successfully logged in from {IpAddress}", user.Id, GetIpAddress());

            // Generate CSRF token for the user
            var csrfToken = _csrfProtectionService.GenerateToken(user.Id.ToString());

            // Set tokens as HttpOnly cookies
            SetTokenCookies(accessToken, refreshToken.Token, refreshToken.ExpiresAt);

            return Ok(new AuthResponse
            {
                AccessTokenExpiration = DateTime.UtcNow.AddMinutes(15),
                RefreshTokenExpiration = refreshToken.ExpiresAt,
                User = UserDto.FromEntity(user),
                CsrfToken = csrfToken
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {UsernameOrEmail}", request.UsernameOrEmail);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "An error occurred while processing your request",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                ModelState.AddModelError("Email", "A user with this email already exists");
                return ValidationProblem(ModelState);
            }

            existingUser = await _userManager.FindByNameAsync(request.Username);
            if (existingUser != null)
            {
                ModelState.AddModelError("Username", "This username is already taken");
                return ValidationProblem(ModelState);
            }

            // Create new user
            var user = new ApplicationUser
            {
                Email = request.Email,
                UserName = request.Username,
                FirstName = request.FirstName,
                LastName = request.LastName,
                DisplayName = request.DisplayName ?? $"{request.FirstName} {request.LastName}",
                Department = request.Department,
                JobTitle = request.JobTitle,
                Phone = request.Phone,
                Timezone = request.Timezone,
                Language = request.Language,
                Country = request.Country,
                Status = UserStatus.Active, // For demo purposes, auto-activate
                Role = UserRole.Viewer, // Default role
                AuthProvider = AuthProvider.Local,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Create user with password
            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(error.Code, error.Description);
                }
                return ValidationProblem(ModelState);
            }

            // Add to default role
            await _userManager.AddToRoleAsync(user, "Viewer");

            // Generate tokens
            var accessToken = await _jwtTokenService.GenerateAccessTokenAsync(user);
            var refreshToken = _jwtTokenService.CreateRefreshToken(GetIpAddress());
            refreshToken.UserId = user.Id;

            // Save refresh token
            _context.RefreshTokens.Add(refreshToken);

            // Create user session
            var session = new UserSession
            {
                UserId = user.Id,
                Token = accessToken,
                RefreshToken = refreshToken.Token,
                IpAddress = GetIpAddress(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                ExpiresAt = refreshToken.ExpiresAt,
                Device = GetDeviceInfo()
            };
            _context.UserSessions.Add(session);

            // Create audit log
            var auditLog = new UserAuditLog
            {
                UserId = user.Id,
                Action = "Register",
                EntityType = "User",
                EntityId = user.Id.ToString(),
                IpAddress = GetIpAddress(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Success = true
            };
            _context.UserAuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();

            _logger.LogInformation("New user {UserId} registered with email {Email}", user.Id, user.Email);

            // Generate CSRF token for the user
            var csrfToken = _csrfProtectionService.GenerateToken(user.Id.ToString());

            // Set tokens as HttpOnly cookies
            SetTokenCookies(accessToken, refreshToken.Token, refreshToken.ExpiresAt);

            return CreatedAtAction(nameof(GetCurrentUser), new AuthResponse
            {
                AccessTokenExpiration = DateTime.UtcNow.AddMinutes(15),
                RefreshTokenExpiration = refreshToken.ExpiresAt,
                User = UserDto.FromEntity(user),
                CsrfToken = csrfToken
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for {Email}", request.Email);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "An error occurred while processing your request",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Refresh an access token using a refresh token
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken()
    {
        try
        {
            // Get tokens from cookies
            var accessToken = _jwtTokenService.ExtractTokenFromCookie(Request);
            var refreshTokenValue = _jwtTokenService.ExtractRefreshTokenFromCookie(Request);

            if (string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshTokenValue))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Missing Tokens",
                    Detail = "Access token or refresh token not found in cookies",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Get user ID from the expired/expiring token
            var userId = _jwtTokenService.GetUserIdFromToken(accessToken);
            if (!userId.HasValue)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Invalid Token",
                    Detail = "The access token is invalid",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Find the refresh token
            var refreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshTokenValue && rt.UserId == userId.Value);

            if (refreshToken == null)
            {
                _logger.LogWarning("Refresh token not found for user {UserId}", userId);
                return Unauthorized(new ProblemDetails
                {
                    Title = "Invalid Refresh Token",
                    Detail = "The refresh token is invalid or expired",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            if (!refreshToken.IsActive)
            {
                _logger.LogWarning("Inactive refresh token used by user {UserId}. Revoked: {IsRevoked}, Expired: {IsExpired}",
                    userId, refreshToken.IsRevoked, refreshToken.IsExpired);
                return Unauthorized(new ProblemDetails
                {
                    Title = "Invalid Refresh Token",
                    Detail = "The refresh token is invalid or expired",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            var user = refreshToken.User;

            // Check if user account is still active
            if (user.Status != UserStatus.Active)
            {
                return Unauthorized(new ProblemDetails
                {
                    Title = "Account Inactive",
                    Detail = $"Your account is currently {user.Status.ToString().ToLower()}",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            // Revoke old refresh token
            refreshToken.RevokedAt = DateTime.UtcNow;
            refreshToken.RevokedByIp = GetIpAddress();
            refreshToken.ReasonRevoked = "Replaced by new token";

            // Generate new tokens
            var newAccessToken = await _jwtTokenService.GenerateAccessTokenAsync(user);
            var newRefreshToken = _jwtTokenService.CreateRefreshToken(GetIpAddress());
            newRefreshToken.UserId = user.Id;
            refreshToken.ReplacedByToken = newRefreshToken.Token;

            // Save new refresh token
            _context.RefreshTokens.Add(newRefreshToken);

            // Update user activity
            user.LastActivityAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // Update session
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.RefreshToken == refreshTokenValue && s.UserId == userId.Value);
            if (session != null)
            {
                session.Token = newAccessToken;
                session.RefreshToken = newRefreshToken.Token;
                session.LastActivityAt = DateTime.UtcNow;
                session.ExpiresAt = newRefreshToken.ExpiresAt;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Refreshed token for user {UserId}", user.Id);

            // Generate new CSRF token
            var csrfToken = _csrfProtectionService.GenerateToken(user.Id.ToString());

            // Set new tokens as HttpOnly cookies
            SetTokenCookies(newAccessToken, newRefreshToken.Token, newRefreshToken.ExpiresAt);

            return Ok(new AuthResponse
            {
                AccessTokenExpiration = DateTime.UtcNow.AddMinutes(15),
                RefreshTokenExpiration = newRefreshToken.ExpiresAt,
                User = UserDto.FromEntity(user),
                CsrfToken = csrfToken
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "An error occurred while processing your request",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Logout the current user
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ValidateCsrfToken]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized();
            }

            // Get the token from cookie or Authorization header (for backward compatibility)
            var token = _jwtTokenService.ExtractTokenFromCookie(Request)
                ?? Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized(new ProblemDetails
                {
                    Title = "No Token Found",
                    Detail = "Authentication token not found",
                    Status = StatusCodes.Status401Unauthorized
                });
            }

            // Extract JTI from token for blacklisting
            var principal = _jwtTokenService.ValidateToken(token);
            var jti = _tokenBlacklistService.GetJtiFromPrincipal(principal);
            var tokenExpiry = _jwtTokenService.GetTokenExpiration(token) ?? DateTime.UtcNow.AddMinutes(15);

            // Invalidate the session
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(s => s.Token == token && s.UserId == userGuid);
            if (session != null)
            {
                session.IsActive = false;
                session.RevokedAt = DateTime.UtcNow;
                session.RevokedReason = "User logged out";

                // Also revoke the associated refresh token
                var refreshToken = await _context.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == session.RefreshToken);
                if (refreshToken != null)
                {
                    refreshToken.RevokedAt = DateTime.UtcNow;
                    refreshToken.RevokedByIp = GetIpAddress();
                    refreshToken.ReasonRevoked = "User logged out";
                }
            }

            // Blacklist the current token
            if (!string.IsNullOrEmpty(jti))
            {
                await _tokenBlacklistService.BlacklistTokenAsync(jti, tokenExpiry, userGuid, "User logged out");
            }

            // Create audit log
            var auditLog = new UserAuditLog
            {
                UserId = userGuid,
                Action = "Logout",
                EntityType = "User",
                EntityId = userGuid.ToString(),
                IpAddress = GetIpAddress(),
                UserAgent = Request.Headers["User-Agent"].ToString(),
                Success = true
            };
            _context.UserAuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();

            _logger.LogInformation("User {UserId} logged out", userGuid);

            // Invalidate CSRF tokens for this user
            var csrfToken = Request.Headers["X-CSRF-Token"].FirstOrDefault();
            if (!string.IsNullOrEmpty(csrfToken))
            {
                _csrfProtectionService.InvalidateToken(csrfToken);
            }

            // Clear cookies
            ClearTokenCookies();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "An error occurred while processing your request",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Get current user information
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            return Ok(UserDto.FromEntity(user));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "An error occurred while processing your request",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    #region Helper Methods

    /// <summary>
    /// Set authentication cookies with appropriate security settings
    /// </summary>
    private void SetTokenCookies(string accessToken, string refreshToken, DateTime refreshTokenExpiry)
    {
        var isDevelopment = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment();

        // Access token cookie (15 minutes)
        var accessTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            IsEssential = true,
            Expires = DateTime.UtcNow.AddMinutes(15)
        };
        Response.Cookies.Append("access_token", accessToken, accessTokenOptions);

        // Refresh token cookie (matches refresh token expiry)
        var refreshTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            IsEssential = true,
            Expires = refreshTokenExpiry
        };
        Response.Cookies.Append("refresh_token", refreshToken, refreshTokenOptions);
    }

    /// <summary>
    /// Clear authentication cookies
    /// </summary>
    private void ClearTokenCookies()
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = DateTime.UtcNow.AddDays(-1) // Set to past date to delete
        };

        Response.Cookies.Delete("access_token", cookieOptions);
        Response.Cookies.Delete("refresh_token", cookieOptions);
    }

    private string GetIpAddress()
    {
        if (Request.Headers.ContainsKey("X-Forwarded-For"))
        {
            return Request.Headers["X-Forwarded-For"].ToString().Split(',')[0].Trim();
        }
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private DeviceInfo? GetDeviceInfo()
    {
        var userAgent = Request.Headers["User-Agent"].ToString().ToLower();
        if (string.IsNullOrEmpty(userAgent))
            return null;

        var deviceInfo = new DeviceInfo();

        // Detect device type
        if (userAgent.Contains("mobile"))
            deviceInfo.Type = "mobile";
        else if (userAgent.Contains("tablet") || userAgent.Contains("ipad"))
            deviceInfo.Type = "tablet";
        else
            deviceInfo.Type = "desktop";

        // Detect OS
        if (userAgent.Contains("windows"))
            deviceInfo.Os = "Windows";
        else if (userAgent.Contains("mac"))
            deviceInfo.Os = "macOS";
        else if (userAgent.Contains("linux"))
            deviceInfo.Os = "Linux";
        else if (userAgent.Contains("android"))
            deviceInfo.Os = "Android";
        else if (userAgent.Contains("ios") || userAgent.Contains("iphone") || userAgent.Contains("ipad"))
            deviceInfo.Os = "iOS";

        // Detect browser
        if (userAgent.Contains("chrome"))
            deviceInfo.Browser = "Chrome";
        else if (userAgent.Contains("firefox"))
            deviceInfo.Browser = "Firefox";
        else if (userAgent.Contains("safari") && !userAgent.Contains("chrome"))
            deviceInfo.Browser = "Safari";
        else if (userAgent.Contains("edge"))
            deviceInfo.Browser = "Edge";
        else if (userAgent.Contains("opera"))
            deviceInfo.Browser = "Opera";

        return deviceInfo;
    }

    #endregion
}