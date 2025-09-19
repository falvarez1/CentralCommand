using CentralCommand.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CentralCommand.Api.Infrastructure.Data.Configurations;

public class MetricsHistoryConfiguration : IEntityTypeConfiguration<MetricsHistory>
{
    public void Configure(EntityTypeBuilder<MetricsHistory> builder)
    {
        builder.ToTable("MetricsHistory");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.PortalId)
            .IsRequired();

        builder.Property(m => m.Timestamp)
            .IsRequired();

        builder.Property(m => m.Anomalies)
            .HasMaxLength(1000);

        builder.Property(m => m.CreatedAt)
            .IsRequired();

        builder.Property(m => m.UpdatedAt);

        builder.Property(m => m.CreatedBy)
            .IsRequired();

        builder.Property(m => m.UpdatedBy)
            .IsRequired();

        builder.Property(m => m.ETag)
            .IsRequired()
            .HasMaxLength(50)
            .IsConcurrencyToken();

        builder.Property(m => m.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(m => m.DeletedAt);

        builder.Property(m => m.DeletedBy);

        // Configure owned type for Metrics
        builder.OwnsOne(m => m.Metrics, metrics =>
        {
            metrics.Property(p => p.ResponseTime).HasColumnName("Metrics_ResponseTime");
            metrics.Property(p => p.Uptime).HasColumnName("Metrics_Uptime");
            metrics.Property(p => p.Cpu).HasColumnName("Metrics_Cpu");
            metrics.Property(p => p.Memory).HasColumnName("Metrics_Memory");
            metrics.Property(p => p.Requests).HasColumnName("Metrics_Requests");
            metrics.Property(p => p.Errors).HasColumnName("Metrics_Errors");
            metrics.Property(p => p.ErrorRate).HasColumnName("Metrics_ErrorRate");
            metrics.Property(p => p.Throughput).HasColumnName("Metrics_Throughput");
            metrics.Property(p => p.Latency).HasColumnName("Metrics_Latency");
            metrics.Property(p => p.Timestamp).HasColumnName("Metrics_Timestamp");
        });

        // Configure relationship with Portal
        builder.HasOne(m => m.Portal)
            .WithMany(p => p.MetricsHistory)
            .HasForeignKey(m => m.PortalId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(m => m.PortalId);
        builder.HasIndex(m => m.Timestamp);
        builder.HasIndex(m => new { m.PortalId, m.Timestamp });
    }
}