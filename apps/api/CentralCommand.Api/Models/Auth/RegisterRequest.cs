using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Api.Models.Auth;

/// <summary>
/// Request model for user registration
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// Email address
    /// </summary>
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Username
    /// </summary>
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_-]+$", ErrorMessage = "Username can only contain letters, numbers, underscores, and hyphens")]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Password
    /// </summary>
    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters long")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
        ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Password confirmation
    /// </summary>
    [Required(ErrorMessage = "Password confirmation is required")]
    [Compare("Password", ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>
    /// First name
    /// </summary>
    [Required(ErrorMessage = "First name is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "First name must be between 1 and 100 characters")]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// Last name
    /// </summary>
    [Required(ErrorMessage = "Last name is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Last name must be between 1 and 100 characters")]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// Display name (optional)
    /// </summary>
    [StringLength(200, ErrorMessage = "Display name cannot exceed 200 characters")]
    public string? DisplayName { get; set; }

    /// <summary>
    /// Department (optional)
    /// </summary>
    [StringLength(100, ErrorMessage = "Department cannot exceed 100 characters")]
    public string? Department { get; set; }

    /// <summary>
    /// Job title (optional)
    /// </summary>
    [StringLength(100, ErrorMessage = "Job title cannot exceed 100 characters")]
    public string? JobTitle { get; set; }

    /// <summary>
    /// Phone number (optional)
    /// </summary>
    [Phone(ErrorMessage = "Invalid phone number")]
    [StringLength(50, ErrorMessage = "Phone number cannot exceed 50 characters")]
    public string? Phone { get; set; }

    /// <summary>
    /// Timezone (defaults to UTC)
    /// </summary>
    [StringLength(100, ErrorMessage = "Timezone cannot exceed 100 characters")]
    public string Timezone { get; set; } = "UTC";

    /// <summary>
    /// Language preference (defaults to en)
    /// </summary>
    [StringLength(10, ErrorMessage = "Language code cannot exceed 10 characters")]
    public string Language { get; set; } = "en";

    /// <summary>
    /// Country (optional)
    /// </summary>
    [StringLength(100, ErrorMessage = "Country cannot exceed 100 characters")]
    public string? Country { get; set; }

    /// <summary>
    /// Whether to accept terms and conditions
    /// </summary>
    [Required(ErrorMessage = "You must accept the terms and conditions")]
    [Range(typeof(bool), "true", "true", ErrorMessage = "You must accept the terms and conditions")]
    public bool AcceptTerms { get; set; }
}