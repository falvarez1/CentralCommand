using AutoMapper;
using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Commands.Portals;

public class CreatePortalCommandHandler : IRequestHandler<CreatePortalCommand, PortalResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<CreatePortalCommandHandler> _logger;

    public CreatePortalCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<CreatePortalCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PortalResponse> Handle(CreatePortalCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating new portal: {Name}", request.Name);

        var portal = new Portal
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Url = request.Url,
            Description = request.Description,
            Icon = request.Icon,
            Category = request.Category,
            Status = PortalStatus.Unknown,
            Environment = request.Environment,
            Priority = request.Priority,
            Owner = request.Owner,
            Team = request.Team,
            Tags = request.Tags,
            Config = request.Config ?? new PortalConfig
            {
                CheckInterval = 60,
                Timeout = 30,
                AlertThreshold = 5,
                IsMonitoringEnabled = true,
                RetryCount = 3,
                NotificationEmails = new List<string>()
            },
            Metrics = new PortalMetrics
            {
                ResponseTime = 0,
                Uptime = 100,
                ErrorRate = 0,
                RequestsPerMinute = 0,
                AverageLoadTime = 0,
                PeakResponseTime = 0,
                LastUpdated = DateTime.UtcNow
            },
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Portals.AddAsync(portal, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Portal created successfully: {Id}", portal.Id);

        return _mapper.Map<PortalResponse>(portal);
    }
}