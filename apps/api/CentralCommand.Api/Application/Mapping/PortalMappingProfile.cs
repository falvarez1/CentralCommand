using AutoMapper;
using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.DTOs.Responses;

namespace CentralCommand.Api.Application.Mapping;

public class PortalMappingProfile : Profile
{
    public PortalMappingProfile()
    {
        CreateMap<Portal, PortalResponse>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Environment, opt => opt.MapFrom(src => src.Environment.ToString()))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()));

        CreateMap<PortalMetrics, PortalMetricsResponse>();

        CreateMap<PortalConfig, PortalConfigResponse>();

        CreateMap<HealthCheck, HealthCheckResponse>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<MetricsHistory, MetricsHistoryResponse>();
    }
}