using CentralCommand.Api.Application.Commands.Portals;
using FluentValidation;

namespace CentralCommand.Api.Application.Validators;

public class CreatePortalCommandValidator : AbstractValidator<CreatePortalCommand>
{
    public CreatePortalCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Portal name is required")
            .MaximumLength(200).WithMessage("Portal name must not exceed 200 characters");

        RuleFor(x => x.Url)
            .NotEmpty().WithMessage("Portal URL is required")
            .MaximumLength(500).WithMessage("Portal URL must not exceed 500 characters")
            .Must(BeAValidUrl).WithMessage("Portal URL must be a valid URL");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters");

        RuleFor(x => x.Icon)
            .MaximumLength(100).WithMessage("Icon must not exceed 100 characters");

        RuleFor(x => x.Category)
            .IsInEnum().WithMessage("Invalid category value");

        RuleFor(x => x.Environment)
            .IsInEnum().WithMessage("Invalid environment value");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Invalid priority value");

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

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 20)
            .WithMessage("Cannot have more than 20 tags");

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