using CentralCommand.Api.Application.Commands.Dev;
using FluentValidation;

namespace CentralCommand.Api.Application.Validators.Dev;

public class ResetDatabaseCommandValidator : AbstractValidator<ResetDatabaseCommand>
{
    public ResetDatabaseCommandValidator()
    {
        // No validation needed for reset command - it has no parameters
    }
}