using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CentralCommand.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialSupabaseSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "CategoryStatistics",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PortalCount = table.Column<int>(type: "integer", nullable: false),
                    OnlineCount = table.Column<int>(type: "integer", nullable: false),
                    OfflineCount = table.Column<int>(type: "integer", nullable: false),
                    IncidentCount = table.Column<int>(type: "integer", nullable: false),
                    AverageUptime = table.Column<double>(type: "double precision", nullable: false),
                    AverageResponseTime = table.Column<double>(type: "double precision", nullable: false),
                    TotalUsers = table.Column<int>(type: "integer", nullable: false),
                    Granularity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryStatistics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Portals",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Environment = table.Column<int>(type: "integer", nullable: false),
                    IsFavorite = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    ResponseTime = table.Column<int>(type: "integer", nullable: false),
                    Uptime = table.Column<double>(type: "double precision", nullable: false),
                    ErrorRate = table.Column<int>(type: "integer", nullable: false),
                    ActiveUsers = table.Column<int>(type: "integer", nullable: false),
                    CpuUsage = table.Column<double>(type: "double precision", nullable: false),
                    MemoryUsage = table.Column<double>(type: "double precision", nullable: false),
                    LastCheckedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastIncidentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    HealthCheckEndpoint = table.Column<string>(type: "text", nullable: true),
                    HealthCheckInterval = table.Column<int>(type: "integer", nullable: false),
                    HealthCheckTimeout = table.Column<int>(type: "integer", nullable: false),
                    HealthCheckMethod = table.Column<string>(type: "text", nullable: true),
                    HealthCheckHeaders = table.Column<string>(type: "text", nullable: true),
                    ExpectedStatusCode = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: true),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: true),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    Metadata = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Portals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Portals_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Portals_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Portals_Users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "SystemStatistics",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalPortals = table.Column<int>(type: "integer", nullable: false),
                    OnlinePortals = table.Column<int>(type: "integer", nullable: false),
                    OfflinePortals = table.Column<int>(type: "integer", nullable: false),
                    DegradedPortals = table.Column<int>(type: "integer", nullable: false),
                    MaintenancePortals = table.Column<int>(type: "integer", nullable: false),
                    TotalIncidents = table.Column<int>(type: "integer", nullable: false),
                    OpenIncidents = table.Column<int>(type: "integer", nullable: false),
                    InProgressIncidents = table.Column<int>(type: "integer", nullable: false),
                    ResolvedIncidents = table.Column<int>(type: "integer", nullable: false),
                    CriticalIncidents = table.Column<int>(type: "integer", nullable: false),
                    HighIncidents = table.Column<int>(type: "integer", nullable: false),
                    MediumIncidents = table.Column<int>(type: "integer", nullable: false),
                    LowIncidents = table.Column<int>(type: "integer", nullable: false),
                    AverageResponseTime = table.Column<double>(type: "double precision", nullable: false),
                    AverageUptime = table.Column<double>(type: "double precision", nullable: false),
                    AverageErrorRate = table.Column<double>(type: "double precision", nullable: false),
                    TotalActiveUsers = table.Column<int>(type: "integer", nullable: false),
                    AverageCpuUsage = table.Column<double>(type: "double precision", nullable: false),
                    AverageMemoryUsage = table.Column<double>(type: "double precision", nullable: false),
                    UptimeTrend = table.Column<double>(type: "double precision", nullable: false),
                    ResponseTimeTrend = table.Column<double>(type: "double precision", nullable: false),
                    ErrorRateTrend = table.Column<double>(type: "double precision", nullable: false),
                    IncidentTrend = table.Column<double>(type: "double precision", nullable: false),
                    MeanTimeToRecovery = table.Column<double>(type: "double precision", nullable: false),
                    MeanTimeBetweenFailures = table.Column<double>(type: "double precision", nullable: false),
                    MeanTimeToAcknowledge = table.Column<double>(type: "double precision", nullable: false),
                    MeanTimeToResolve = table.Column<double>(type: "double precision", nullable: false),
                    ActiveUsersLast24Hours = table.Column<int>(type: "integer", nullable: false),
                    ActiveUsersLast7Days = table.Column<int>(type: "integer", nullable: false),
                    ActiveUsersLast30Days = table.Column<int>(type: "integer", nullable: false),
                    TotalUsers = table.Column<int>(type: "integer", nullable: false),
                    EstimatedRevenueLossToday = table.Column<double>(type: "double precision", nullable: false),
                    EstimatedRevenueLossThisWeek = table.Column<double>(type: "double precision", nullable: false),
                    EstimatedRevenueLossThisMonth = table.Column<double>(type: "double precision", nullable: false),
                    TotalDowntimeMinutesToday = table.Column<int>(type: "integer", nullable: false),
                    TotalDowntimeMinutesThisWeek = table.Column<int>(type: "integer", nullable: false),
                    TotalDowntimeMinutesThisMonth = table.Column<int>(type: "integer", nullable: false),
                    SlaComplianceRate = table.Column<double>(type: "double precision", nullable: false),
                    SlaBreachesToday = table.Column<int>(type: "integer", nullable: false),
                    SlaBreachesThisWeek = table.Column<int>(type: "integer", nullable: false),
                    SlaBreachesThisMonth = table.Column<int>(type: "integer", nullable: false),
                    AlertsTriggeredToday = table.Column<int>(type: "integer", nullable: false),
                    AlertsTriggeredThisWeek = table.Column<int>(type: "integer", nullable: false),
                    AlertsTriggeredThisMonth = table.Column<int>(type: "integer", nullable: false),
                    AlertsAcknowledgedToday = table.Column<int>(type: "integer", nullable: false),
                    AlertsIgnoredToday = table.Column<int>(type: "integer", nullable: false),
                    CalculationNotes = table.Column<string>(type: "text", nullable: true),
                    AdditionalMetrics = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemStatistics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TeamStatistics",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ManagedPortals = table.Column<int>(type: "integer", nullable: false),
                    AssignedIncidents = table.Column<int>(type: "integer", nullable: false),
                    ResolvedIncidents = table.Column<int>(type: "integer", nullable: false),
                    AverageResolutionTime = table.Column<double>(type: "double precision", nullable: false),
                    AverageResponseTime = table.Column<double>(type: "double precision", nullable: false),
                    SlaComplianceRate = table.Column<double>(type: "double precision", nullable: false),
                    TeamMemberCount = table.Column<int>(type: "integer", nullable: false),
                    TeamProductivityScore = table.Column<double>(type: "double precision", nullable: false),
                    Granularity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamStatistics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Incidents",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PortalId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssignedToId = table.Column<Guid>(type: "uuid", nullable: true),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: true),
                    AffectedUsers = table.Column<int>(type: "integer", nullable: false),
                    AffectedServices = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DetectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AcknowledgedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Resolution = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    RootCause = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ResolutionTimeMinutes = table.Column<int>(type: "integer", nullable: true),
                    EstimatedRevenueLoss = table.Column<double>(type: "double precision", nullable: true),
                    EstimatedDowntimeMinutes = table.Column<int>(type: "integer", nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    Metadata = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsEscalated = table.Column<bool>(type: "boolean", nullable: false),
                    EscalatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EscalatedToId = table.Column<Guid>(type: "uuid", nullable: true),
                    ExternalTicketId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ExternalTicketUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Incidents_Portals_PortalId",
                        column: x => x.PortalId,
                        principalSchema: "public",
                        principalTable: "Portals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Incidents_Users_AssignedToId",
                        column: x => x.AssignedToId,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Incidents_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Incidents_Users_UpdatedById",
                        column: x => x.UpdatedById,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PortalMetricHistory",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PortalId = table.Column<Guid>(type: "uuid", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResponseTime = table.Column<int>(type: "integer", nullable: false),
                    Uptime = table.Column<double>(type: "double precision", nullable: false),
                    ErrorRate = table.Column<int>(type: "integer", nullable: false),
                    ActiveUsers = table.Column<int>(type: "integer", nullable: false),
                    CpuUsage = table.Column<double>(type: "double precision", nullable: false),
                    MemoryUsage = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PortalMetricHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PortalMetricHistory_Portals_PortalId",
                        column: x => x.PortalId,
                        principalSchema: "public",
                        principalTable: "Portals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SparklineDataPoints",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MetricName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Value = table.Column<double>(type: "double precision", nullable: false),
                    Unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PortalId = table.Column<Guid>(type: "uuid", nullable: true),
                    Granularity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SparklineDataPoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SparklineDataPoints_Portals_PortalId",
                        column: x => x.PortalId,
                        principalSchema: "public",
                        principalTable: "Portals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IncidentComments",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IncidentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    IsInternal = table.Column<bool>(type: "boolean", nullable: false),
                    IsSystemGenerated = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    EditedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EditedById = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncidentComments_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalSchema: "public",
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IncidentComments_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_IncidentComments_Users_EditedById",
                        column: x => x.EditedById,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "IncidentStatusHistory",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IncidentId = table.Column<Guid>(type: "uuid", nullable: false),
                    OldStatus = table.Column<int>(type: "integer", nullable: false),
                    NewStatus = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ChangedById = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentStatusHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncidentStatusHistory_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalSchema: "public",
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IncidentStatusHistory_Users_ChangedById",
                        column: x => x.ChangedById,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CategoryStatistics_Category_Timestamp",
                schema: "public",
                table: "CategoryStatistics",
                columns: new[] { "Category", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_IncidentComments_CreatedById",
                schema: "public",
                table: "IncidentComments",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentComments_EditedById",
                schema: "public",
                table: "IncidentComments",
                column: "EditedById");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentComments_IncidentId_CreatedAt",
                schema: "public",
                table: "IncidentComments",
                columns: new[] { "IncidentId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_AssignedToId",
                schema: "public",
                table: "Incidents",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_CreatedAt",
                schema: "public",
                table: "Incidents",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_CreatedById",
                schema: "public",
                table: "Incidents",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_PortalId",
                schema: "public",
                table: "Incidents",
                column: "PortalId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Priority",
                schema: "public",
                table: "Incidents",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Severity",
                schema: "public",
                table: "Incidents",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Status",
                schema: "public",
                table: "Incidents",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_UpdatedById",
                schema: "public",
                table: "Incidents",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentStatusHistory_ChangedById",
                schema: "public",
                table: "IncidentStatusHistory",
                column: "ChangedById");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentStatusHistory_IncidentId_ChangedAt",
                schema: "public",
                table: "IncidentStatusHistory",
                columns: new[] { "IncidentId", "ChangedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PortalMetricHistory_PortalId_Timestamp",
                schema: "public",
                table: "PortalMetricHistory",
                columns: new[] { "PortalId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Category",
                schema: "public",
                table: "Portals",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_CreatedById",
                schema: "public",
                table: "Portals",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Environment",
                schema: "public",
                table: "Portals",
                column: "Environment");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_IsActive",
                schema: "public",
                table: "Portals",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Name",
                schema: "public",
                table: "Portals",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_OwnerId",
                schema: "public",
                table: "Portals",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Status",
                schema: "public",
                table: "Portals",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_UpdatedById",
                schema: "public",
                table: "Portals",
                column: "UpdatedById");

            migrationBuilder.CreateIndex(
                name: "IX_SparklineDataPoints_MetricName_Timestamp",
                schema: "public",
                table: "SparklineDataPoints",
                columns: new[] { "MetricName", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_SparklineDataPoints_PortalId_MetricName_Timestamp",
                schema: "public",
                table: "SparklineDataPoints",
                columns: new[] { "PortalId", "MetricName", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_SystemStatistics_Timestamp",
                schema: "public",
                table: "SystemStatistics",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_TeamStatistics_TeamId_Timestamp",
                schema: "public",
                table: "TeamStatistics",
                columns: new[] { "TeamId", "Timestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategoryStatistics",
                schema: "public");

            migrationBuilder.DropTable(
                name: "IncidentComments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "IncidentStatusHistory",
                schema: "public");

            migrationBuilder.DropTable(
                name: "PortalMetricHistory",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SparklineDataPoints",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SystemStatistics",
                schema: "public");

            migrationBuilder.DropTable(
                name: "TeamStatistics",
                schema: "public");

            migrationBuilder.DropTable(
                name: "Incidents",
                schema: "public");

            migrationBuilder.DropTable(
                name: "Portals",
                schema: "public");
        }
    }
}
