using CentralCommand.Core.Domain.Common;
using CentralCommand.Core.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Core.Domain.Entities;

/// <summary>
/// Health check entity for portal monitoring
/// </summary>
public class HealthCheck : BaseEntity
{
    /// <summary>
    /// Gets or sets the portal ID
    /// </summary>
    [Required]
    public Guid PortalId { get; set; }

    /// <summary>
    /// Gets or sets the endpoint URL
    /// </summary>
    [Required]
    [StringLength(500)]
    [Url]
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the HTTP method
    /// </summary>
    [StringLength(10)]
    public string Method { get; set; } = "GET";

    /// <summary>
    /// Gets or sets the health check type
    /// </summary>
    public HealthCheckType Type { get; set; } = HealthCheckType.Http;

    /// <summary>
    /// Gets or sets the health check status
    /// </summary>
    public HealthCheckStatus Status { get; set; } = HealthCheckStatus.Unknown;

    /// <summary>
    /// Gets or sets the expected status code
    /// </summary>
    public int ExpectedStatusCode { get; set; } = 200;

    /// <summary>
    /// Gets or sets the timeout in milliseconds
    /// </summary>
    public int Timeout { get; set; } = 5000;

    /// <summary>
    /// Gets or sets the check interval in seconds
    /// </summary>
    public int Interval { get; set; } = 30;

    /// <summary>
    /// Gets or sets whether the health check is enabled
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// Gets or sets the last check timestamp
    /// </summary>
    public DateTime? LastChecked { get; set; }

    /// <summary>
    /// Gets or sets the last check status
    /// </summary>
    public PortalStatus? LastStatus { get; set; }

    /// <summary>
    /// Gets or sets the last response time in milliseconds
    /// </summary>
    public double? LastResponseTime { get; set; }

    /// <summary>
    /// Gets or sets the last error message
    /// </summary>
    [StringLength(1000)]
    public string? LastError { get; set; }

    /// <summary>
    /// Gets or sets consecutive failure count
    /// </summary>
    public int ConsecutiveFailures { get; set; }

    /// <summary>
    /// Gets or sets custom headers (JSON)
    /// </summary>
    public string? Headers { get; set; }

    /// <summary>
    /// Gets or sets the request body for POST/PUT methods
    /// </summary>
    public string? Body { get; set; }

    /// <summary>
    /// Navigation property for the portal
    /// </summary>
    public virtual Portal? Portal { get; set; }

    /// <summary>
    /// Gets the custom headers dictionary
    /// </summary>
    public Dictionary<string, string> GetHeaders()
    {
        if (string.IsNullOrWhiteSpace(Headers))
            return new Dictionary<string, string>();

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(Headers) ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }

    /// <summary>
    /// Sets the custom headers
    /// </summary>
    public void SetHeaders(Dictionary<string, string> headers)
    {
        Headers = headers?.Any() == true
            ? System.Text.Json.JsonSerializer.Serialize(headers)
            : null;
    }

    /// <summary>
    /// Records a successful health check
    /// </summary>
    public void RecordSuccess(double responseTime)
    {
        LastChecked = DateTime.UtcNow;
        LastStatus = PortalStatus.Active;
        Status = HealthCheckStatus.Healthy;
        LastResponseTime = responseTime;
        LastError = null;
        ConsecutiveFailures = 0;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Records a failed health check
    /// </summary>
    public void RecordFailure(string error)
    {
        LastChecked = DateTime.UtcNow;
        LastStatus = PortalStatus.Down;
        Status = HealthCheckStatus.Unhealthy;
        LastError = error;
        ConsecutiveFailures++;
        UpdatedAt = DateTime.UtcNow;
    }
}