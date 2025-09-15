using CentralCommand.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace CentralCommand.Api.Data;

/// <summary>
/// Application database context with Identity support
/// </summary>
public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Additional DbSets
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserAuditLog> UserAuditLogs => Set<UserAuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure schema
        builder.HasDefaultSchema("auth");

        // Rename Identity tables
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("Users");

            // Configure JSON conversions for complex types
            var preferencesConverter = new ValueConverter<UserPreferences, string>(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<UserPreferences>(v, JsonSerializerOptions.Default) ?? new UserPreferences()
            );

            var permissionsConverter = new ValueConverter<List<string>, string>(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<List<string>>(v, JsonSerializerOptions.Default) ?? new List<string>()
            );

            var restrictedPortalsConverter = new ValueConverter<List<Guid>, string>(
                v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => JsonSerializer.Deserialize<List<Guid>>(v, JsonSerializerOptions.Default) ?? new List<Guid>()
            );

            entity.Property(e => e.Preferences)
                .HasConversion(preferencesConverter)
                .HasColumnType("jsonb");

            entity.Property(e => e.Permissions)
                .HasConversion(permissionsConverter)
                .HasColumnType("jsonb");

            entity.Property(e => e.RestrictedPortals)
                .HasConversion(restrictedPortalsConverter)
                .HasColumnType("jsonb");

            // Configure enum conversions
            entity.Property(e => e.Role)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.AuthProvider)
                .HasConversion<string>()
                .HasMaxLength(50);

            entity.Property(e => e.RateLimitTier)
                .HasConversion<string>()
                .HasMaxLength(50);

            // Configure string lengths
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DisplayName).HasMaxLength(200);
            entity.Property(e => e.Avatar).HasMaxLength(500);
            entity.Property(e => e.ExternalId).HasMaxLength(255);
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.JobTitle).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(50);
            entity.Property(e => e.Timezone).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Language).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.ApiKey).HasMaxLength(255);

            // Configure indexes
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.UserName).IsUnique();
            entity.HasIndex(e => e.ApiKey).IsUnique().HasFilter("\"ApiKey\" IS NOT NULL");
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => e.AuthProvider);
        });

        builder.Entity<IdentityRole<Guid>>(entity =>
        {
            entity.ToTable("Roles");
        });

        builder.Entity<IdentityUserRole<Guid>>(entity =>
        {
            entity.ToTable("UserRoles");
        });

        builder.Entity<IdentityUserClaim<Guid>>(entity =>
        {
            entity.ToTable("UserClaims");
        });

        builder.Entity<IdentityUserLogin<Guid>>(entity =>
        {
            entity.ToTable("UserLogins");
        });

        builder.Entity<IdentityRoleClaim<Guid>>(entity =>
        {
            entity.ToTable("RoleClaims");
        });

        builder.Entity<IdentityUserToken<Guid>>(entity =>
        {
            entity.ToTable("UserTokens");
        });

        // Configure UserSession
        builder.Entity<UserSession>(entity =>
        {
            entity.ToTable("UserSessions");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Token).HasMaxLength(2048).IsRequired();
            entity.Property(e => e.RefreshToken).HasMaxLength(255);
            entity.Property(e => e.IpAddress).HasMaxLength(45).IsRequired();
            entity.Property(e => e.UserAgent).HasMaxLength(500).IsRequired();
            entity.Property(e => e.RevokedReason).HasMaxLength(500);

            // Configure JSON conversion for DeviceInfo
            var deviceInfoConverter = new ValueConverter<DeviceInfo?, string?>(
                v => v == null ? null : JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => string.IsNullOrEmpty(v) ? null : JsonSerializer.Deserialize<DeviceInfo>(v, JsonSerializerOptions.Default)
            );

            entity.Property(e => e.Device)
                .HasConversion(deviceInfoConverter)
                .HasColumnType("jsonb");

            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.IsActive);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure RefreshToken
        builder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshTokens");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Token).HasMaxLength(255).IsRequired();
            entity.Property(e => e.CreatedByIp).HasMaxLength(45).IsRequired();
            entity.Property(e => e.RevokedByIp).HasMaxLength(45);
            entity.Property(e => e.ReplacedByToken).HasMaxLength(255);
            entity.Property(e => e.ReasonRevoked).HasMaxLength(500);

            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);

            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure UserAuditLog
        builder.Entity<UserAuditLog>(entity =>
        {
            entity.ToTable("UserAuditLogs");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Action).HasMaxLength(100).IsRequired();
            entity.Property(e => e.EntityType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.EntityId).HasMaxLength(255);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.ErrorMessage).HasMaxLength(1000);

            // Configure JSON conversion for AuditChanges
            var changesConverter = new ValueConverter<AuditChanges?, string?>(
                v => v == null ? null : JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                v => string.IsNullOrEmpty(v) ? null : JsonSerializer.Deserialize<AuditChanges>(v, JsonSerializerOptions.Default)
            );

            entity.Property(e => e.Changes)
                .HasConversion(changesConverter)
                .HasColumnType("jsonb");

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.EntityType);
            entity.HasIndex(e => new { e.EntityType, e.EntityId });

            entity.HasOne(e => e.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed default roles
        SeedRoles(builder);
    }

    private static void SeedRoles(ModelBuilder builder)
    {
        var roles = new[]
        {
            new IdentityRole<Guid> { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Name = "SuperAdmin", NormalizedName = "SUPERADMIN" },
            new IdentityRole<Guid> { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Name = "Admin", NormalizedName = "ADMIN" },
            new IdentityRole<Guid> { Id = Guid.Parse("00000000-0000-0000-0000-000000000003"), Name = "Manager", NormalizedName = "MANAGER" },
            new IdentityRole<Guid> { Id = Guid.Parse("00000000-0000-0000-0000-000000000004"), Name = "Developer", NormalizedName = "DEVELOPER" },
            new IdentityRole<Guid> { Id = Guid.Parse("00000000-0000-0000-0000-000000000005"), Name = "Analyst", NormalizedName = "ANALYST" },
            new IdentityRole<Guid> { Id = Guid.Parse("00000000-0000-0000-0000-000000000006"), Name = "Viewer", NormalizedName = "VIEWER" },
            new IdentityRole<Guid> { Id = Guid.Parse("00000000-0000-0000-0000-000000000007"), Name = "Guest", NormalizedName = "GUEST" }
        };

        builder.Entity<IdentityRole<Guid>>().HasData(roles);
    }
}