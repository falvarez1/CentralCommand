using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace CentralCommand.Api.Infrastructure.Data;

/// <summary>
/// Application database context
/// </summary>
public class ApplicationDbContext : DbContext
{
    /// <summary>
    /// Initializes a new instance of the ApplicationDbContext
    /// </summary>
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Gets or sets the portals DbSet
    /// </summary>
    public DbSet<Portal> Portals { get; set; } = null!;

    /// <summary>
    /// Gets or sets the incidents DbSet
    /// </summary>
    public DbSet<Incident> Incidents { get; set; } = null!;

    /// <summary>
    /// Gets or sets the comments DbSet
    /// </summary>
    public DbSet<Comment> Comments { get; set; } = null!;

    /// <summary>
    /// Gets or sets the metrics history DbSet
    /// </summary>
    public DbSet<MetricsHistory> MetricsHistory { get; set; } = null!;

    /// <summary>
    /// Gets or sets the health checks DbSet
    /// </summary>
    public DbSet<HealthCheck> HealthChecks { get; set; } = null!;

    /// <inheritdoc />
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Portal entity
        modelBuilder.Entity<Portal>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Url).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.Property(e => e.Color).HasMaxLength(50);

            // Configure value object conversions
            entity.OwnsOne(e => e.Metrics, metrics =>
            {
                metrics.Property(m => m.ResponseTime);
                metrics.Property(m => m.Uptime);
                metrics.Property(m => m.Cpu);
                metrics.Property(m => m.Memory);
                metrics.Property(m => m.Requests);
                metrics.Property(m => m.Errors);
                metrics.Property(m => m.ErrorRate);
                metrics.Property(m => m.Throughput);
                metrics.Property(m => m.Latency);
            });

            entity.OwnsOne(e => e.Config, config =>
            {
                config.Property(c => c.HealthCheckEndpoint).HasMaxLength(500);
                config.Property(c => c.HealthCheckInterval);
                config.Property(c => c.Timeout);
                config.Property(c => c.RetryAttempts);
                config.Property(c => c.RetryDelay);
                config.Property(c => c.EnableMonitoring);
                config.Property(c => c.EnableAlerts);
                config.Property(c => c.EnableAutoRecovery);

                // Convert dictionary to JSON
                config.Property(c => c.CustomHeaders)
                    .HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                        v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>())
                    .HasColumnType("nvarchar(max)");
            });

            // Configure JSON columns
            entity.Property(e => e.AuthConfig).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Tags).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Maintainers).HasColumnType("nvarchar(max)");

            // Configure relationships
            entity.HasMany(e => e.MetricsHistory)
                .WithOne(m => m.Portal)
                .HasForeignKey(m => m.PortalId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.HealthChecks)
                .WithOne(h => h.Portal)
                .HasForeignKey(h => h.PortalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure indexes
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Environment);
            entity.HasIndex(e => e.Team);
            entity.HasIndex(e => e.Owner);
            entity.HasIndex(e => e.IsDeleted);

            // Configure soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure Incident entity
        modelBuilder.Entity<Incident>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(5000);
            entity.Property(e => e.RootCause).HasMaxLength(5000);
            entity.Property(e => e.Resolution).HasMaxLength(5000);
            entity.Property(e => e.PostmortemUrl).HasMaxLength(500);

            // Configure JSON columns
            entity.Property(e => e.AffectedPortals).HasColumnType("nvarchar(max)");
            entity.Property(e => e.AffectedServices).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Tags).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Timeline).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Metrics).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Notifications).HasColumnType("nvarchar(max)");
            entity.Property(e => e.RelatedIncidents).HasColumnType("nvarchar(max)");

            // Configure relationships
            entity.HasMany(e => e.Comments)
                .WithOne(c => c.Incident)
                .HasForeignKey(c => c.IncidentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure indexes
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.Severity);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Assignee);
            entity.HasIndex(e => e.Team);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsDeleted);

            // Configure soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure Comment entity
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Text).IsRequired().HasMaxLength(5000);
            entity.Property(e => e.Attachments).HasColumnType("nvarchar(max)");

            // Configure indexes
            entity.HasIndex(e => e.IncidentId);
            entity.HasIndex(e => e.IsDeleted);

            // Configure soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure MetricsHistory entity
        modelBuilder.Entity<MetricsHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Anomalies).HasMaxLength(1000);

            // Configure value object
            entity.OwnsOne(e => e.Metrics, metrics =>
            {
                metrics.Property(m => m.ResponseTime);
                metrics.Property(m => m.Uptime);
                metrics.Property(m => m.Cpu);
                metrics.Property(m => m.Memory);
                metrics.Property(m => m.Requests);
                metrics.Property(m => m.Errors);
                metrics.Property(m => m.ErrorRate);
                metrics.Property(m => m.Throughput);
                metrics.Property(m => m.Latency);
            });

            // Configure indexes
            entity.HasIndex(e => e.PortalId);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.IsDeleted);

            // Configure soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure HealthCheck entity
        modelBuilder.Entity<HealthCheck>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Endpoint).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Method).HasMaxLength(10);
            entity.Property(e => e.LastError).HasMaxLength(1000);
            entity.Property(e => e.Headers).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Body).HasColumnType("nvarchar(max)");

            // Configure indexes
            entity.HasIndex(e => e.PortalId);
            entity.HasIndex(e => e.IsEnabled);
            entity.HasIndex(e => e.IsDeleted);

            // Configure soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Apply global query filters for soft delete
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(Core.Domain.Common.BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .Property<bool>("IsDeleted")
                    .HasDefaultValue(false);
            }
        }
    }

    /// <inheritdoc />
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is Core.Domain.Common.BaseEntity &&
                       (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (Core.Domain.Common.BaseEntity)entry.Entity;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
                entity.UpdatedAt = DateTime.UtcNow;
                entity.ETag = Guid.NewGuid().ToString();
            }
            else if (entry.State == EntityState.Modified)
            {
                entity.UpdatedAt = DateTime.UtcNow;
                entity.ETag = Guid.NewGuid().ToString();
            }
        }
    }
}