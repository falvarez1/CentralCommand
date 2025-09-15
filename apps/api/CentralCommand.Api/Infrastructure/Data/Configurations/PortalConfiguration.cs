using CentralCommand.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;

namespace CentralCommand.Api.Infrastructure.Data.Configurations;

public class PortalConfiguration : IEntityTypeConfiguration<Portal>
{
    public void Configure(EntityTypeBuilder<Portal> builder)
    {
        builder.ToTable("Portals");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Url)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.Description)
            .HasMaxLength(1000);

        builder.Property(p => p.Icon)
            .HasMaxLength(100);

        builder.Property(p => p.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(p => p.Environment)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(p => p.Priority)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(p => p.Owner)
            .HasMaxLength(200);

        builder.Property(p => p.Team)
            .HasMaxLength(200);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.Property(p => p.UpdatedAt);

        builder.Property(p => p.LastCheckedAt);

        builder.Property(p => p.Tags)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
            .HasColumnType("nvarchar(max)");

        // Configure owned types
        builder.OwnsOne(p => p.Metrics, metrics =>
        {
            metrics.Property(m => m.ResponseTime).HasColumnName("Metrics_ResponseTime");
            metrics.Property(m => m.Uptime).HasColumnName("Metrics_Uptime");
            metrics.Property(m => m.ErrorRate).HasColumnName("Metrics_ErrorRate");
            metrics.Property(m => m.RequestsPerMinute).HasColumnName("Metrics_RequestsPerMinute");
            metrics.Property(m => m.AverageLoadTime).HasColumnName("Metrics_AverageLoadTime");
            metrics.Property(m => m.PeakResponseTime).HasColumnName("Metrics_PeakResponseTime");
            metrics.Property(m => m.LastUpdated).HasColumnName("Metrics_LastUpdated");
        });

        builder.OwnsOne(p => p.Config, config =>
        {
            config.Property(c => c.CheckInterval).HasColumnName("Config_CheckInterval");
            config.Property(c => c.Timeout).HasColumnName("Config_Timeout");
            config.Property(c => c.AlertThreshold).HasColumnName("Config_AlertThreshold");
            config.Property(c => c.IsMonitoringEnabled).HasColumnName("Config_IsMonitoringEnabled");
            config.Property(c => c.RetryCount).HasColumnName("Config_RetryCount");
            config.Property(c => c.NotificationEmails)
                .HasColumnName("Config_NotificationEmails")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());
        });

        // Configure relationships
        builder.HasMany(p => p.HealthChecks)
            .WithOne()
            .HasForeignKey("PortalId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.MetricsHistory)
            .WithOne()
            .HasForeignKey("PortalId")
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(p => p.Name);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.Environment);
        builder.HasIndex(p => p.Category);
        builder.HasIndex(p => p.Priority);
        builder.HasIndex(p => new { p.Status, p.Environment });
    }
}