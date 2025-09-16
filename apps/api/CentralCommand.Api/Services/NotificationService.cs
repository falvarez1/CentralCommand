using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.AspNetCore.SignalR;
using CentralCommand.Api.Hubs;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace CentralCommand.Api.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IHubContext<MetricsHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendPortalAlertAsync(Portal portal, string alertType, string message, CancellationToken cancellationToken = default)
    {
        var alert = new
        {
            PortalId = portal.Id,
            PortalName = portal.Name,
            AlertType = alertType,
            Message = message,
            Severity = DetermineSeverity(portal.Status),
            Timestamp = DateTime.UtcNow
        };

        // Send to SignalR clients
        await _hubContext.Clients.All.SendAsync("PortalAlert", alert, cancellationToken);

        // Log the alert
        _logger.LogWarning("Portal alert: {PortalName} - {AlertType}: {Message}",
            portal.Name, alertType, message);

        // Here you could also:
        // - Send email notifications
        // - Send SMS alerts
        // - Post to Slack/Teams
        // - Create PagerDuty incidents
    }

    public async Task SendIncidentNotificationAsync(Incident incident, string notificationType, CancellationToken cancellationToken = default)
    {
        var notification = new
        {
            IncidentId = incident.Id,
            Title = incident.Title,
            NotificationType = notificationType,
            Priority = incident.Priority.ToString(),
            Status = incident.Status.ToString(),
            Timestamp = DateTime.UtcNow
        };

        // Send to SignalR clients
        await _hubContext.Clients.All.SendAsync("IncidentNotification", notification, cancellationToken);

        // Log the notification
        _logger.LogInformation("Incident notification: {IncidentTitle} - {NotificationType}",
            incident.Title, notificationType);

        // Send additional notifications for critical incidents
        if (incident.Priority == IncidentPriority.Critical)
        {
            await SendCriticalIncidentAlertAsync(incident, cancellationToken);
        }
    }

    public async Task SendMetricsUpdateAsync(Guid portalId, PortalMetrics metrics, CancellationToken cancellationToken = default)
    {
        var update = new
        {
            PortalId = portalId,
            Metrics = new
            {
                metrics.ResponseTime,
                metrics.Uptime,
                metrics.ErrorRate,
                metrics.RequestsPerMinute,
                metrics.AverageLoadTime,
                metrics.PeakResponseTime,
                metrics.LastUpdated
            },
            Timestamp = DateTime.UtcNow
        };

        // Send to SignalR clients
        await _hubContext.Clients.All.SendAsync("MetricsUpdate", update, cancellationToken);

        _logger.LogDebug("Metrics update sent for portal: {PortalId}", portalId);
    }

    public async Task SendSystemAlertAsync(string alertLevel, string message, Dictionary<string, object>? metadata = null, CancellationToken cancellationToken = default)
    {
        var alert = new
        {
            Level = alertLevel,
            Message = message,
            Metadata = metadata,
            Timestamp = DateTime.UtcNow
        };

        // Send to SignalR clients
        await _hubContext.Clients.All.SendAsync("SystemAlert", alert, cancellationToken);

        // Log based on alert level
        switch (alertLevel.ToLower())
        {
            case "critical":
                _logger.LogCritical("System alert: {Message}", message);
                break;
            case "error":
                _logger.LogError("System alert: {Message}", message);
                break;
            case "warning":
                _logger.LogWarning("System alert: {Message}", message);
                break;
            default:
                _logger.LogInformation("System alert: {Message}", message);
                break;
        }
    }

    public async Task BroadcastStatisticsUpdateAsync(Dictionary<string, object> statistics, CancellationToken cancellationToken = default)
    {
        var update = new
        {
            Statistics = statistics,
            Timestamp = DateTime.UtcNow
        };

        // Send to SignalR clients
        await _hubContext.Clients.All.SendAsync("StatisticsUpdate", update, cancellationToken);

        _logger.LogDebug("Statistics update broadcast completed");
    }

    private async Task SendCriticalIncidentAlertAsync(Incident incident, CancellationToken cancellationToken)
    {
        var criticalAlert = new
        {
            AlertType = "CRITICAL_INCIDENT",
            IncidentId = incident.Id,
            Title = incident.Title,
            Description = incident.Description,
            AffectedPortals = incident.AffectedPortalIds.Count,
            Timestamp = DateTime.UtcNow
        };

        // Send urgent notification to all clients
        await _hubContext.Clients.All.SendAsync("CriticalAlert", criticalAlert, cancellationToken);

        _logger.LogCritical("Critical incident alert sent: {IncidentTitle}", incident.Title);

        // Here you would typically also:
        // - Send immediate email/SMS to on-call engineers
        // - Create PagerDuty incident
        // - Post to emergency Slack channel
    }

    private string DetermineSeverity(PortalStatus status)
    {
        return status switch
        {
            PortalStatus.Down => "Critical",
            PortalStatus.Degraded => "High",
            PortalStatus.Warning => "Medium",
            _ => "Low"
        };
    }

    // INotificationService implementation methods
    public async Task<bool> SendEmailAsync(EmailNotification notification, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Sending email to {Recipients}: {Subject}",
                string.Join(", ", notification.To), notification.Subject);

            // In a real implementation, you would use an email service (SendGrid, AWS SES, etc.)
            await Task.Delay(100, cancellationToken); // Simulate email sending

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email notification");
            return false;
        }
    }

    public async Task<bool> SendSlackAsync(SlackNotification notification, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Sending Slack message to {Channel}: {Text}",
                notification.Channel, notification.Text);

            // In a real implementation, you would use Slack Web API
            await Task.Delay(50, cancellationToken); // Simulate Slack API call

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Slack notification");
            return false;
        }
    }

    public async Task<bool> SendSmsAsync(SmsNotification notification, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Sending SMS to {Numbers}: {Message}",
                string.Join(", ", notification.PhoneNumbers), notification.Message);

            // In a real implementation, you would use an SMS service (Twilio, AWS SNS, etc.)
            await Task.Delay(150, cancellationToken); // Simulate SMS sending

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS notification");
            return false;
        }
    }

    public async Task<bool> SendWebhookAsync(WebhookNotification notification, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Sending webhook to {Url} with method {Method}",
                notification.Url, notification.Method);

            // In a real implementation, you would make an HTTP request
            await Task.Delay(100, cancellationToken); // Simulate webhook call

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send webhook notification");
            return false;
        }
    }

    public async Task<NotificationResult> SendMultiChannelAsync(MultiChannelNotification notification, CancellationToken cancellationToken = default)
    {
        var result = new NotificationResult
        {
            Success = true,
            Timestamp = DateTime.UtcNow
        };

        // Send email if configured
        if (notification.Email != null)
        {
            var emailSuccess = await SendEmailAsync(notification.Email, cancellationToken);
            result.ChannelResults["Email"] = emailSuccess;
            if (!emailSuccess)
            {
                result.Success = false;
                result.Errors.Add("Failed to send email notification");
            }
        }

        // Send Slack if configured
        if (notification.Slack != null)
        {
            var slackSuccess = await SendSlackAsync(notification.Slack, cancellationToken);
            result.ChannelResults["Slack"] = slackSuccess;
            if (!slackSuccess)
            {
                result.Success = false;
                result.Errors.Add("Failed to send Slack notification");
            }
        }

        // Send SMS if configured
        if (notification.Sms != null)
        {
            var smsSuccess = await SendSmsAsync(notification.Sms, cancellationToken);
            result.ChannelResults["SMS"] = smsSuccess;
            if (!smsSuccess)
            {
                result.Success = false;
                result.Errors.Add("Failed to send SMS notification");
            }
        }

        // Send webhooks
        foreach (var webhook in notification.Webhooks)
        {
            var webhookSuccess = await SendWebhookAsync(webhook, cancellationToken);
            result.ChannelResults[$"Webhook_{webhook.Url}"] = webhookSuccess;
            if (!webhookSuccess)
            {
                result.Success = false;
                result.Errors.Add($"Failed to send webhook to {webhook.Url}");
            }
        }

        return result;
    }

    public async Task<NotificationResult> SendIncidentAlertAsync(Guid incidentId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Sending incident alert for incident {IncidentId}", incidentId);

        // Create multi-channel notification for incident
        var notification = new MultiChannelNotification
        {
            Email = new EmailNotification
            {
                To = new List<string> { "oncall@company.com" },
                Subject = $"Incident Alert: {incidentId}",
                Body = $"A new incident has been created with ID: {incidentId}",
                IsHtml = true
            },
            Slack = new SlackNotification
            {
                Channel = "#incidents",
                Text = $"🚨 New incident created: {incidentId}"
            }
        };

        return await SendMultiChannelAsync(notification, cancellationToken);
    }

    public async Task<NotificationResult> SendPortalDownAlertAsync(Guid portalId, CancellationToken cancellationToken = default)
    {
        _logger.LogCritical("Sending portal down alert for portal {PortalId}", portalId);

        // Create critical alert for portal down
        var notification = new MultiChannelNotification
        {
            Email = new EmailNotification
            {
                To = new List<string> { "oncall@company.com", "management@company.com" },
                Subject = $"CRITICAL: Portal {portalId} is DOWN",
                Body = $"Portal {portalId} is currently down and requires immediate attention.",
                IsHtml = true
            },
            Slack = new SlackNotification
            {
                Channel = "#critical-alerts",
                Text = $"🔴 CRITICAL: Portal {portalId} is DOWN!"
            },
            Sms = new SmsNotification
            {
                PhoneNumbers = new List<string> { "+1234567890" },
                Message = $"CRITICAL: Portal {portalId} is down. Immediate action required."
            }
        };

        return await SendMultiChannelAsync(notification, cancellationToken);
    }

    public async Task<NotificationResult> SendThresholdBreachAlertAsync(string metricName, double value, double threshold, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Threshold breach: {MetricName} = {Value} (threshold: {Threshold})",
            metricName, value, threshold);

        // Create threshold breach notification
        var notification = new MultiChannelNotification
        {
            Email = new EmailNotification
            {
                To = new List<string> { "monitoring@company.com" },
                Subject = $"Threshold Breach: {metricName}",
                Body = $"The metric '{metricName}' has breached its threshold. Current value: {value}, Threshold: {threshold}",
                IsHtml = false
            },
            Slack = new SlackNotification
            {
                Channel = "#monitoring",
                Text = $"⚠️ Threshold breach detected: {metricName} = {value} (threshold: {threshold})"
            }
        };

        return await SendMultiChannelAsync(notification, cancellationToken);
    }
}