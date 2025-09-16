using CentralCommand.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CentralCommand.Api.Infrastructure.Data.Configurations;

public class HealthCheckConfiguration : IEntityTypeConfiguration<HealthCheck>
{
    public void Configure(EntityTypeBuilder<HealthCheck> builder)
    {
        builder.ToTable("HealthChecks");

        builder.HasKey(h => h.Id);

        builder.Property(h => h.PortalId)
            .IsRequired();

        builder.Property(h => h.Endpoint)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(h => h.Method)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("GET");

        builder.Property(h => h.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(h => h.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(h => h.ExpectedStatusCode)
            .IsRequired()
            .HasDefaultValue(200);

        builder.Property(h => h.Timeout)
            .IsRequired()
            .HasDefaultValue(5000);

        builder.Property(h => h.Interval)
            .IsRequired()
            .HasDefaultValue(30);

        builder.Property(h => h.IsEnabled)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(h => h.LastChecked);

        builder.Property(h => h.LastStatus)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(h => h.LastResponseTime);

        builder.Property(h => h.LastError)
            .HasMaxLength(1000);

        builder.Property(h => h.ConsecutiveFailures)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(h => h.Headers)
            .HasColumnType("nvarchar(max)");

        builder.Property(h => h.Body)
            .HasColumnType("nvarchar(max)");

        builder.Property(h => h.CreatedAt)
            .IsRequired();

        builder.Property(h => h.UpdatedAt);

        builder.Property(h => h.CreatedBy)
            .IsRequired();

        builder.Property(h => h.UpdatedBy)
            .IsRequired();

        builder.Property(h => h.ETag)
            .IsRequired()
            .HasMaxLength(50)
            .IsConcurrencyToken();

        builder.Property(h => h.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(h => h.DeletedAt);

        builder.Property(h => h.DeletedBy);

        // Configure relationship with Portal
        builder.HasOne(h => h.Portal)
            .WithMany(p => p.HealthChecks)
            .HasForeignKey(h => h.PortalId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(h => h.PortalId);
        builder.HasIndex(h => h.Status);
        builder.HasIndex(h => h.LastChecked);
        builder.HasIndex(h => h.IsEnabled);
        builder.HasIndex(h => new { h.PortalId, h.IsEnabled });
    }
}