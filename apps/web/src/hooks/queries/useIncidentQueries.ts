import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { incidentsService } from '../../lib/api/services/incidents.service';
import { PaginatedResponse } from '../../lib/api/services/portals.service';
import { Incident, CreateIncidentInput, UpdateIncidentInput } from '../../types/incident.types';
import { toast } from 'sonner';

// Query keys factory
export const incidentKeys = {
  all: ['incidents'] as const,
  lists: () => [...incidentKeys.all, 'list'] as const,
  list: (params?: any) => [...incidentKeys.lists(), params] as const,
  details: () => [...incidentKeys.all, 'detail'] as const,
  detail: (id: string) => [...incidentKeys.details(), id] as const,
  timeline: (id: string) => [...incidentKeys.all, 'timeline', id] as const,
  related: (id: string) => [...incidentKeys.all, 'related', id] as const,
  stats: () => [...incidentKeys.all, 'stats'] as const,
  trends: (period?: string) => [...incidentKeys.all, 'trends', period] as const,
};

// Query hooks
export const useIncidents = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  severity?: string;
  portalId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}, options?: UseQueryOptions<PaginatedResponse<Incident>>) => {
  return useQuery({
    queryKey: incidentKeys.list(params),
    queryFn: () => incidentsService.getIncidents(params),
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds for active monitoring
    ...options,
  });
};

export const useIncident = (id: string, options?: UseQueryOptions<Incident>) => {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => incidentsService.getIncident(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

export const useIncidentTimeline = (id: string, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: incidentKeys.timeline(id),
    queryFn: () => incidentsService.getIncidentTimeline(id),
    enabled: !!id,
    staleTime: 10 * 1000, // 10 seconds
    ...options,
  });
};

export const useRelatedIncidents = (id: string, options?: UseQueryOptions<Incident[]>) => {
  return useQuery({
    queryKey: incidentKeys.related(id),
    queryFn: () => incidentsService.getRelatedIncidents(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

export const useIncidentStats = (params?: {
  startDate?: string;
  endDate?: string;
  portalId?: string;
}, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: incidentKeys.stats(),
    queryFn: () => incidentsService.getIncidentStats(params),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    ...options,
  });
};

export const useIncidentTrends = (period: 'day' | 'week' | 'month' = 'week', options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: incidentKeys.trends(period),
    queryFn: () => incidentsService.getIncidentTrends(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Mutation hooks
export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIncidentInput) => incidentsService.createIncident(data),
    onSuccess: (data) => {
      // Invalidate and refetch incident lists
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });

      toast.error('Incident Created', {
        description: `Incident ${data.title} has been reported. Severity: ${data.severity}`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Create Incident', {
        description: error.message || 'An error occurred while creating the incident.',
      });
    },
  });
};

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncidentInput }) =>
      incidentsService.updateIncident(id, data),
    onSuccess: (data, variables) => {
      // Update the specific incident in cache
      queryClient.setQueryData(incidentKeys.detail(variables.id), data);

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.timeline(variables.id) });

      toast.success('Incident Updated', {
        description: `Incident has been successfully updated.`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Update Incident', {
        description: error.message || 'An error occurred while updating the incident.',
      });
    },
  });
};

export const useResolveIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      incidentsService.resolveIncident(id, resolution),
    onSuccess: (data, variables) => {
      // Update the specific incident in cache
      queryClient.setQueryData(incidentKeys.detail(variables.id), data);

      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });

      toast.success('Incident Resolved', {
        description: 'Incident has been marked as resolved.',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Resolve Incident', {
        description: error.message || 'An error occurred while resolving the incident.',
      });
    },
  });
};

export const useEscalateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      incidentsService.escalateIncident(id, reason),
    onSuccess: (data, variables) => {
      // Update the specific incident in cache
      queryClient.setQueryData(incidentKeys.detail(variables.id), data);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });

      toast.warning('Incident Escalated', {
        description: 'Incident has been escalated to higher priority.',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Escalate Incident', {
        description: error.message || 'An error occurred while escalating the incident.',
      });
    },
  });
};

export const useAddIncidentComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      incidentsService.addComment(id, comment),
    onSuccess: (data, variables) => {
      // Invalidate timeline to show new comment
      queryClient.invalidateQueries({ queryKey: incidentKeys.timeline(variables.id) });
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(variables.id) });

      toast.success('Comment Added', {
        description: 'Your comment has been added to the incident.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Add Comment', {
        description: error.message || 'An error occurred while adding the comment.',
      });
    },
  });
};

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => incidentsService.deleteIncident(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: incidentKeys.detail(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });

      toast.success('Incident Deleted', {
        description: 'Incident has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Delete Incident', {
        description: error.message || 'An error occurred while deleting the incident.',
      });
    },
  });
};

export const useBulkUpdateIncidents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<UpdateIncidentInput> }) =>
      incidentsService.bulkUpdateIncidents(ids, updates),
    onSuccess: (_, variables) => {
      // Invalidate affected incidents
      variables.ids.forEach(id => {
        queryClient.invalidateQueries({ queryKey: incidentKeys.detail(id) });
      });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });

      toast.success('Incidents Updated', {
        description: `${variables.ids.length} incident(s) have been updated.`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Update Incidents', {
        description: error.message || 'An error occurred while updating the incidents.',
      });
    },
  });
};