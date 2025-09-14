import { useEffect, useState, useCallback, useRef } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import signalRService, {
  MetricUpdate,
  IncidentUpdate,
  SystemHealthUpdate,
} from '../lib/signalr/signalRService';
import { useQueryClient } from '@tanstack/react-query';
import { portalKeys } from './queries/usePortalQueries';
import { incidentKeys } from './queries/useIncidentQueries';
import { statsKeys } from './queries/useStatisticsQueries';

export interface SignalRHookOptions {
  autoConnect?: boolean;
  onMetricUpdate?: (update: MetricUpdate) => void;
  onIncidentUpdate?: (update: IncidentUpdate) => void;
  onSystemHealthUpdate?: (update: SystemHealthUpdate) => void;
  onPortalStatusChanged?: (data: { portalId: string; status: string }) => void;
  onNewIncident?: (incident: any) => void;
  onAlert?: (alert: { type: string; message: string; severity: string }) => void;
}

export const useSignalR = (options: SignalRHookOptions = {}) => {
  const {
    autoConnect = true,
    onMetricUpdate,
    onIncidentUpdate,
    onSystemHealthUpdate,
    onPortalStatusChanged,
    onNewIncident,
    onAlert,
  } = options;

  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    signalRService.connectionState
  );
  const [isConnected, setIsConnected] = useState(signalRService.isConnected);
  const queryClient = useQueryClient();
  const unsubscribeRefs = useRef<Array<() => void>>([]);

  // Connect to SignalR
  const connect = useCallback(async () => {
    try {
      await signalRService.connect();
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
    }
  }, []);

  // Disconnect from SignalR
  const disconnect = useCallback(async () => {
    try {
      await signalRService.disconnect();
    } catch (error) {
      console.error('Failed to disconnect from SignalR:', error);
    }
  }, []);

  // Subscribe to portal updates
  const subscribeToPortal = useCallback(async (portalId: string) => {
    try {
      await signalRService.subscribeToPortal(portalId);
    } catch (error) {
      console.error(`Failed to subscribe to portal ${portalId}:`, error);
    }
  }, []);

  // Unsubscribe from portal updates
  const unsubscribeFromPortal = useCallback(async (portalId: string) => {
    try {
      await signalRService.unsubscribeFromPortal(portalId);
    } catch (error) {
      console.error(`Failed to unsubscribe from portal ${portalId}:`, error);
    }
  }, []);

  useEffect(() => {
    // Clear previous subscriptions
    unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    unsubscribeRefs.current = [];

    // Connection state listener
    const unsubscribeConnection = signalRService.on('connectionStateChanged', (state: string) => {
      const hubState = state === 'connected' ? HubConnectionState.Connected :
                       state === 'reconnecting' ? HubConnectionState.Reconnecting :
                       state === 'disconnected' ? HubConnectionState.Disconnected :
                       HubConnectionState.Disconnected;

      setConnectionState(hubState);
      setIsConnected(hubState === HubConnectionState.Connected);
    });
    unsubscribeRefs.current.push(unsubscribeConnection);

    // Metric update listener
    const unsubscribeMetric = signalRService.on('metricUpdate', (update: MetricUpdate) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: portalKeys.metrics(update.portalId) });
      queryClient.invalidateQueries({ queryKey: portalKeys.detail(update.portalId) });
      queryClient.invalidateQueries({ queryKey: statsKeys.dashboard() });

      // Call custom handler if provided
      onMetricUpdate?.(update);
    });
    unsubscribeRefs.current.push(unsubscribeMetric);

    // Incident update listener
    const unsubscribeIncident = signalRService.on('incidentUpdate', (update: IncidentUpdate) => {
      // Invalidate incident queries
      queryClient.invalidateQueries({ queryKey: incidentKeys.detail(update.incidentId) });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });

      // Call custom handler if provided
      onIncidentUpdate?.(update);
    });
    unsubscribeRefs.current.push(unsubscribeIncident);

    // System health update listener
    const unsubscribeHealth = signalRService.on('systemHealthUpdate', (update: SystemHealthUpdate) => {
      // Invalidate system stats queries
      queryClient.invalidateQueries({ queryKey: statsKeys.system() });
      queryClient.invalidateQueries({ queryKey: statsKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: statsKeys.realtime() });

      // Call custom handler if provided
      onSystemHealthUpdate?.(update);
    });
    unsubscribeRefs.current.push(unsubscribeHealth);

    // Portal status change listener
    const unsubscribePortalStatus = signalRService.on('portalStatusChanged', (data: { portalId: string; status: string }) => {
      // Invalidate portal queries
      queryClient.invalidateQueries({ queryKey: portalKeys.detail(data.portalId) });
      queryClient.invalidateQueries({ queryKey: portalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: portalKeys.health(data.portalId) });

      // Call custom handler if provided
      onPortalStatusChanged?.(data);
    });
    unsubscribeRefs.current.push(unsubscribePortalStatus);

    // New incident listener
    const unsubscribeNewIncident = signalRService.on('newIncident', (incident: any) => {
      // Invalidate incident queries
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: statsKeys.dashboard() });

      // Call custom handler if provided
      onNewIncident?.(incident);
    });
    unsubscribeRefs.current.push(unsubscribeNewIncident);

    // Alert listener
    const unsubscribeAlert = signalRService.on('alert', (alert: { type: string; message: string; severity: string }) => {
      // Call custom handler if provided
      onAlert?.(alert);
    });
    unsubscribeRefs.current.push(unsubscribeAlert);

    // Auto-connect if enabled
    if (autoConnect && !signalRService.isConnected) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [
    autoConnect,
    connect,
    queryClient,
    onMetricUpdate,
    onIncidentUpdate,
    onSystemHealthUpdate,
    onPortalStatusChanged,
    onNewIncident,
    onAlert,
  ]);

  return {
    connectionState,
    isConnected,
    connect,
    disconnect,
    subscribeToPortal,
    unsubscribeFromPortal,
  };
};

// Hook for subscribing to specific portal updates
export const usePortalSignalR = (portalId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!portalId) return;

    // Subscribe to portal
    signalRService.subscribeToPortal(portalId);

    // Set up metric update listener for this specific portal
    const unsubscribe = signalRService.on('metricUpdate', (update: MetricUpdate) => {
      if (update.portalId === portalId) {
        // Invalidate portal-specific queries
        queryClient.invalidateQueries({ queryKey: portalKeys.metrics(portalId) });
        queryClient.invalidateQueries({ queryKey: portalKeys.detail(portalId) });
        queryClient.invalidateQueries({ queryKey: portalKeys.health(portalId) });
      }
    });

    return () => {
      unsubscribe();
      signalRService.unsubscribeFromPortal(portalId);
    };
  }, [portalId, queryClient]);
};

// Hook for dashboard real-time updates
export const useDashboardSignalR = () => {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    // System health updates
    unsubscribes.push(
      signalRService.on('systemHealthUpdate', () => {
        queryClient.invalidateQueries({ queryKey: statsKeys.dashboard() });
        queryClient.invalidateQueries({ queryKey: statsKeys.system() });
        setLastUpdate(new Date());
      })
    );

    // New incidents
    unsubscribes.push(
      signalRService.on('newIncident', () => {
        queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
        queryClient.invalidateQueries({ queryKey: statsKeys.dashboard() });
        setLastUpdate(new Date());
      })
    );

    // Portal status changes
    unsubscribes.push(
      signalRService.on('portalStatusChanged', () => {
        queryClient.invalidateQueries({ queryKey: portalKeys.lists() });
        queryClient.invalidateQueries({ queryKey: statsKeys.dashboard() });
        setLastUpdate(new Date());
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [queryClient]);

  return { lastUpdate };
};