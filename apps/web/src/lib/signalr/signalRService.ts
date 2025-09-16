import * as signalR from '@microsoft/signalr';
import { env } from '../../config/env';
import { toast } from 'sonner';

export interface MetricUpdate {
  portalId: string;
  metric: string;
  value: number;
  timestamp: string;
}

export interface IncidentUpdate {
  incidentId: string;
  status: string;
  severity: string;
  updatedAt: string;
}

export interface SystemHealthUpdate {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  timestamp: string;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    if (env.features.enableRealtimeUpdates) {
      this.initialize();
    }
  }

  private initialize() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(env.signalr.hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
        withCredentials: true, // Required for CORS with credentials
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            // If we've been reconnecting for less than 60 seconds, try every 5 seconds
            return env.signalr.reconnectInterval;
          } else {
            // If we've been reconnecting for more than 60 seconds, stop trying
            return null;
          }
        },
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    // Connection lifecycle events
    this.connection.onreconnecting((error) => {
      console.warn('SignalR reconnecting:', error);
      this.notifyListeners('connectionStateChanged', 'reconnecting');
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      toast.success('Real-time connection restored');
      this.notifyListeners('connectionStateChanged', 'connected');
    });

    this.connection.onclose((error) => {
      console.error('SignalR connection closed:', error);
      this.notifyListeners('connectionStateChanged', 'disconnected');

      // Attempt to reconnect after a delay
      if (env.features.enableRealtimeUpdates && !this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, env.signalr.reconnectInterval);
      }
    });

    // Real-time update handlers
    this.connection.on('MetricUpdate', (update: MetricUpdate) => {
      if (import.meta.env.DEV) {
        console.log('Metric update received:', update);
      }
      this.notifyListeners('metricUpdate', update);
    });

    this.connection.on('IncidentUpdate', (update: IncidentUpdate) => {
      if (import.meta.env.DEV) {
        console.log('Incident update received:', update);
      }
      this.notifyListeners('incidentUpdate', update);
    });

    this.connection.on('SystemHealthUpdate', (update: SystemHealthUpdate) => {
      if (import.meta.env.DEV) {
        console.log('System health update received:', update);
      }
      this.notifyListeners('systemHealthUpdate', update);
    });

    this.connection.on('PortalStatusChanged', (data: { portalId: string; status: string }) => {
      this.notifyListeners('portalStatusChanged', data);

      // Show toast for critical status changes
      if (data.status === 'DOWN' || data.status === 'CRITICAL') {
        toast.error('Portal Status Alert', {
          description: `Portal ${data.portalId} is now ${data.status}`,
        });
      }
    });

    this.connection.on('NewIncident', (incident: any) => {
      this.notifyListeners('newIncident', incident);

      // Show toast for new incidents
      toast.error('New Incident', {
        description: `${incident.title} - Severity: ${incident.severity}`,
        duration: 5000,
      });
    });

    this.connection.on('Alert', (alert: { type: string; message: string; severity: string }) => {
      this.notifyListeners('alert', alert);

      // Show toast based on severity
      const toastFn = alert.severity === 'critical' ? toast.error :
                     alert.severity === 'warning' ? toast.warning :
                     toast.info;

      toastFn(alert.type, {
        description: alert.message,
        duration: 5000,
      });
    });
  }

  async connect(): Promise<void> {
    if (!this.connection || this.isConnecting) return;

    if (this.connection.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR already connected');
      return;
    }

    this.isConnecting = true;

    try {
      await this.connection.start();
      console.log('SignalR connected successfully');

      // Subscribe to groups or channels if needed
      await this.subscribeToChannels();

      this.notifyListeners('connectionStateChanged', 'connected');

      if (import.meta.env.PROD) {
        toast.success('Real-time updates connected');
      }
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      this.notifyListeners('connectionStateChanged', 'error');

      // Retry connection after delay
      if (env.features.enableRealtimeUpdates && !this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, env.signalr.reconnectInterval);
      }
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.stop();
        console.log('SignalR disconnected');
        this.notifyListeners('connectionStateChanged', 'disconnected');
      } catch (error) {
        console.error('Error disconnecting SignalR:', error);
      }
    }
  }

  private async subscribeToChannels(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      // Subscribe to specific portal updates if needed
      const portalIds = this.getActivePortalIds();
      if (portalIds.length > 0) {
        await this.connection.invoke('SubscribeToPortals', portalIds);
      }

      // Subscribe to system-wide alerts
      await this.connection.invoke('SubscribeToSystemAlerts');
    } catch (error) {
      console.error('Failed to subscribe to channels:', error);
    }
  }

  private getActivePortalIds(): string[] {
    // This would typically get portal IDs from the store or context
    // For now, return empty array
    return [];
  }

  // Public methods for managing subscriptions
  async subscribeToPortal(portalId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.warn('Cannot subscribe to portal: SignalR not connected');
      return;
    }

    try {
      await this.connection.invoke('SubscribeToPortal', portalId);
      console.log(`Subscribed to portal: ${portalId}`);
    } catch (error) {
      console.error(`Failed to subscribe to portal ${portalId}:`, error);
    }
  }

  async unsubscribeFromPortal(portalId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('UnsubscribeFromPortal', portalId);
      console.log(`Unsubscribed from portal: ${portalId}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from portal ${portalId}:`, error);
    }
  }

  // Event listener management
  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in SignalR event listener for ${event}:`, error);
        }
      });
    }
  }

  // Connection state
  get connectionState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Export singleton instance
export const signalRService = new SignalRService();

// Export for use in React hooks
export default signalRService;