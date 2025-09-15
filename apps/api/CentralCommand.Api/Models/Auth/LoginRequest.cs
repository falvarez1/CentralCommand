using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Api.Models.Auth;

/// <summary>
/// Request model for user login
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// Username or email address
    /// </summary>
    [Required(ErrorMessage = "Username or email is required")]
    public string UsernameOrEmail { get; set; } = string.Empty;

    /// <summary>
    /// User password
    /// </summary>
    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Whether to remember the user (create long-lived refresh token)
    /// </summary>
    public bool RememberMe { get; set; } = false;
}