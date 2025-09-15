namespace CentralCommand.Core.Domain.Common;

/// <summary>
/// Marker interface for aggregate roots in Domain-Driven Design
/// </summary>
public interface IAggregateRoot
{
    /// <summary>
    /// Gets the aggregate root identifier
    /// </summary>
    Guid Id { get; }
}