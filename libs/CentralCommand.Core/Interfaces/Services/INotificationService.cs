namespace CentralCommand.Core.Interfaces.Services;

/// <summary>
/// Service interface for sending notifications
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Sends an email notification
    /// </summary>
    Task<bool> SendEmailAsync(EmailNotification notification, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a Slack notification
    /// </summary>
    Task<bool> SendSlackAsync(SlackNotification notification, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends an SMS notification
    /// </summary>
    Task<bool> SendSmsAsync(SmsNotification notification, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a webhook notification
    /// </summary>
    Task<bool> SendWebhookAsync(WebhookNotification notification, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends notifications to multiple channels
    /// </summary>
    Task<NotificationResult> SendMultiChannelAsync(MultiChannelNotification notification, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends an incident alert
    /// </summary>
    Task<NotificationResult> SendIncidentAlertAsync(Guid incidentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a portal down alert
    /// </summary>
    Task<NotificationResult> SendPortalDownAlertAsync(Guid portalId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends a threshold breach alert
    /// </summary>
    Task<NotificationResult> SendThresholdBreachAlertAsync(string metricName, double value, double threshold, CancellationToken cancellationToken = default);
}

/// <summary>
/// Email notification model
/// </summary>
public class EmailNotification
{
    public List<string> To { get; set; } = new();
    public List<string> Cc { get; set; } = new();
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
}

/// <summary>
/// Slack notification model
/// </summary>
public class SlackNotification
{
    public string Channel { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? IconEmoji { get; set; }
    public List<SlackAttachment> Attachments { get; set; } = new();
}

/// <summary>
/// Slack attachment model
/// </summary>
public class SlackAttachment
{
    public string? Title { get; set; }
    public string? Text { get; set; }
    public string? Color { get; set; }
    public List<SlackField> Fields { get; set; } = new();
}

/// <summary>
/// Slack field model
/// </summary>
public class SlackField
{
    public string Title { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public bool Short { get; set; }
}

/// <summary>
/// SMS notification model
/// </summary>
public class SmsNotification
{
    public List<string> PhoneNumbers { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Webhook notification model
/// </summary>
public class WebhookNotification
{
    public string Url { get; set; } = string.Empty;
    public string Method { get; set; } = "POST";
    public Dictionary<string, string> Headers { get; set; } = new();
    public object? Payload { get; set; }
}

/// <summary>
/// Multi-channel notification model
/// </summary>
public class MultiChannelNotification
{
    public EmailNotification? Email { get; set; }
    public SlackNotification? Slack { get; set; }
    public SmsNotification? Sms { get; set; }
    public List<WebhookNotification> Webhooks { get; set; } = new();
}

/// <summary>
/// Notification result model
/// </summary>
public class NotificationResult
{
    public bool Success { get; set; }
    public Dictionary<string, bool> ChannelResults { get; set; } = new();
    public List<string> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}