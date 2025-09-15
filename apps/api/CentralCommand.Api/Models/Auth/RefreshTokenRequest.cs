using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Api.Models.Auth;

/// <summary>
/// Request model for refreshing an access token
/// </summary>
public class RefreshTokenRequest
{
    /// <summary>
    /// The expired or expiring access token
    /// </summary>
    [Required(ErrorMessage = "Access token is required")]
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// The refresh token
    /// </summary>
    [Required(ErrorMessage = "Refresh token is required")]
    public string RefreshToken { get; set; } = string.Empty;
}