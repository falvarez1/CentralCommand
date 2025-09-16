# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Required Reading
**IMPORTANT**: All development in this codebase MUST follow the standards defined in:
- [Software Design Standards](./docs/SOFTWARE-DESIGN-STANDARDS.md) - **READ THIS FIRST**

These standards are non-negotiable and must be applied to all code changes, refactoring, and new development.

## Project Overview

Central Command - An enterprise portal management system built with clean architecture principles:

### Monorepo Structure
```
CentralCommand/
├── apps/
│   └── api/
│       ├── CentralCommand.Api/        # Main API (.NET 9)
│       └── CentralCommand.MockApi/    # Mock API for development
├── libs/
│   └── CentralCommand.Core/           # Shared domain models, DTOs, interfaces
├── central-command-react/              # React frontend application
└── prototype/                          # HTML prototype
```

### Key Architectural Decisions

1. **Clean Architecture**: Domain-driven design with clear layer separation
2. **Shared Core Library**: All domain models, DTOs, and interfaces in `CentralCommand.Core`
3. **No AutoMapper**: Simple extension methods for object mapping (see `MappingExtensions.cs`)
4. **CQRS Pattern**: Command/Query separation using MediatR
5. **Repository Pattern**: For data access abstraction
6. **Value Objects**: Rich domain models with business logic

## Commands

### API Projects

```bash
# Build entire solution
dotnet build

# Run main API
cd apps/api/CentralCommand.Api
dotnet run --urls http://localhost:5000

# Run mock API
cd apps/api/CentralCommand.MockApi
dotnet run --urls http://localhost:5001

# Run tests
dotnet test

# Clean solution
dotnet clean
```

### React Frontend

```bash
cd central-command-react

# Development
npm install          # Install dependencies
npm run dev          # Start development server at http://localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint

# Testing
npm run test         # Run all Playwright tests
npm run test:e2e     # Run end-to-end tests only
```

## Architecture

### Core Library (CentralCommand.Core)

The `CentralCommand.Core` library contains all shared components:

#### Domain Layer
- **Entities**: `Portal`, `Incident`, `Comment`, `HealthCheck`, `MetricsHistory`
- **Value Objects**: `PortalConfig`, `PortalMetrics`, `TimelineEntry`
- **Enums**: `PortalStatus`, `PortalCategory`, `IncidentStatus`, `IncidentPriority`, etc.

#### DTOs
- **Requests**: Command and query DTOs for API operations
- **Responses**: Response DTOs for API responses
- **Common**: Shared DTOs like `ApiResponse`, `PagedResult`

#### Interfaces
- **Repositories**: `IPortalRepository`, `IIncidentRepository`, `IRepository<T>`
- **Services**: Service interfaces for business logic

#### Extensions
- **MappingExtensions**: Extension methods for mapping between entities and DTOs
  - `ToResponse()` - Convert entities to response DTOs
  - `ToEntity()` - Convert request DTOs to entities
  - `UpdateFrom()` - Update entities from request DTOs

### API Project (CentralCommand.Api)

#### Application Layer (CQRS)
- **Commands**: Create, Update, Delete operations
- **Queries**: Read operations
- **Handlers**: MediatR handlers for commands and queries
- **Validators**: FluentValidation validators

#### Infrastructure Layer
- **Data**: Entity Framework Core with SQL Server
- **Services**: Implementation of service interfaces
- **Middleware**: Authentication, error handling, etc.
- **Background Services**: Metrics collection, health checks

#### Controllers
RESTful API controllers exposing endpoints for:
- Portals management
- Incidents tracking
- Statistics and metrics
- Health monitoring

### Key Patterns and Practices

#### Object Mapping
Instead of AutoMapper, we use extension methods:
```csharp
// Entity to Response
var response = portal.ToResponse();

// Request to Entity
var portal = request.ToEntity();

// Update Entity from Request
portal.UpdateFrom(request);
```

#### Repository Pattern
```csharp
public interface IPortalRepository : IRepository<Portal>
{
    Task<Portal?> GetByIdWithDetailsAsync(Guid id);
    Task<PagedResult<Portal>> GetPagedAsync(PortalQuery query);
    // Domain-specific methods
}
```

#### CQRS with MediatR
```csharp
// Command
public record CreatePortalCommand : IRequest<PortalResponse> { }

// Handler
public class CreatePortalCommandHandler : IRequestHandler<CreatePortalCommand, PortalResponse>
{
    public async Task<PortalResponse> Handle(CreatePortalCommand request, CancellationToken cancellationToken)
    {
        // Business logic
    }
}
```

## Development Guidelines

### Code Organization
1. **Domain Logic**: Keep in Core library entities and value objects
2. **Business Logic**: In application layer (commands/queries)
3. **Infrastructure Concerns**: In infrastructure layer only
4. **No Duplicate Types**: All shared types in Core library

### Naming Conventions
- **Commands**: `{Verb}{Entity}Command` (e.g., `CreatePortalCommand`)
- **Queries**: `Get{Entity}{Criteria}Query` (e.g., `GetPortalByIdQuery`)
- **Handlers**: `{CommandOrQuery}Handler`
- **Responses**: `{Entity}Response`
- **Requests**: `{Action}{Entity}Request`

### Testing
- Unit tests for domain logic
- Integration tests for API endpoints
- Use test data builders for complex objects
- Mock external dependencies

### Error Handling
- Use `Result<T>` pattern for expected failures
- Domain exceptions for business rule violations
- Global exception handling middleware
- Detailed error responses with proper HTTP status codes

## Important Notes

1. **No AutoMapper**: Use extension methods in `MappingExtensions.cs`
2. **Clean Architecture**: Maintain strict layer boundaries
3. **Rich Domain Models**: Business logic in entities, not anemic models
4. **Type Safety**: Use strong typing, avoid `dynamic` or `object`
5. **Async/Await**: Use async patterns for all I/O operations
6. **Dependency Injection**: Use constructor injection
7. **Configuration**: Use Options pattern with validation
8. **Logging**: Structured logging with Serilog
9. **Security**: JWT authentication, API key for services
10. **Real-time**: SignalR for live updates

## Integration Status

**⚠️ Current Status (September 16, 2025)**: Frontend-backend integration in progress. See [INTEGRATION_STATUS.md](./INTEGRATION_STATUS.md) for detailed status and known issues.

### Known Issues
- MetricsCollector HttpClient registration needs fixing
- Some frontend components still use old lowercase enum values
- Background services have dependency injection issues

### Recent Changes
- All DTOs moved to CentralCommand.Core library
- Frontend types aligned with backend (PascalCase enums)
- API services updated for direct DTO mapping
- InMemory database configured for development

## Common Tasks

### Adding a New Entity
1. Create entity in `Core/Domain/Entities`
2. Create DTOs in `Core/DTOs/Requests` and `Core/DTOs/Responses`
3. Add mapping extensions in `Core/Extensions/MappingExtensions.cs`
4. Create repository interface in `Core/Interfaces/Repositories`
5. Implement repository in `Api/Repositories`
6. Create commands/queries in `Api/Application`
7. Add controller in `Api/Controllers`

### Adding a New Feature
1. Define domain models if needed
2. Create command/query and handler
3. Add validator if needed
4. Update repository if needed
5. Add controller endpoint
6. Write tests
7. Update documentation

## Troubleshooting

### Build Issues
- Ensure .NET 9 SDK is installed
- Run `dotnet restore` to restore packages
- Check for duplicate type definitions
- Verify all projects reference Core library

### Runtime Issues
- Check connection strings in appsettings.json
- Verify database migrations are applied
- Check API authentication configuration
- Review logs in console or log files

## References
- [Software Design Standards](./docs/SOFTWARE-DESIGN-STANDARDS.md)
- [API Design Document](./API-Design-Document.md)
- [.NET Documentation](https://docs.microsoft.com/dotnet)
- [React Documentation](https://react.dev)