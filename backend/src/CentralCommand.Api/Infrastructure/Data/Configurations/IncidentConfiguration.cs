using CentralCommand.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;

namespace CentralCommand.Api.Infrastructure.Data.Configurations;

public class IncidentConfiguration : IEntityTypeConfiguration<Incident>
{
    public void Configure(EntityTypeBuilder<Incident> builder)
    {
        builder.ToTable("Incidents");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Title)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(i => i.Description)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(i => i.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(i => i.Priority)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(i => i.Severity)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(i => i.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(i => i.ReportedBy)
            .HasColumnType("uniqueidentifier");

        builder.Property(i => i.Assignee)
            .HasColumnType("uniqueidentifier");

        builder.Property(i => i.AssigneeName)
            .HasMaxLength(200);

        builder.Property(i => i.AssigneeEmail)
            .HasMaxLength(256);

        builder.Property(i => i.AssignedTo)
            .HasMaxLength(200);

        builder.Property(i => i.Team)
            .HasColumnType("uniqueidentifier");

        builder.Property(i => i.ReporterName)
            .HasMaxLength(200);

        builder.Property(i => i.ReporterEmail)
            .HasMaxLength(256);

        builder.Property(i => i.Resolution)
            .HasMaxLength(4000);

        builder.Property(i => i.CreatedAt)
            .IsRequired();

        builder.Property(i => i.UpdatedAt);

        builder.Property(i => i.CreatedBy)
            .IsRequired();

        builder.Property(i => i.UpdatedBy)
            .IsRequired();

        builder.Property(i => i.ETag)
            .IsRequired()
            .HasMaxLength(50)
            .IsConcurrencyToken();

        builder.Property(i => i.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(i => i.DeletedAt);

        builder.Property(i => i.DeletedBy);

        builder.Property(i => i.ResolvedAt);

        builder.Property(i => i.AcknowledgedAt);

        builder.Property(i => i.EstimatedResolutionTime);

        builder.Property(i => i.RootCause)
            .HasMaxLength(5000);

        builder.Property(i => i.PostmortemUrl)
            .HasMaxLength(500);

        builder.Property(i => i.DetectionSource)
            .HasMaxLength(200);

        builder.Property(i => i.ExternalTicketRef)
            .HasMaxLength(200);

        builder.Property(i => i.IncidentUrl)
            .HasMaxLength(500);

        builder.Property(i => i.IsPublic)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(i => i.ImpactedUsers);

        // JSON serialized properties
        builder.Property(i => i.AffectedPortals)
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.AffectedPortalIds)
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.AffectedServices)
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.Tags)
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.Timeline)
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.Metrics)
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.Notifications)
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.RelatedIncidents)
            .HasColumnType("nvarchar(max)");

        // Configure relationships

        builder.HasMany(i => i.Comments)
            .WithOne()
            .HasForeignKey("IncidentId")
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(i => i.Status);
        builder.HasIndex(i => i.Priority);
        builder.HasIndex(i => i.Type);
        builder.HasIndex(i => i.CreatedAt);
        builder.HasIndex(i => new { i.Status, i.Priority });
        builder.HasIndex(i => i.Severity);
        builder.HasIndex(i => i.Team);
        builder.HasIndex(i => i.Assignee);
    }
}