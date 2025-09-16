using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Queries.Statistics;

public record GetStatisticsQuery : IRequest<StatisticsResponse>;