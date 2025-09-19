using CentralCommand.Api.Application.Commands.Dev;
using FluentValidation;

namespace CentralCommand.Api.Application.Validators.Dev;

public class SeedDatabaseCommandValidator : AbstractValidator<SeedDatabaseCommand>
{
    public SeedDatabaseCommandValidator()
    {
        RuleFor(x => x.SeedCount)
            .InclusiveBetween(1, 100)
            .When(x => x.SeedCount.HasValue)
            .WithMessage("Seed count must be between 1 and 100");
    }
}