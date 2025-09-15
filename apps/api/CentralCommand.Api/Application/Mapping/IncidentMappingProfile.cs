using AutoMapper;
using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.DTOs.Responses;

namespace CentralCommand.Api.Application.Mapping;

public class IncidentMappingProfile : Profile
{
    public IncidentMappingProfile()
    {
        CreateMap<Incident, IncidentResponse>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()))
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.CommentCount, opt => opt.MapFrom(src => src.Comments.Count))
            .ForMember(dest => dest.TimelineEntryCount, opt => opt.MapFrom(src => src.Timeline.Count));

        CreateMap<Comment, CommentResponse>();

        CreateMap<TimelineEntry, TimelineEntryResponse>();
    }
}