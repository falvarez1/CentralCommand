using CentralCommand.Api.Application.Commands.Incidents;
using FluentValidation;

namespace CentralCommand.Api.Application.Validators;

public class UpdateIncidentCommandValidator : AbstractValidator<UpdateIncidentCommand>
{
    public UpdateIncidentCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Incident ID is required");

        RuleFor(x => x.UpdatedBy)
            .NotEmpty().WithMessage("UpdatedBy is required")
            .MaximumLength(200).WithMessage("UpdatedBy must not exceed 200 characters");

        When(x => x.Title != null, () =>
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title cannot be empty")
                .MaximumLength(500).WithMessage("Title must not exceed 500 characters");
        });

        When(x => x.Description != null, () =>
        {
            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Description cannot be empty")
                .MaximumLength(4000).WithMessage("Description must not exceed 4000 characters");
        });

        When(x => x.Status.HasValue, () =>
        {
            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Invalid status value");
        });

        When(x => x.Priority.HasValue, () =>
        {
            RuleFor(x => x.Priority)
                .IsInEnum().WithMessage("Invalid priority value");
        });

        When(x => x.Type.HasValue, () =>
        {
            RuleFor(x => x.Type)
                .IsInEnum().WithMessage("Invalid incident type");
        });

        When(x => x.AssignedTo != null, () =>
        {
            RuleFor(x => x.AssignedTo)
                .MaximumLength(200).WithMessage("Assigned to must not exceed 200 characters");
        });

        When(x => x.Resolution != null, () =>
        {
            RuleFor(x => x.Resolution)
                .MaximumLength(4000).WithMessage("Resolution must not exceed 4000 characters");
        });

        When(x => x.AffectedPortalIds != null, () =>
        {
            RuleFor(x => x.AffectedPortalIds)
                .Must(ids => ids!.Count <= 50)
                .WithMessage("Cannot affect more than 50 portals");
        });

        When(x => x.Tags != null, () =>
        {
            RuleFor(x => x.Tags)
                .Must(tags => tags!.Count <= 20)
                .WithMessage("Cannot have more than 20 tags");
        });
    }
}