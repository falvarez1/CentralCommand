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

        builder.Property(i => i.Type)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(i => i.ReportedBy)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(i => i.AssignedTo)
            .HasMaxLength(200);

        builder.Property(i => i.Resolution)
            .HasMaxLength(4000);

        builder.Property(i => i.CreatedAt)
            .IsRequired();

        builder.Property(i => i.UpdatedAt);

        builder.Property(i => i.ResolvedAt);

        builder.Property(i => i.AffectedPortalIds)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions?)null) ?? new List<Guid>())
            .HasColumnType("nvarchar(max)");

        builder.Property(i => i.Tags)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>())
            .HasColumnType("nvarchar(max)");

        // Configure owned collections
        builder.OwnsMany(i => i.Timeline, timeline =>
        {
            timeline.ToTable("IncidentTimeline");
            timeline.WithOwner().HasForeignKey("IncidentId");
            timeline.Property(t => t.Timestamp).IsRequired();
            timeline.Property(t => t.Action).IsRequired().HasMaxLength(500);
            timeline.Property(t => t.User).IsRequired().HasMaxLength(200);
            timeline.Property(t => t.Details).HasMaxLength(2000);
            timeline.HasKey("IncidentId", "Id");
        });

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
    }
}