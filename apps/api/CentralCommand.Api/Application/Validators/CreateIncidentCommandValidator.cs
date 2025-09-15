using CentralCommand.Api.Application.Commands.Incidents;
using FluentValidation;

namespace CentralCommand.Api.Application.Validators;

public class CreateIncidentCommandValidator : AbstractValidator<CreateIncidentCommand>
{
    public CreateIncidentCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Incident title is required")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Incident description is required")
            .MaximumLength(4000).WithMessage("Description must not exceed 4000 characters");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Invalid priority value");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid incident type");

        RuleFor(x => x.ReportedBy)
            .NotEmpty().WithMessage("Reporter is required")
            .MaximumLength(200).WithMessage("Reporter name must not exceed 200 characters");

        RuleFor(x => x.AssignedTo)
            .MaximumLength(200).WithMessage("Assigned to must not exceed 200 characters");

        RuleFor(x => x.AffectedPortalIds)
            .Must(ids => ids == null || ids.Count <= 50)
            .WithMessage("Cannot affect more than 50 portals");

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 20)
            .WithMessage("Cannot have more than 20 tags");
    }
}