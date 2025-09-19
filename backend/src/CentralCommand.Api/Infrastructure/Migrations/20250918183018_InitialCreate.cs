using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CentralCommand.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Incidents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AffectedPortals = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AffectedPortalIds = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AffectedServices = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImpactedUsers = table.Column<int>(type: "int", nullable: true),
                    Assignee = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AssigneeName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    AssigneeEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    AssignedTo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Team = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReportedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReporterName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ReporterEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AcknowledgedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RootCause = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: true),
                    Resolution = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    PostmortemUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Tags = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Timeline = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Metrics = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notifications = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RelatedIncidents = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    EstimatedResolutionTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DetectionSource = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ExternalTicketRef = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IncidentUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ETag = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Portals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Environment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AuthType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AuthConfig = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Metrics_ResponseTime = table.Column<double>(type: "float", nullable: false),
                    Metrics_Uptime = table.Column<double>(type: "float", nullable: false),
                    Metrics_Cpu = table.Column<double>(type: "float", nullable: false),
                    Metrics_Memory = table.Column<double>(type: "float", nullable: false),
                    Metrics_Requests = table.Column<int>(type: "int", nullable: false),
                    Metrics_Errors = table.Column<int>(type: "int", nullable: false),
                    Metrics_ErrorRate = table.Column<double>(type: "float", nullable: false),
                    Metrics_Throughput = table.Column<double>(type: "float", nullable: false),
                    Metrics_Latency = table.Column<double>(type: "float", nullable: false),
                    Metrics_RequestsPerMinute = table.Column<int>(type: "int", nullable: false),
                    Metrics_Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Metrics_AverageLoadTime = table.Column<double>(type: "float", nullable: false),
                    Metrics_PeakResponseTime = table.Column<double>(type: "float", nullable: false),
                    Metrics_LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MetricsHistoryJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastChecked = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastCheckedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastIncident = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastStatusChange = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StatusReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Config_HealthCheckEndpoint = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Config_HealthCheckInterval = table.Column<int>(type: "int", nullable: false),
                    Config_Timeout = table.Column<int>(type: "int", nullable: false),
                    Config_RetryAttempts = table.Column<int>(type: "int", nullable: false),
                    Config_RetryDelay = table.Column<int>(type: "int", nullable: false),
                    Config_CustomHeaders = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Config_EnableMonitoring = table.Column<bool>(type: "bit", nullable: false),
                    Config_EnableAlerts = table.Column<bool>(type: "bit", nullable: false),
                    Config_EnableAutoRecovery = table.Column<bool>(type: "bit", nullable: false),
                    Config_CheckInterval = table.Column<int>(type: "int", nullable: false),
                    Config_AlertThreshold = table.Column<double>(type: "float", nullable: false),
                    Config_IsMonitoringEnabled = table.Column<bool>(type: "bit", nullable: false),
                    Config_RetryCount = table.Column<int>(type: "int", nullable: false),
                    Config_NotificationEmails = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Icon = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Tags = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsFavorite = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Owner = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Team = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Maintainers = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ETag = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Portals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Comments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IncidentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Author = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AuthorEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    AuthorAvatar = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsSystemGenerated = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsInternal = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Attachments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IncidentId1 = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ETag = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comments_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Comments_Incidents_IncidentId1",
                        column: x => x.IncidentId1,
                        principalTable: "Incidents",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "HealthChecks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PortalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Endpoint = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Method = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "GET"),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExpectedStatusCode = table.Column<int>(type: "int", nullable: false, defaultValue: 200),
                    Timeout = table.Column<int>(type: "int", nullable: false, defaultValue: 5000),
                    Interval = table.Column<int>(type: "int", nullable: false, defaultValue: 30),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    LastChecked = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    LastResponseTime = table.Column<double>(type: "float", nullable: true),
                    LastError = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ConsecutiveFailures = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    Headers = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PortalId1 = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ETag = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthChecks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HealthChecks_Portals_PortalId",
                        column: x => x.PortalId,
                        principalTable: "Portals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HealthChecks_Portals_PortalId1",
                        column: x => x.PortalId1,
                        principalTable: "Portals",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MetricsHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PortalId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Metrics_ResponseTime = table.Column<double>(type: "float", nullable: false),
                    Metrics_Uptime = table.Column<double>(type: "float", nullable: false),
                    Metrics_Cpu = table.Column<double>(type: "float", nullable: false),
                    Metrics_Memory = table.Column<double>(type: "float", nullable: false),
                    Metrics_Requests = table.Column<int>(type: "int", nullable: false),
                    Metrics_Errors = table.Column<int>(type: "int", nullable: false),
                    Metrics_ErrorRate = table.Column<double>(type: "float", nullable: false),
                    Metrics_Throughput = table.Column<double>(type: "float", nullable: false),
                    Metrics_Latency = table.Column<double>(type: "float", nullable: false),
                    Metrics_RequestsPerMinute = table.Column<int>(type: "int", nullable: false),
                    Metrics_Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Metrics_AverageLoadTime = table.Column<double>(type: "float", nullable: false),
                    Metrics_PeakResponseTime = table.Column<double>(type: "float", nullable: false),
                    Metrics_LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Anomalies = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    PortalId1 = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ResponseTime = table.Column<double>(type: "float", nullable: false),
                    Uptime = table.Column<double>(type: "float", nullable: false),
                    ErrorRate = table.Column<double>(type: "float", nullable: false),
                    RequestsPerMinute = table.Column<int>(type: "int", nullable: false),
                    Cpu = table.Column<double>(type: "float", nullable: false),
                    Memory = table.Column<double>(type: "float", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ETag = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetricsHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MetricsHistory_Portals_PortalId",
                        column: x => x.PortalId,
                        principalTable: "Portals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MetricsHistory_Portals_PortalId1",
                        column: x => x.PortalId1,
                        principalTable: "Portals",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Comments_Author",
                table: "Comments",
                column: "Author");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_CreatedAt",
                table: "Comments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_IncidentId",
                table: "Comments",
                column: "IncidentId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_IncidentId_CreatedAt",
                table: "Comments",
                columns: new[] { "IncidentId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Comments_IncidentId1",
                table: "Comments",
                column: "IncidentId1");

            migrationBuilder.CreateIndex(
                name: "IX_HealthChecks_IsEnabled",
                table: "HealthChecks",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_HealthChecks_LastChecked",
                table: "HealthChecks",
                column: "LastChecked");

            migrationBuilder.CreateIndex(
                name: "IX_HealthChecks_PortalId",
                table: "HealthChecks",
                column: "PortalId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthChecks_PortalId_IsEnabled",
                table: "HealthChecks",
                columns: new[] { "PortalId", "IsEnabled" });

            migrationBuilder.CreateIndex(
                name: "IX_HealthChecks_PortalId1",
                table: "HealthChecks",
                column: "PortalId1");

            migrationBuilder.CreateIndex(
                name: "IX_HealthChecks_Status",
                table: "HealthChecks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Assignee",
                table: "Incidents",
                column: "Assignee");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_CreatedAt",
                table: "Incidents",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Priority",
                table: "Incidents",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Severity",
                table: "Incidents",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Status",
                table: "Incidents",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Status_Priority",
                table: "Incidents",
                columns: new[] { "Status", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Team",
                table: "Incidents",
                column: "Team");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_Type",
                table: "Incidents",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_MetricsHistory_PortalId",
                table: "MetricsHistory",
                column: "PortalId");

            migrationBuilder.CreateIndex(
                name: "IX_MetricsHistory_PortalId_Timestamp",
                table: "MetricsHistory",
                columns: new[] { "PortalId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_MetricsHistory_PortalId1",
                table: "MetricsHistory",
                column: "PortalId1");

            migrationBuilder.CreateIndex(
                name: "IX_MetricsHistory_Timestamp",
                table: "MetricsHistory",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Category",
                table: "Portals",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Environment",
                table: "Portals",
                column: "Environment");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_IsFavorite",
                table: "Portals",
                column: "IsFavorite");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Name",
                table: "Portals",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Owner",
                table: "Portals",
                column: "Owner");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Priority",
                table: "Portals",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Status",
                table: "Portals",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Status_Environment",
                table: "Portals",
                columns: new[] { "Status", "Environment" });

            migrationBuilder.CreateIndex(
                name: "IX_Portals_Team",
                table: "Portals",
                column: "Team");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Comments");

            migrationBuilder.DropTable(
                name: "HealthChecks");

            migrationBuilder.DropTable(
                name: "MetricsHistory");

            migrationBuilder.DropTable(
                name: "Incidents");

            migrationBuilder.DropTable(
                name: "Portals");
        }
    }
}
