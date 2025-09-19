using CentralCommand.Api.Application.Commands.Dev;
using FluentValidation;

namespace CentralCommand.Api.Application.Validators.Dev;

public class ClearDatabaseCommandValidator : AbstractValidator<ClearDatabaseCommand>
{
    public ClearDatabaseCommandValidator()
    {
        // No validation needed for clear command - it has no parameters
    }
}