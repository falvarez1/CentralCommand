import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { portalsService, PaginatedResponse } from '../../lib/api/services/portals.service';
import { Portal, CreatePortalInput, UpdatePortalInput } from '../../types/portal.types';
import { toast } from 'sonner';

// Query keys factory
export const portalKeys = {
  all: ['portals'] as const,
  lists: () => [...portalKeys.all, 'list'] as const,
  list: (params?: any) => [...portalKeys.lists(), params] as const,
  details: () => [...portalKeys.all, 'detail'] as const,
  detail: (id: string) => [...portalKeys.details(), id] as const,
  metrics: (id: string) => [...portalKeys.all, 'metrics', id] as const,
  health: (id: string) => [...portalKeys.all, 'health', id] as const,
  stats: () => [...portalKeys.all, 'stats'] as const,
};

// Query hooks
export const usePortals = (params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}, options?: UseQueryOptions<PaginatedResponse<Portal>>) => {
  return useQuery({
    queryKey: portalKeys.list(params),
    queryFn: () => portalsService.getPortals(params),
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    ...options,
  });
};

export const usePortal = (id: string, options?: UseQueryOptions<Portal>) => {
  return useQuery({
    queryKey: portalKeys.detail(id),
    queryFn: () => portalsService.getPortal(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

export const usePortalMetrics = (id: string, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: portalKeys.metrics(id),
    queryFn: () => portalsService.getPortalMetrics(id),
    enabled: !!id,
    staleTime: 10 * 1000, // 10 seconds for metrics
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    ...options,
  });
};

export const usePortalHealth = (id: string, options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: portalKeys.health(id),
    queryFn: () => portalsService.checkPortalHealth(id),
    enabled: !!id,
    staleTime: 5 * 1000, // 5 seconds for health checks
    refetchInterval: 15 * 1000, // Auto-refresh every 15 seconds
    ...options,
  });
};

export const usePortalStats = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: portalKeys.stats(),
    queryFn: () => portalsService.getPortalStats(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    ...options,
  });
};

// Mutation hooks
export const useCreatePortal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePortalInput) => portalsService.createPortal(data),
    onSuccess: (data) => {
      // Invalidate and refetch portal lists
      queryClient.invalidateQueries({ queryKey: portalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: portalKeys.stats() });

      toast.success('Portal Created', {
        description: `${data.name} has been successfully created.`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Create Portal', {
        description: error.message || 'An error occurred while creating the portal.',
      });
    },
  });
};

export const useUpdatePortal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePortalInput }) =>
      portalsService.updatePortal(id, data),
    onSuccess: (data, variables) => {
      // Update the specific portal in cache
      queryClient.setQueryData(portalKeys.detail(variables.id), data);

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: portalKeys.lists() });

      toast.success('Portal Updated', {
        description: `${data.name} has been successfully updated.`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Update Portal', {
        description: error.message || 'An error occurred while updating the portal.',
      });
    },
  });
};

export const useDeletePortal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => portalsService.deletePortal(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: portalKeys.detail(id) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: portalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: portalKeys.stats() });

      toast.success('Portal Deleted', {
        description: 'Portal has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Delete Portal', {
        description: error.message || 'An error occurred while deleting the portal.',
      });
    },
  });
};

export const useBulkDeletePortals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => portalsService.bulkDeletePortals(ids),
    onSuccess: (_, ids) => {
      // Remove from cache
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: portalKeys.detail(id) });
      });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: portalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: portalKeys.stats() });

      toast.success('Portals Deleted', {
        description: `${ids.length} portal(s) have been successfully deleted.`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Delete Portals', {
        description: error.message || 'An error occurred while deleting the portals.',
      });
    },
  });
};

export const useTogglePortalFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => portalsService.toggleFavorite(id),
    onSuccess: (data, id) => {
      // Update the specific portal in cache
      queryClient.setQueryData(portalKeys.detail(id), data);

      // Invalidate lists to show updated favorite status
      queryClient.invalidateQueries({ queryKey: portalKeys.lists() });

      const action = data.isFavorite ? 'added to' : 'removed from';
      toast.success('Favorite Updated', {
        description: `Portal has been ${action} favorites.`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to Update Favorite', {
        description: error.message || 'An error occurred while updating favorite status.',
      });
    },
  });
};

export const useUpdatePortalMetrics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, metrics }: { id: string; metrics: any }) =>
      portalsService.updatePortalMetrics(id, metrics),
    onSuccess: (data, variables) => {
      // Update metrics cache
      queryClient.setQueryData(portalKeys.metrics(variables.id), data);

      // Invalidate portal detail to reflect new metrics
      queryClient.invalidateQueries({ queryKey: portalKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      console.error('Failed to update portal metrics:', error);
    },
  });
};