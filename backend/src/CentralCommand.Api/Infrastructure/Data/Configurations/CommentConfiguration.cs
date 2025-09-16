using CentralCommand.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CentralCommand.Api.Infrastructure.Data.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("Comments");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.IncidentId)
            .IsRequired();

        builder.Property(c => c.Text)
            .IsRequired()
            .HasMaxLength(5000);

        builder.Property(c => c.Author)
            .IsRequired()
            .HasColumnType("uniqueidentifier");

        builder.Property(c => c.AuthorName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.AuthorEmail)
            .HasMaxLength(256);

        builder.Property(c => c.AuthorAvatar)
            .HasMaxLength(500);

        builder.Property(c => c.IsSystemGenerated)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(c => c.IsInternal)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(c => c.Attachments)
            .HasColumnType("nvarchar(max)");

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.UpdatedAt);

        builder.Property(c => c.CreatedBy)
            .IsRequired();

        builder.Property(c => c.UpdatedBy)
            .IsRequired();

        builder.Property(c => c.ETag)
            .IsRequired()
            .HasMaxLength(50)
            .IsConcurrencyToken();

        builder.Property(c => c.IsDeleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(c => c.DeletedAt);

        builder.Property(c => c.DeletedBy);

        // Configure relationship with Incident
        builder.HasOne(c => c.Incident)
            .WithMany(i => i.Comments)
            .HasForeignKey(c => c.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(c => c.IncidentId);
        builder.HasIndex(c => c.Author);
        builder.HasIndex(c => c.CreatedAt);
        builder.HasIndex(c => new { c.IncidentId, c.CreatedAt });
    }
}