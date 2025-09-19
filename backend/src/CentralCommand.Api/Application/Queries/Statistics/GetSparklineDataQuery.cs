using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Queries.Statistics;

public record GetSparklineDataQuery : IRequest<SparklineDataResponse>
{
    public int Hours { get; init; } = 24;
    public int DataPoints { get; init; } = 24;
    public string? MetricType { get; init; }
}