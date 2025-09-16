# Software Design Standards

## Purpose
This document defines the software design standards and architectural principles that govern development. These standards ensure consistency, maintainability, and quality across the entire codebase.

## Core Philosophy
**Write code for humans first, machines second.** Every design decision should prioritize clarity, maintainability, and team scalability over premature optimization or clever solutions.

---

## 1. Foundation Principles (Non-Negotiable)

These principles form the bedrock of our development philosophy and must always be followed:

### 1.1 SOLID Principles
- **Single Responsibility**: Each class should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Prefer specific interfaces over general ones
- **Dependency Inversion**: Depend on abstractions, not concretions

### 1.2 Core Standards
- **DRY (Don't Repeat Yourself)**: No duplicate logic or type definitions
- **YAGNI (You Aren't Gonna Need It)**: Only add complexity where truly needed
- **KISS (Keep It Simple)**: Prefer simple, clear solutions over complex ones
- **Clear Naming**: Use descriptive, domain-specific names that convey intent
- **Immutability First**: Prefer immutable types; mutability requires justification
- **Fail Fast**: Validate early and throw clear, actionable errors
- **Document Intent**: XML documentation for all public APIs
- **Test Coverage**: Unit tests for all business logic and public APIs

---

## 2. Type System Standards

### 2.1 Type Safety Over Flexibility ⭐ CRITICAL
**Principle**: Catch errors at compile-time, not runtime.

```csharp
// ❌ BAD: Runtime type checking
public object ProcessData(Dictionary<string, object> data) 
{
    if (data["type"].ToString() == "order") { }
}

// ✅ GOOD: Compile-time type safety
public Result<Order> ProcessOrder(OrderRequest request)
{
    // Type-safe processing
}
```

### 2.2 Type Consolidation
**Principle**: Reduce type proliferation through thoughtful consolidation.

```csharp
// ❌ BAD: Over-abstraction
public record FirstName(string Value);
public record LastName(string Value);
public record MiddleName(string Value);

// ✅ GOOD: Grouped related concepts
public record PersonName(string First, string Last, string? Middle = null);
```

### 2.3 Nullability Contracts
**Principle**: Make nullability explicit and handle it at boundaries.

```csharp
// Enable nullable reference types in .csproj
<Nullable>enable</Nullable>

// Use required modifier for non-nullable properties
public class User
{
    public required string Email { get; init; }
    public string? PhoneNumber { get; init; }  // Explicitly nullable
}
```

### 2.4 Primitive Obsession Prevention
**Principle**: Wrap primitives when they have domain meaning and invariants.

```csharp
// ✅ GOOD: Rich value object with behavior
public record EmailAddress
{
    public string Value { get; }
    
    public EmailAddress(string value)
    {
        if (!IsValid(value))
            throw new ArgumentException($"Invalid email: {value}");
        Value = value.ToLowerInvariant();
    }
    
    public string Domain => Value.Split('@')[1];
    public bool IsCompanyEmail => !Domain.Contains("gmail");
    
    private static bool IsValid(string email) =>
        !string.IsNullOrWhiteSpace(email) && 
        email.Contains('@') && 
        email.Length <= 254;
}

// ❌ BAD: Wrapping without purpose
public record ProductName(string Value);  // No validation or behavior
```

---

## 3. Architectural Standards

### 3.1 Layer Boundaries ⭐ CRITICAL
**Principle**: Maintain clear separation between architectural layers.

```
┌─────────────────────────────────────┐
│         Presentation Layer          │ ← Can reference all below
├─────────────────────────────────────┤
│        Infrastructure Layer         │ ← Can reference Domain & Application
├─────────────────────────────────────┤
│         Application Layer           │ ← Can reference Domain only
├─────────────────────────────────────┤
│           Domain Layer              │ ← No external references
└─────────────────────────────────────┘
```

**Rules**:
- Domain layer must have ZERO framework dependencies
- Application layer contains use cases and orchestration
- Infrastructure handles external concerns (DB, APIs, etc.)
- Presentation handles UI/API concerns

### 3.2 Dependency Direction
**Principle**: Dependencies flow inward toward the domain.

```csharp
// ✅ GOOD: Domain defines interface, Infrastructure implements
namespace Domain.Repositories;
public interface IDeveloperRepository 
{
    Task<Developer?> GetByIdAsync(Guid id);
}

namespace Infrastructure.Persistence;
public class DeveloperRepository : IDeveloperRepository
{
    // EF Core implementation
}
```

### 3.3 Multi-Tenancy Patterns (When Applicable)
**Principle**: In multi-tenant systems, every operation must be tenant-aware and isolated.

```csharp
// All tenant-scoped entities implement ITenantEntity
public interface ITenantEntity
{
    Guid TenantId { get; set; }
}

// Use subqueries for cross-entity filtering
var records = await context.Records
    .Where(r => context.RelatedEntities
        .Where(e => e.TenantId == currentTenantId)
        .Select(e => e.Id)
        .Contains(r.RelatedEntityId))
    .ToListAsync();
```

### 3.4 Vertical Slice Architecture (Feature-Centric)
**Principle**: Organize code by feature/use-case, not by technical layer.

```
Features/
├── UserManagement/
│   ├── CreateUser/
│   │   ├── CreateUserRequest.cs
│   │   ├── CreateUserHandler.cs
│   │   ├── CreateUserValidator.cs
│   │   ├── CreateUserEndpoint.cs
│   │   └── CreateUser.Tests.cs
│   ├── UpdateUser/
│   └── Shared/
│       ├── UserEntity.cs
│       └── IUserRepository.cs
```

**When to use**:
- Features with complex business logic (>3 related operations)
- Features requiring specialized validation/authorization
- Features with unique infrastructure needs

**When NOT to use**:
- Simple CRUD operations (use traditional MVC)
- Cross-cutting concerns (use services)
- Shared domain models (keep in Domain layer)

### 3.5 Command/Query Separation (Pragmatic CQRS)
**Principle**: Separate reads from writes, but share infrastructure when sensible.

```csharp
// Light CQRS - Same database, different models
public interface ICommand<TResult> { }
public interface IQuery<TResult> { }

// Commands modify state
public record CreateEntityCommand(
    string Name,
    string Description,
    DateTime? ExpiresAt) : ICommand<Result<Entity>>;

// Queries read state - can use projections
public record GetEntityStatsQuery(
    Guid EntityId,
    DateRange Period) : IQuery<EntityStatsDto>;
```

**Pragmatic rules**:
1. Use same database by default
2. Separate read models only when needed (reporting, complex views)
3. No event sourcing unless audit requirements demand it
4. OK to read from write model for simple cases

### 3.6 Data Access Patterns
**Principle**: Choose data access pattern based on complexity and requirements.

```csharp
// Use DbContext directly when:
// - Simple CRUD operations
// - Blazor Server components (leverage change tracking)
// - Transaction scope is clear
// - Working within a single bounded context

// Use Repository when:
// - Complex query logic needs encapsulation
// - Multiple data sources involved
// - Need to mock for testing
// - Domain has specific persistence rules

// Pragmatic Repository (not generic!)
public interface IProductRepository
{
    Task<Product?> GetBySkuAsync(string sku);
    Task<List<Product>> GetLowStockProductsAsync(int threshold);
    Task UpdateStockAsync(Guid productId, int quantity);
}

// ❌ Anti-pattern: Generic repository
public interface IRepository<T> { } // Avoid this
```

### 3.7 Solution Structure Rules
**Principle**: Projects should be organized by business capability and deployment boundary.

```
Solution/
├── Core/                              // Shared kernel
│   ├── {Product}.Domain              // Pure domain models
│   ├── {Product}.Application          // Use cases & interfaces
│   └── {Product}.Contracts            // DTOs & API contracts
├── Features/                          // Feature-specific projects
│   ├── {Product}.{Feature}           // Self-contained features
│   └── {Product}.{Feature}.Tests
├── Infrastructure/                    // Technical implementations
│   ├── {Product}.Persistence
│   ├── {Product}.Integration
│   └── {Product}.Security
├── Hosts/                            // Entry points
│   ├── {Product}.Api
│   ├── {Product}.Web
│   └── {Product}.BackgroundJobs
└── Tests/
    ├── {Product}.UnitTests
    ├── {Product}.IntegrationTests
    └── {Product}.E2ETests
```

**When to Create New Projects**:
- Deployment boundary (separate microservice)
- Different technology stack (Blazor vs API)
- Reusable across solutions
- Different release cycle

**Keep in Same Project When**:
- Tightly coupled lifecycle
- Same deployment unit
- Shared transaction boundary
- Under 20 significant types

---

## 4. Consistency Standards

### 4.1 Semantic Consistency
**Principle**: Use predictable naming patterns across the codebase.

| Concept | Pattern | Example |
|---------|---------|---------|
| Status Enums | *Status | `OrderStatus`, `PaymentStatus` |
| State Enums | *State | `ConnectionState`, `WorkflowState` |
| Commands | *Command | `CreateOrderCommand` |
| Queries | *Query | `GetOrderByIdQuery` |
| API Requests | *Request | `CreateUserRequest` |
| API Responses | *Response | `UserResponse` |
| Event Handlers | *Handler | `OrderCreatedHandler` |
| Validators | *Validator | `CreateOrderValidator` |
| Value Objects | Domain-specific | `EmailAddress`, `Money` |
| Aggregates | Singular noun | `Order`, `User` |
| Collections | Plural or *Collection | `Orders`, `UserCollection` |

### 4.2 Type Locality
**Principle**: Keep related types together for discoverability.

```
Features/
├── Products/
│   ├── Create/
│   │   ├── CreateProductCommand.cs
│   │   ├── CreateProductValidator.cs
│   │   ├── CreateProductHandler.cs
│   │   └── CreateProductEndpoint.cs
│   ├── Models/
│   │   ├── Product.cs
│   │   ├── ProductCategory.cs
│   │   └── ProductInventory.cs
│   └── Extensions/
│       └── ProductExtensions.cs
```

### 4.3 Configuration Organization
**Principle**: Use strongly-typed, validated configuration.

```csharp
public class EmailOptions : IValidateOptions<EmailOptions>
{
    public const string SectionName = "Email";
    
    [Required]
    public string SmtpHost { get; set; } = string.Empty;
    
    [Range(1, 65535)]
    public int SmtpPort { get; set; } = 587;
    
    public ValidateOptionsResult Validate(string? name, EmailOptions options)
    {
        if (options.SmtpPort == 25)
            return ValidateOptionsResult.Fail("Port 25 is not allowed");
        return ValidateOptionsResult.Success;
    }
}

// Registration
services.AddOptions<EmailOptions>()
    .BindConfiguration(EmailOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();
```

---

## 4A. Screaming Architecture Organization

### Business-Centric Structure
**Principle**: The folder structure should immediately reveal what the system does.

```
AdvDevPortal.Developer/
├── Organizations/          // What: Multi-tenant orgs
│   ├── Registration/
│   ├── Billing/
│   └── TeamManagement/
├── ApiKeyManagement/      // What: API key lifecycle
│   ├── Generation/
│   ├── Rotation/
│   └── RateLimiting/
├── DeveloperExperience/   // What: Developer portal features
│   ├── Documentation/
│   ├── CodeGeneration/
│   └── Playground/
├── Analytics/             // What: Usage tracking
│   ├── UsageReporting/
│   ├── CostAnalysis/
│   └── PerformanceMetrics/
└── Infrastructure/        // How: Technical implementation
    ├── Persistence/
    ├── Messaging/
    └── Caching/
```

### Feature Folder Rules
1. **Top-level folders = Business capabilities** (what the system does)
2. **Technical folders only at leaf level** or in Infrastructure
3. **Shared kernel in Core project only**
4. **No "Helpers", "Utils", "Common" folders** at root level
5. **Feature cohesion over layer separation** for complex features

### Naming Conventions for Screaming Architecture
| Folder Type | Pattern | Example |
|-------------|---------|---------|
| Business Capability | Domain noun | `Organizations`, `Billing`, `Analytics` |
| Business Process | Action noun | `Registration`, `Authentication`, `Reporting` |
| Technical Concern | Technology name | `Persistence`, `Messaging`, `Caching` |
| Feature Slice | Feature + Action | `CreateOrder`, `ProcessPayment` |

---

## 5. Enum Design Standards

### 5.1 Enum Evolution
**Principle**: Design enums for extensibility and compatibility.

```csharp
public enum DeveloperRole
{
    Unknown = 0,      // Always include for forward compatibility
    Viewer = 1,
    Developer = 2,
    Admin = 3,
    Owner = 4
}

// For complex behavior, use Smart Enums
public class OrganizationRole : SmartEnum<OrganizationRole>
{
    public static readonly OrganizationRole Viewer = 
        new(1, "Viewer", PermissionLevel.Read);
    public static readonly OrganizationRole Admin = 
        new(3, "Admin", PermissionLevel.Full);
    
    public PermissionLevel Level { get; }
    
    private OrganizationRole(int value, string name, PermissionLevel level) 
        : base(name, value)
    {
        Level = level;
    }
}
```

### 5.2 Enum Presentation
**Principle**: Centralize UI concerns for enums.

```csharp
public static class DeveloperRoleExtensions
{
    private static readonly Dictionary<DeveloperRole, RolePresentation> Presentations = new()
    {
        [DeveloperRole.Owner] = new("Owner", "👑", Color.Error),
        [DeveloperRole.Admin] = new("Administrator", "⚙️", Color.Warning),
        [DeveloperRole.Developer] = new("Developer", "💻", Color.Info),
        [DeveloperRole.Viewer] = new("Member", "👤", Color.Default)
    };
    
    public static string GetDisplayName(this DeveloperRole role) =>
        Presentations.GetValueOrDefault(role)?.DisplayName ?? role.ToString();
    
    public static Color GetColor(this DeveloperRole role) =>
        Presentations.GetValueOrDefault(role)?.Color ?? Color.Default;
}

public record RolePresentation(string DisplayName, string Icon, Color Color);
```

---

## 6. Validation Standards

### 6.1 Validation Centralization
**Principle**: Single source of truth for all validation logic.

```csharp
// Domain validation in entity
public class Developer
{
    public required string Email { get; init; }
    
    public void Validate()
    {
        if (!Email.Contains('@'))
            throw new DomainException("Invalid email format");
    }
}

// Application validation with FluentValidation
public class CreateDeveloperValidator : AbstractValidator<CreateDeveloperCommand>
{
    public CreateDeveloperValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MustAsync(BeUniqueEmail)
            .WithMessage("Email already exists");
    }
    
    private async Task<bool> BeUniqueEmail(string email, CancellationToken ct)
    {
        // Check uniqueness
    }
}
```

### 6.2 Validation Layers
1. **Input Validation**: Format and structure at API boundary
2. **Business Rule Validation**: Domain invariants and rules
3. **Persistence Validation**: Database constraints

---

## 7. Error Handling Standards

### 7.1 Result Pattern
**Principle**: Use Result<T> for expected failures.

```csharp
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public Error? Error { get; }
    
    public static Result<T> Success(T value) => new(value, null, true);
    public static Result<T> Failure(Error error) => new(default, error, false);
    
    public TResult Match<TResult>(
        Func<T, TResult> onSuccess,
        Func<Error, TResult> onFailure) =>
        IsSuccess ? onSuccess(Value!) : onFailure(Error!);
}

// Usage
public async Task<Result<Developer>> CreateDeveloperAsync(CreateDeveloperCommand command)
{
    var validation = await validator.ValidateAsync(command);
    if (!validation.IsValid)
        return Result<Developer>.Failure(new ValidationError(validation.Errors));
    
    var developer = new Developer { Email = command.Email };
    await repository.AddAsync(developer);
    
    return Result<Developer>.Success(developer);
}
```

### 7.2 Exception Hierarchy
**Principle**: Use domain-specific exceptions for unexpected failures.

```csharp
public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message) { }
}

public class OrganizationNotFoundException : DomainException
{
    public Guid OrganizationId { get; }
    
    public OrganizationNotFoundException(Guid id) 
        : base($"Organization {id} not found")
    {
        OrganizationId = id;
    }
}
```

---

## 8. Testing Standards

### 8.1 Test Organization
```
Tests/
├── Unit/
│   ├── Domain/
│   ├── Application/
│   └── Infrastructure/
├── Integration/
│   ├── Api/
│   └── Database/
└── E2E/
```

### 8.2 Test Naming Convention
```csharp
[Fact]
public void MethodName_StateUnderTest_ExpectedBehavior()
{
    // Arrange
    var developer = new DeveloperBuilder()
        .WithEmail("test@example.com")
        .Build();
    
    // Act
    var result = developer.Validate();
    
    // Assert
    result.Should().BeTrue();
}
```

### 8.3 Test Data Builders
```csharp
public class DeveloperBuilder
{
    private string _email = "default@test.com";
    private OrganizationRole _role = OrganizationRole.Developer;
    
    public DeveloperBuilder WithEmail(string email)
    {
        _email = email;
        return this;
    }
    
    public DeveloperBuilder WithRole(OrganizationRole role)
    {
        _role = role;
        return this;
    }
    
    public Developer Build() => new()
    {
        Email = _email,
        Role = _role
    };
}
```

---

## 9. Performance Considerations

### 9.1 Async/Await Guidelines
```csharp
// ✅ GOOD: Async all the way
public async Task<User> GetUserAsync(Guid id)
{
    return await context.Users
        .FirstOrDefaultAsync(u => u.Id == id);
}

// ❌ BAD: Blocking async code
public User GetUser(Guid id)
{
    return GetUserAsync(id).Result; // Can cause deadlocks
}
```

### 9.2 Value Object Optimization
```csharp
// Use readonly record structs for small value objects
public readonly record struct Money(decimal Amount, Currency Currency)
{
    // Struct reduces heap allocations for frequently used types
}

// Cache expensive computations
private readonly IMemoryCache _cache;

public OrganizationPermissions GetPermissions(OrganizationRole role)
{
    return _cache.GetOrCreate($"permissions_{role}", entry =>
    {
        entry.SlidingExpiration = TimeSpan.FromMinutes(5);
        return new OrganizationPermissions(role);
    });
}
```

---

## 10. Code Review Checklist

Before submitting any PR, ensure:

### Type Safety
- [ ] No use of `object` or `dynamic` without justification
- [ ] No `Dictionary<string, object>` for structured data
- [ ] All nullable references handled appropriately
- [ ] Enums used instead of string constants

### Architecture
- [ ] Layer boundaries respected (no domain → infrastructure references)
- [ ] Multi-tenancy considered (all queries filtered by OrganizationId)
- [ ] Validation centralized and not duplicated
- [ ] Configuration uses Options pattern with validation

### Quality
- [ ] Unit tests for new business logic
- [ ] XML documentation for public APIs
- [ ] No compiler warnings
- [ ] Consistent naming patterns followed
- [ ] No duplicate code or logic

### Performance
- [ ] Async methods used for I/O operations
- [ ] No blocking of async code
- [ ] Value objects use structs where appropriate
- [ ] Database queries optimized with proper indexes

---

## 11. Pragmatic Architecture Decisions

### 11.1 Domain Model Complexity Scale
**Principle**: Choose domain modeling approach based on subdomain type.

| Subdomain Type | Approach | Characteristics | Example |
|----------------|----------|-----------------|---------|
| **Simple CRUD** | Anemic Models | Direct EF entities, basic validation | User profiles, settings |
| **Business Logic** | Rich Models | Domain services, invariant protection | Order processing, inventory |
| **Complex Rules** | Full DDD | Aggregates, value objects, domain events | Complex pricing rules |

### 11.2 Abstraction Guidelines
**Principle**: Start concrete, extract abstractions when needed.

```csharp
// ✅ GOOD: Pragmatic - no interface until needed
public class ApiKeyService
{
    private readonly DeveloperPortalDbContext _db;
    
    public async Task<ApiKey> CreateAsync(CreateApiKeyRequest request)
    {
        // Direct implementation
    }
}

// Extract interface only when:
// - Need to mock for tests
// - Multiple implementations exist
// - Crossing deployment boundaries

// ❌ BAD: Over-abstracted
public interface IDataRepository<T>
public interface IDataService<T>  
public interface IDataManager<T>
public class DataManagerImpl<T> : IDataManager<T>
```

### 11.3 Performance vs Purity Trade-offs
**Principle**: Break rules for performance only with evidence.

```csharp
// Denormalization OK when:
// - Read:Write ratio > 100:1
// - Query requires 4+ joins
// - Measured latency issue exists

// Skip abstraction when:
// - Hot path code (proven via profiling)
// - Batch operations
// - ETL processes

// Use stored procedures when:
// - Complex reporting queries
// - Massive bulk operations
// - Database-specific optimizations needed

// Always document:
// PERFORMANCE: Direct SQL for bulk delete
// Benchmark: 1000ms -> 50ms for 10k records
```

### 11.4 Pragmatic Design Patterns

#### Specification Pattern (for complex queries)
```csharp
public abstract class Specification<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();
    
    public bool IsSatisfiedBy(T entity)
    {
        var predicate = ToExpression().Compile();
        return predicate(entity);
    }
}

public class ActiveSubscriptionSpec : Specification<Subscription>
{
    public override Expression<Func<Subscription, bool>> ToExpression()
    {
        return sub => sub.IsActive && sub.ExpiresAt > DateTime.UtcNow;
    }
}
```

#### Outbox Pattern (for eventual consistency)
```csharp
public interface IOutboxProcessor
{
    Task PublishPendingEventsAsync();
}

// Store events in DB, process separately
public class OutboxEvent
{
    public Guid Id { get; set; }
    public string EventType { get; set; }
    public string Payload { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
```

#### Circuit Breaker (for external services)
```csharp
services.AddHttpClient<ExternalServiceClient>()
    .AddPolicyHandler(HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(
            handledEventsAllowedBeforeBreaking: 3,
            durationOfBreak: TimeSpan.FromSeconds(30)));
```

#### MediatR vs Direct Service Injection
```csharp
// Use MediatR when:
// - Need request/response pipeline (validation, logging)
// - Commands/queries from multiple entry points
// - Clear separation between orchestration and implementation

// Use direct injection when:
// - Simple service-to-service calls
// - Performance critical paths
// - Team unfamiliar with MediatR patterns
```

---

## 12. Library and Package Management

### 12.1 Internal Library Extraction Criteria
**Principle**: Extract to library only when genuinely reusable.

**Extract to library when**:
- Used by 3+ projects
- Has independent versioning needs
- Zero business logic (pure technical)
- Stable API (changes < quarterly)

**Example candidates**:
- Correlation ID middleware
- Custom validation attributes
- Telemetry helpers
- Security primitives

### 12.2 Package Versioning Strategy
**Principle**: Use semantic versioning with clear rules.

```json
// GitVersion configuration
{
  "mode": "ContinuousDelivery",
  "increment": "Patch",
  "tag-prefix": "v"
}
```

**Version rules**:
- **Major**: Breaking API changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes only
- **PreRelease**: -alpha, -beta, -rc

### 12.3 Dependency Management
**Principle**: Centralize package versions for consistency.

```xml
<!-- Directory.Packages.props -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="MudBlazor" Version="7.0.0" />
    <PackageVersion Include="FluentValidation" Version="11.9.0" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
  </ItemGroup>
</Project>
```

**Rules**:
1. Update framework packages together
2. Isolate preview packages
3. Document security-critical packages
4. Quarterly dependency review
5. Use Dependabot for security updates

### 12.4 NuGet Package Organization
**Principle**: Structure packages by stability and purpose.

```
Packages/
├── Stable/                    // Production-ready
│   ├── {Company}.Core        // Shared primitives
│   └── {Company}.Security    // Security utilities
├── Preview/                   // Beta features
│   └── {Company}.Experimental
└── Internal/                  // Team-specific
    └── {Company}.TestHelpers
```

---

## 13. Migration from Legacy Code

When refactoring existing code to meet these standards:

### 13.1 Incremental Migration Strategy

**Phase 1: Stabilize (Week 1-2)**
- Fix critical bugs only
- Add integration tests for current behavior
- Document current architecture

**Phase 2: Boundaries (Week 3-4)**
- Identify bounded contexts
- Create feature folders alongside existing structure
- No breaking changes yet

**Phase 3: Gradual Movement (Week 5-8)**
- Move one feature at a time
- Keep backward compatibility
- Update tests as you go

**Phase 4: Cleanup (Week 9-10)**
- Remove deprecated code
- Update documentation
- Team knowledge transfer

### 13.2 Coexistence Rules
```
// Old and new can coexist temporarily
OldStructure/
├── Controllers/
├── Services/
└── Models/

NewStructure/
├── Features/
│   └── {NewFeature}/      // New features here
└── _Legacy/              // Move old code here gradually
```

---

## 14. Exceptions and Edge Cases

These standards may be relaxed in the following scenarios:
- **Prototypes**: Clearly marked as prototype code
- **External Integrations**: When matching external API patterns
- **Performance Critical**: With benchmarks proving the need
- **Legacy Compatibility**: Only during active migration (time-boxed)

All exceptions must be:
1. Documented in code comments
2. Reviewed by tech lead
3. Have a remediation plan

---

## 15. Enforcement

These standards are enforced through:

1. **Code Reviews**: All PRs must be reviewed against these standards
2. **Automated Checks**: 
   - Roslyn analyzers for code quality
   - Architecture tests using NetArchTest
   - Build warnings treated as errors
3. **IDE Support**:
   - EditorConfig for consistent formatting
   - Code snippets for common patterns
   - ReSharper/Rider inspections

---

## 16. Evolution

This document is living and will evolve based on:
- Team experience and feedback
- New C# and .NET features
- Lessons learned from production
- Industry best practices

Propose changes through PRs with clear justification and team discussion.

---

## Quick Reference

### Do's ✅
- Type safety over flexibility
- Immutable by default
- Validate at boundaries
- Clear layer separation
- Consistent naming patterns
- Rich domain models
- Test business logic
- Document public APIs

### Don'ts ❌
- Use `dynamic` or `object` carelessly
- Create anemic domain models
- Duplicate validation logic
- Mix architectural layers
- Use string-based type checking
- Block async operations
- Create types without purpose
- Leave compiler warnings

---

## Related Documents
- Strong-Typing Refactoring Guide
- Multi-Tenant Security Documentation
- Architecture Clarifications
- Development Practices Guide