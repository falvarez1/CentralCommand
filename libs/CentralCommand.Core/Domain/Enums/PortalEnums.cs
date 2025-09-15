namespace CentralCommand.Core.Domain.Enums;

/// <summary>
/// Portal status enumeration
/// </summary>
public enum PortalStatus
{
    /// <summary>Portal is active and healthy</summary>
    Active,
    /// <summary>Portal is experiencing degraded performance</summary>
    Degraded,
    /// <summary>Portal is down</summary>
    Down,
    /// <summary>Portal is under maintenance</summary>
    Maintenance,
    /// <summary>Portal status is unknown</summary>
    Unknown
}

/// <summary>
/// Portal environment types
/// </summary>
public enum PortalEnvironment
{
    /// <summary>Production environment</summary>
    Production,
    /// <summary>Staging environment</summary>
    Staging,
    /// <summary>Development environment</summary>
    Development,
    /// <summary>Testing environment</summary>
    Testing
}

/// <summary>
/// Portal priority levels
/// </summary>
public enum PortalPriority
{
    /// <summary>Critical priority</summary>
    Critical,
    /// <summary>High priority</summary>
    High,
    /// <summary>Medium priority</summary>
    Medium,
    /// <summary>Low priority</summary>
    Low
}

/// <summary>
/// Authentication types
/// </summary>
public enum AuthType
{
    /// <summary>No authentication</summary>
    None,
    /// <summary>Basic authentication</summary>
    Basic,
    /// <summary>OAuth authentication</summary>
    OAuth,
    /// <summary>SAML authentication</summary>
    SAML,
    /// <summary>API key authentication</summary>
    ApiKey,
    /// <summary>JWT authentication</summary>
    JWT
}

/// <summary>
/// Portal categories
/// </summary>
public enum PortalCategory
{
    /// <summary>All categories</summary>
    All,
    /// <summary>Engineering tools</summary>
    Engineering,
    /// <summary>Operations tools</summary>
    Operations,
    /// <summary>Support tools</summary>
    Support,
    /// <summary>Monitoring tools</summary>
    Monitoring,
    /// <summary>Analytics tools</summary>
    Analytics,
    /// <summary>Services</summary>
    Services,
    /// <summary>Infrastructure</summary>
    Infrastructure,
    /// <summary>Databases</summary>
    Databases,
    /// <summary>Security tools</summary>
    Security,
    /// <summary>Development tools</summary>
    Development,
    /// <summary>Business tools</summary>
    Business,
    /// <summary>Communication tools</summary>
    Communication
}