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
            .HasConversion<string>()
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
            .HasColumnType("uniqueidentifier");

        builder.Property(p => p.Team)
            .HasColumnType("uniqueidentifier");

        builder.Property(p => p.Color)
            .HasMaxLength(50);

        builder.Property(p => p.AuthType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(p => p.AuthConfig)
            .HasColumnType("nvarchar(max)");

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.Property(p => p.UpdatedAt);

        builder.Property(p => p.CreatedBy)
            .IsRequired();

        builder.Property(p => p.UpdatedBy)
            .IsRequired();

        builder.Property(p => p.ETag)
            .IsRequired()
            .HasMaxLength(50)
            .IsConcurrencyToken();

        builder.Property(p => p.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.DeletedAt);

        builder.Property(p => p.DeletedBy);

        builder.Property(p => p.LastChecked)
            .IsRequired();

        builder.Property(p => p.LastModifiedAt)
            .IsRequired();

        builder.Property(p => p.LastIncident);

        builder.Property(p => p.Tags)
            .HasColumnType("nvarchar(max)");

        builder.Property(p => p.Maintainers)
            .HasColumnType("nvarchar(max)");

        builder.Property(p => p.MetricsHistoryJson)
            .HasColumnType("nvarchar(max)");

        builder.Property(p => p.IsFavorite)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.IsPublic)
            .IsRequired()
            .HasDefaultValue(false);

        // Configure owned types
        builder.OwnsOne(p => p.Metrics, metrics =>
        {
            metrics.Property(m => m.ResponseTime).HasColumnName("Metrics_ResponseTime");
            metrics.Property(m => m.Uptime).HasColumnName("Metrics_Uptime");
            metrics.Property(m => m.Cpu).HasColumnName("Metrics_Cpu");
            metrics.Property(m => m.Memory).HasColumnName("Metrics_Memory");
            metrics.Property(m => m.Requests).HasColumnName("Metrics_Requests");
            metrics.Property(m => m.Errors).HasColumnName("Metrics_Errors");
            metrics.Property(m => m.ErrorRate).HasColumnName("Metrics_ErrorRate");
            metrics.Property(m => m.Throughput).HasColumnName("Metrics_Throughput");
            metrics.Property(m => m.Latency).HasColumnName("Metrics_Latency");
            metrics.Property(m => m.Timestamp).HasColumnName("Metrics_Timestamp");
        });

        builder.OwnsOne(p => p.Config, config =>
        {
            config.Property(c => c.HealthCheckEndpoint).HasColumnName("Config_HealthCheckEndpoint").HasMaxLength(500);
            config.Property(c => c.HealthCheckInterval).HasColumnName("Config_HealthCheckInterval");
            config.Property(c => c.Timeout).HasColumnName("Config_Timeout");
            config.Property(c => c.RetryAttempts).HasColumnName("Config_RetryAttempts");
            config.Property(c => c.RetryDelay).HasColumnName("Config_RetryDelay");
            config.Property(c => c.EnableMonitoring).HasColumnName("Config_EnableMonitoring");
            config.Property(c => c.EnableAlerts).HasColumnName("Config_EnableAlerts");
            config.Property(c => c.EnableAutoRecovery).HasColumnName("Config_EnableAutoRecovery");
            config.Property(c => c.CustomHeaders)
                .HasColumnName("Config_CustomHeaders")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>());
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
        builder.HasIndex(p => p.Owner);
        builder.HasIndex(p => p.Team);
        builder.HasIndex(p => p.IsFavorite);
    }
}