using CentralCommand.Api.Application.Commands.Portals;
using FluentValidation;

namespace CentralCommand.Api.Application.Validators;

public class UpdatePortalCommandValidator : AbstractValidator<UpdatePortalCommand>
{
    public UpdatePortalCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Portal ID is required");

        When(x => x.Name != null, () =>
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Portal name cannot be empty")
                .MaximumLength(200).WithMessage("Portal name must not exceed 200 characters");
        });

        When(x => x.Url != null, () =>
        {
            RuleFor(x => x.Url)
                .NotEmpty().WithMessage("Portal URL cannot be empty")
                .MaximumLength(500).WithMessage("Portal URL must not exceed 500 characters")
                .Must(BeAValidUrl!).WithMessage("Portal URL must be a valid URL");
        });

        When(x => x.Description != null, () =>
        {
            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters");
        });

        When(x => x.Icon != null, () =>
        {
            RuleFor(x => x.Icon)
                .MaximumLength(100).WithMessage("Icon must not exceed 100 characters");
        });

        When(x => x.Category.HasValue, () =>
        {
            RuleFor(x => x.Category)
                .IsInEnum().WithMessage("Invalid category value");
        });

        When(x => x.Environment.HasValue, () =>
        {
            RuleFor(x => x.Environment)
                .IsInEnum().WithMessage("Invalid environment value");
        });

        When(x => x.Priority.HasValue, () =>
        {
            RuleFor(x => x.Priority)
                .IsInEnum().WithMessage("Invalid priority value");
        });

        When(x => x.Owner.HasValue, () =>
        {
            RuleFor(x => x.Owner)
                .NotEmpty().WithMessage("Owner ID cannot be empty");
        });

        When(x => x.Team.HasValue, () =>
        {
            RuleFor(x => x.Team)
                .NotEmpty().WithMessage("Team ID cannot be empty");
        });

        When(x => x.Tags != null, () =>
        {
            RuleFor(x => x.Tags)
                .Must(tags => tags!.Count <= 20)
                .WithMessage("Cannot have more than 20 tags");
        });

        When(x => x.Config != null, () =>
        {
            RuleFor(x => x.Config!.CheckInterval)
                .InclusiveBetween(10, 3600)
                .WithMessage("Check interval must be between 10 and 3600 seconds");

            RuleFor(x => x.Config!.Timeout)
                .InclusiveBetween(1, 300)
                .WithMessage("Timeout must be between 1 and 300 seconds");

            RuleFor(x => x.Config!.AlertThreshold)
                .InclusiveBetween(1, 100)
                .WithMessage("Alert threshold must be between 1 and 100");

            RuleFor(x => x.Config!.RetryCount)
                .InclusiveBetween(0, 10)
                .WithMessage("Retry count must be between 0 and 10");
        });
    }

    private bool BeAValidUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}