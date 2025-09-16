namespace CentralCommand.Api.Infrastructure.Exceptions;

/// <summary>
/// Base exception for domain-related errors
/// </summary>
public class DomainException : Exception
{
    public string? Code { get; }
    public object? Details { get; }

    public DomainException(string message, string? code = null, object? details = null)
        : base(message)
    {
        Code = code;
        Details = details;
    }

    public DomainException(string message, Exception innerException, string? code = null, object? details = null)
        : base(message, innerException)
    {
        Code = code;
        Details = details;
    }
}

/// <summary>
/// Exception thrown when an entity is not found
/// </summary>
public class NotFoundException : DomainException
{
    public NotFoundException(string entityName, object key)
        : base($"{entityName} with key '{key}' was not found.", "NOT_FOUND", new { EntityName = entityName, Key = key })
    {
    }

    public NotFoundException(string message)
        : base(message, "NOT_FOUND")
    {
    }
}

/// <summary>
/// Exception thrown when there's a validation error
/// </summary>
public class ValidationException : DomainException
{
    public Dictionary<string, List<string>> Errors { get; }

    public ValidationException(string message, Dictionary<string, List<string>> errors)
        : base(message, "VALIDATION_ERROR", errors)
    {
        Errors = errors;
    }

    public ValidationException(string field, string error)
        : base($"Validation failed for field '{field}': {error}", "VALIDATION_ERROR")
    {
        Errors = new Dictionary<string, List<string>>
        {
            [field] = new List<string> { error }
        };
    }
}

/// <summary>
/// Exception thrown when there's a business rule violation
/// </summary>
public class BusinessRuleException : DomainException
{
    public BusinessRuleException(string message)
        : base(message, "BUSINESS_RULE_VIOLATION")
    {
    }

    public BusinessRuleException(string message, object details)
        : base(message, "BUSINESS_RULE_VIOLATION", details)
    {
    }
}

/// <summary>
/// Exception thrown when there's a concurrency conflict
/// </summary>
public class ConcurrencyException : DomainException
{
    public ConcurrencyException(string message)
        : base(message, "CONCURRENCY_CONFLICT")
    {
    }

    public ConcurrencyException(string entityName, object key)
        : base($"Concurrency conflict occurred while updating {entityName} with key '{key}'.",
            "CONCURRENCY_CONFLICT",
            new { EntityName = entityName, Key = key })
    {
    }
}