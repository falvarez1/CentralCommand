import { useEffect, useState } from 'react';
import { useIncidentService, useStatisticsService } from '../contexts/ServiceContext';
import { useIncidentStore } from '../stores/useIncidentStore';
import { Incident, IncidentStats } from '../types/incident.types';
import { toast } from 'sonner';

export function useIncidents() {
  const {
    incidents,
    setIncidents,
    setLoading,
    setError,
    isLoading,
    error,
    filteredIncidents,
    incidentStats,
    filter,
    setFilter,
    clearFilter
  } = useIncidentStore();

  const [stats, setStats] = useState<IncidentStats | null>(null);
  const incidentService = useIncidentService();
  const statisticsService = useStatisticsService();

  const fetchIncidents = async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    search?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await incidentService.getIncidents(params || {
        pageSize: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Map API response to store format
      const mappedIncidents = response.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
        acknowledgedAt: item.acknowledgedAt ? new Date(item.acknowledgedAt) : undefined,
        closedAt: item.closedAt ? new Date(item.closedAt) : undefined,
        timeline: item.timeline || [],
        affectedPortals: item.affectedPortals || [],
        affectedServices: item.affectedServices || [],
        tags: item.tags || [],
        relatedIncidents: item.relatedIncidents || []
      }));

      setIncidents(mappedIncidents);
      return mappedIncidents;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch incidents';
      setError(errorMessage);
      toast.error('Failed to fetch incidents', {
        description: errorMessage
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidentStats = async () => {
    try {
      // Use the statistics service to get incident trends
      const trends = await statisticsService.getIncidentTrends(30);
      // Convert trends to stats format
      const statsData: IncidentStats = {
        total: incidents.length,
        open: incidents.filter(i => i.status === 'open').length,
        resolved: incidents.filter(i => i.status === 'resolved').length,
        critical: incidents.filter(i => i.priority === 'critical').length,
        trends: trends
      };
      setStats(statsData);
      return statsData;
    } catch (error) {
      console.error('Failed to fetch incident stats:', error);
      return null;
    }
  };

  const createIncident = async (data: any) => {
    try {
      const response = await incidentService.createIncident(data);
      await fetchIncidents(); // Refresh the list
      toast.success('Incident created successfully');
      return response;
    } catch (error) {
      toast.error('Failed to create incident');
      throw error;
    }
  };

  const updateIncident = async (id: string, data: any) => {
    try {
      const response = await incidentService.updateIncident(id, data);
      await fetchIncidents(); // Refresh the list
      toast.success('Incident updated successfully');
      return response;
    } catch (error) {
      toast.error('Failed to update incident');
      throw error;
    }
  };

  const deleteIncident = async (id: string) => {
    try {
      await incidentService.deleteIncident(id);
      await fetchIncidents(); // Refresh the list
      toast.success('Incident deleted successfully');
    } catch (error) {
      toast.error('Failed to delete incident');
      throw error;
    }
  };

  const resolveIncident = async (id: string, resolution: string) => {
    try {
      const response = await incidentService.resolveIncident(id, resolution);
      await fetchIncidents(); // Refresh the list
      toast.success('Incident resolved');
      return response;
    } catch (error) {
      toast.error('Failed to resolve incident');
      throw error;
    }
  };

  const reopenIncident = async (id: string, reason: string) => {
    try {
      const response = await incidentService.reopenIncident(id, reason);
      await fetchIncidents(); // Refresh the list
      toast.success('Incident reopened');
      return response;
    } catch (error) {
      toast.error('Failed to reopen incident');
      throw error;
    }
  };

  const assignIncident = async (id: string, assignee: string) => {
    try {
      const response = await incidentService.assignIncident(id, assignee);
      await fetchIncidents(); // Refresh the list
      toast.success('Incident assigned');
      return response;
    } catch (error) {
      toast.error('Failed to assign incident');
      throw error;
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (incidents.length === 0) {
      fetchIncidents();
    }
  }, []);

  return {
    // State
    incidents,
    filteredIncidents,
    incidentStats,
    stats,
    isLoading,
    error,
    filter,

    // Actions
    fetchIncidents,
    fetchIncidentStats,
    createIncident,
    updateIncident,
    deleteIncident,
    resolveIncident,
    reopenIncident,
    assignIncident,
    setFilter,
    clearFilter,
    refresh: fetchIncidents
  };
}