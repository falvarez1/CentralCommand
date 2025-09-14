import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import {
  SystemStats,
  MetricData,
  TimeRange,
  MetricType,
  AggregationType,
  PerformanceBenchmark,
  AlertThreshold,
  MetricComparison,
  HealthCheckResult,
  DashboardWidget
} from '../types/stats.types';
import { usePortalStore } from './usePortalStore';
import { useIncidentStore } from './useIncidentStore';

/**
 * Generate time series data for a metric
 */
const generateTimeSeriesData = (
  metricType: MetricType,
  timeRange: TimeRange,
  baseValue: number = 50
): MetricData => {
  const now = new Date();
  const dataPoints = [];

  let numPoints = 24; // Default for 24H
  let intervalMs = 60 * 60 * 1000; // 1 hour

  switch (timeRange) {
    case TimeRange.ONE_HOUR:
      numPoints = 12;
      intervalMs = 5 * 60 * 1000; // 5 minutes
      break;
    case TimeRange.SEVEN_DAYS:
      numPoints = 7 * 24;
      intervalMs = 60 * 60 * 1000; // 1 hour
      break;
    case TimeRange.THIRTY_DAYS:
      numPoints = 30;
      intervalMs = 24 * 60 * 60 * 1000; // 1 day
      break;
  }

  for (let i = numPoints; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMs);
    const variation = (Math.random() - 0.5) * 20;
    const value = Math.max(0, Math.min(100, baseValue + variation));

    dataPoints.push({
      timestamp,
      value,
      label: timestamp.toISOString()
    });
  }

  // Determine trend
  const recentAvg = dataPoints.slice(-5).reduce((sum, p) => sum + p.value, 0) / 5;
  const olderAvg = dataPoints.slice(0, 5).reduce((sum, p) => sum + p.value, 0) / 5;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentAvg > olderAvg + 5) trend = 'up';
  else if (recentAvg < olderAvg - 5) trend = 'down';

  return {
    metricType,
    timeRange,
    dataPoints,
    aggregationType: AggregationType.AVERAGE,
    unit: getMetricUnit(metricType),
    threshold: getMetricThreshold(metricType),
    trend
  };
};

const getMetricUnit = (metricType: MetricType): string => {
  switch (metricType) {
    case MetricType.RESPONSE_TIME:
    case MetricType.LATENCY:
      return 'ms';
    case MetricType.UPTIME:
    case MetricType.CPU:
    case MetricType.MEMORY:
    case MetricType.ERROR_RATE:
      return '%';
    case MetricType.REQUESTS:
    case MetricType.ERRORS:
      return 'count';
    case MetricType.THROUGHPUT:
      return 'req/s';
    default:
      return '';
  }
};

const getMetricThreshold = (metricType: MetricType): number => {
  switch (metricType) {
    case MetricType.RESPONSE_TIME:
      return 1000; // 1 second
    case MetricType.LATENCY:
      return 100; // 100ms
    case MetricType.UPTIME:
      return 99.9;
    case MetricType.CPU:
    case MetricType.MEMORY:
      return 80;
    case MetricType.ERROR_RATE:
      return 1;
    case MetricType.THROUGHPUT:
      return 100;
    default:
      return 0;
  }
};

interface StatsState {
  // Current stats
  systemStats: SystemStats;
  metricsData: Map<string, MetricData>;

  // Historical data
  historicalStats: SystemStats[];

  // Performance benchmarks
  benchmarks: PerformanceBenchmark[];

  // Alert thresholds
  alertThresholds: AlertThreshold[];
  activeAlerts: string[];

  // Dashboard widgets
  dashboardWidgets: DashboardWidget[];

  // Health check results
  healthCheckResults: Map<string, HealthCheckResult>;
  lastHealthCheck: Date | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  updateSystemStats: () => void;
  getMetricData: (metricType: MetricType, portalId?: string, timeRange?: TimeRange) => MetricData;
  updateMetricData: (key: string, data: MetricData) => void;

  // Benchmark actions
  addBenchmark: (benchmark: PerformanceBenchmark) => void;
  updateBenchmark: (metricType: MetricType, actual: number) => void;

  // Alert actions
  addAlertThreshold: (threshold: AlertThreshold) => void;
  updateAlertThreshold: (id: string, updates: Partial<AlertThreshold>) => void;
  deleteAlertThreshold: (id: string) => void;
  checkAlerts: () => void;

  // Widget actions
  addWidget: (widget: Omit<DashboardWidget, 'id'>) => void;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void;
  deleteWidget: (id: string) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;

  // Health check actions
  runHealthCheck: (portalId: string) => Promise<HealthCheckResult>;
  runAllHealthChecks: () => Promise<void>;

  // Comparison actions
  compareMetrics: (metricType: MetricType, currentRange: TimeRange, previousRange: TimeRange) => MetricComparison;

  // Export actions
  exportStats: (format: 'json' | 'csv') => string;

  // Real-time simulation
  startRealtimeSimulation: () => void;
  stopRealtimeSimulation: () => void;

  // Initialize
  initialize: () => void;
}

let simulationInterval: ReturnType<typeof setInterval> | null = null;

export const useStatsStore = create<StatsState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      systemStats: {
        totalPortals: 0,
        operationalPortals: 0,
        activePortals: 0,
        inactivePortals: 0,
        healthScore: 100,
        systemUptime: 99.99,
        averageResponseTime: 0,
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
        throughput: 0,
        averageCpu: 0,
        averageMemory: 0,
        diskUsage: 0,
        networkLatency: 0,
        activeIncidents: 0,
        resolvedToday: 0,
        mttr: 0,
        mtbf: 0,
        activeUsers: 0,
        totalUsers: 0,
        concurrentSessions: 0,
        lastUpdated: new Date(),
        timeRange: TimeRange.TWENTY_FOUR_HOURS,
        dataQuality: 100
      },
      metricsData: new Map(),
      historicalStats: [],
      benchmarks: [],
      alertThresholds: [],
      activeAlerts: [],
      dashboardWidgets: [],
      healthCheckResults: new Map(),
      lastHealthCheck: null,
      isLoading: false,
      error: null,

      // Actions
      updateSystemStats: () => {
        const portalStore = usePortalStore.getState();
        const incidentStore = useIncidentStore.getState();

        const portals = portalStore.portals;
        const incidents = incidentStore.incidents;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate portal stats
        const activePortals = portals.filter(p => p.status === 'operational').length;
        const inactivePortals = portals.filter(p => p.status === 'outage').length;

        // Calculate average metrics
        let totalResponseTime = 0;
        let totalCpu = 0;
        let totalMemory = 0;
        let totalRequests = 0;
        let totalErrors = 0;
        let totalUptime = 0;

        portals.forEach(portal => {
          totalResponseTime += portal.metrics.responseTime;
          totalCpu += portal.metrics.cpu;
          totalMemory += portal.metrics.memory;
          totalRequests += portal.metrics.requests;
          totalErrors += portal.metrics.errors;
          totalUptime += portal.metrics.uptime;
        });

        const portalCount = portals.length || 1;

        // Calculate incident stats
        const activeIncidents = incidents.filter(i => i.status !== 'resolved').length;
        const resolvedToday = incidents.filter(i =>
          i.resolvedAt && i.resolvedAt >= today
        ).length;

        // Calculate MTTR and MTBF
        const resolvedIncidents = incidents.filter(i => i.metrics?.mttr);
        const mttr = resolvedIncidents.length > 0
          ? resolvedIncidents.reduce((sum, i) => sum + (i.metrics?.mttr || 0), 0) / resolvedIncidents.length
          : 0;

        const incidentsWithMTBF = incidents.filter(i => i.metrics?.mtbf);
        const mtbf = incidentsWithMTBF.length > 0
          ? incidentsWithMTBF.reduce((sum, i) => sum + (i.metrics?.mtbf || 0), 0) / incidentsWithMTBF.length
          : 0;

        // Calculate health score (weighted average)
        const uptimeWeight = 0.3;
        const errorRateWeight = 0.3;
        const responseTimeWeight = 0.2;
        const incidentWeight = 0.2;

        const avgUptime = totalUptime / portalCount;
        const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
        const avgResponseTime = totalResponseTime / portalCount;

        const healthScore = Math.round(
          avgUptime * uptimeWeight +
          (100 - Math.min(errorRate * 10, 100)) * errorRateWeight +
          (100 - Math.min(avgResponseTime / 10, 100)) * responseTimeWeight +
          (100 - Math.min(activeIncidents * 10, 100)) * incidentWeight
        );

        const newStats: SystemStats = {
          totalPortals: portals.length,
          operationalPortals: activePortals,
          activePortals,
          inactivePortals,
          healthScore,
          systemUptime: avgUptime,
          averageResponseTime: avgResponseTime,
          totalRequests,
          totalErrors,
          errorRate,
          throughput: totalRequests / (24 * 60 * 60), // requests per second over 24h
          averageCpu: totalCpu / portalCount,
          averageMemory: totalMemory / portalCount,
          diskUsage: Math.random() * 100, // Simulated
          networkLatency: Math.random() * 50, // Simulated
          activeIncidents,
          resolvedToday,
          mttr,
          mtbf,
          activeUsers: Math.floor(Math.random() * 100), // Simulated
          totalUsers: 250, // Simulated
          concurrentSessions: Math.floor(Math.random() * 50), // Simulated
          lastUpdated: now,
          timeRange: TimeRange.TWENTY_FOUR_HOURS,
          dataQuality: 95 + Math.random() * 5
        };

        set(state => {
          state.systemStats = newStats;
          state.historicalStats.push(newStats);

          // Keep only last 100 historical entries
          if (state.historicalStats.length > 100) {
            state.historicalStats = state.historicalStats.slice(-100);
          }
        });

        // Check alerts
        get().checkAlerts();
      },

      getMetricData: (metricType, portalId, timeRange = TimeRange.TWENTY_FOUR_HOURS) => {
        const key = `${metricType}-${portalId || 'system'}-${timeRange}`;
        let data = get().metricsData.get(key);

        if (!data) {
          // Generate new data
          data = generateTimeSeriesData(metricType, timeRange);
          get().updateMetricData(key, data);
        }

        return data;
      },

      updateMetricData: (key, data) => set(state => {
        state.metricsData.set(key, data);
      }),

      addBenchmark: (benchmark) => set(state => {
        state.benchmarks.push(benchmark);
      }),

      updateBenchmark: (metricType, actual) => set(state => {
        const benchmark = state.benchmarks.find((b: PerformanceBenchmark) => b.metricType === metricType);
        if (benchmark) {
          benchmark.actual = actual;
          benchmark.timestamp = new Date();

          const percentDiff = ((actual - benchmark.baseline) / benchmark.baseline) * 100;
          benchmark.improvementPercentage = percentDiff;

          if (actual >= benchmark.target) {
            benchmark.status = 'exceeding';
          } else if (actual >= benchmark.baseline) {
            benchmark.status = 'meeting';
          } else if (actual >= benchmark.baseline * 0.8) {
            benchmark.status = 'below';
          } else {
            benchmark.status = 'critical';
          }
        }
      }),

      addAlertThreshold: (threshold) => set(state => {
        state.alertThresholds.push(threshold);
      }),

      updateAlertThreshold: (id, updates) => set(state => {
        const index = state.alertThresholds.findIndex((t: AlertThreshold) => t.id === id);
        if (index !== -1) {
          state.alertThresholds[index] = { ...state.alertThresholds[index], ...updates };
        }
      }),

      deleteAlertThreshold: (id) => set(state => {
        state.alertThresholds = state.alertThresholds.filter((t: AlertThreshold) => t.id !== id);
      }),

      checkAlerts: () => {
        const { systemStats, alertThresholds } = get();
        const newActiveAlerts: string[] = [];

        alertThresholds.forEach(threshold => {
          if (!threshold.enabled) return;

          let currentValue = 0;
          switch (threshold.metricType) {
            case MetricType.RESPONSE_TIME:
              currentValue = systemStats.averageResponseTime;
              break;
            case MetricType.CPU:
              currentValue = systemStats.averageCpu;
              break;
            case MetricType.MEMORY:
              currentValue = systemStats.averageMemory;
              break;
            case MetricType.ERROR_RATE:
              currentValue = systemStats.errorRate;
              break;
            case MetricType.UPTIME:
              currentValue = systemStats.systemUptime;
              break;
          }

          if (currentValue >= threshold.criticalThreshold) {
            newActiveAlerts.push(`${threshold.metricType}-critical`);
          } else if (currentValue >= threshold.warningThreshold) {
            newActiveAlerts.push(`${threshold.metricType}-warning`);
          }
        });

        set(state => {
          state.activeAlerts = newActiveAlerts;
        });
      },

      addWidget: (widget) => {
        const newWidget: DashboardWidget = {
          ...widget,
          id: uuidv4()
        };

        set(state => {
          state.dashboardWidgets.push(newWidget);
        });
      },

      updateWidget: (id, updates) => set(state => {
        const index = state.dashboardWidgets.findIndex((w: DashboardWidget) => w.id === id);
        if (index !== -1) {
          state.dashboardWidgets[index] = { ...state.dashboardWidgets[index], ...updates };
        }
      }),

      deleteWidget: (id) => set(state => {
        state.dashboardWidgets = state.dashboardWidgets.filter((w: DashboardWidget) => w.id !== id);
      }),

      reorderWidgets: (widgets) => set(state => {
        state.dashboardWidgets = widgets;
      }),

      runHealthCheck: async (portalId) => {
        const portal = usePortalStore.getState().portals.find(p => p.id === portalId);
        if (!portal) throw new Error('Portal not found');

        // Simulate health check
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));

        const result: HealthCheckResult = {
          portalId,
          timestamp: new Date(),
          isHealthy: Math.random() > 0.2,
          responseTime: Math.random() * 1000,
          statusCode: Math.random() > 0.1 ? 200 : 503,
          checks: [
            {
              name: 'Database Connection',
              passed: Math.random() > 0.1,
              message: 'Connected successfully',
              duration: Math.random() * 100
            },
            {
              name: 'API Endpoint',
              passed: Math.random() > 0.1,
              message: 'Responding normally',
              duration: Math.random() * 200
            },
            {
              name: 'Cache Service',
              passed: Math.random() > 0.2,
              message: 'Cache operational',
              duration: Math.random() * 50
            }
          ]
        };

        set(state => {
          state.healthCheckResults.set(portalId, result);
          state.lastHealthCheck = new Date();
        });

        return result;
      },

      runAllHealthChecks: async () => {
        set(state => {
          state.isLoading = true;
        });

        try {
          const portals = usePortalStore.getState().portals;
          await Promise.all(portals.map(p => get().runHealthCheck(p.id)));
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Health check failed';
          });
        } finally {
          set(state => {
            state.isLoading = false;
          });
        }
      },

      compareMetrics: (metricType, currentRange, previousRange) => {
        const currentData = get().getMetricData(metricType, undefined, currentRange);
        const previousData = get().getMetricData(metricType, undefined, previousRange);

        const currentAvg = currentData.dataPoints.reduce((sum, p) => sum + p.value, 0) / currentData.dataPoints.length;
        const previousAvg = previousData.dataPoints.reduce((sum, p) => sum + p.value, 0) / previousData.dataPoints.length;

        const changePercentage = ((currentAvg - previousAvg) / previousAvg) * 100;

        const comparison: MetricComparison = {
          metricType,
          currentPeriod: currentData,
          previousPeriod: previousData,
          changePercentage,
          changeDirection: changePercentage > 0 ? 'increase' : changePercentage < 0 ? 'decrease' : 'stable',
          isImprovement: determineIfImprovement(metricType, changePercentage)
        };

        return comparison;
      },

      exportStats: (format) => {
        const { systemStats, historicalStats } = get();

        if (format === 'json') {
          return JSON.stringify({
            current: systemStats,
            historical: historicalStats
          }, null, 2);
        } else {
          // CSV format
          const headers = Object.keys(systemStats).filter(k => typeof systemStats[k as keyof SystemStats] !== 'object');
          const rows = historicalStats.map(stat =>
            headers.map(h => stat[h as keyof SystemStats]).join(',')
          );
          return [headers.join(','), ...rows].join('\n');
        }
      },

      startRealtimeSimulation: () => {
        if (simulationInterval) return;

        simulationInterval = setInterval(() => {
          get().updateSystemStats();

          // Update random metrics
          const metricsToUpdate = [
            MetricType.CPU,
            MetricType.MEMORY,
            MetricType.RESPONSE_TIME,
            MetricType.THROUGHPUT
          ];

          metricsToUpdate.forEach(metricType => {
            const key = `${metricType}-system-${TimeRange.ONE_HOUR}`;
            const data = generateTimeSeriesData(metricType, TimeRange.ONE_HOUR, Math.random() * 100);
            get().updateMetricData(key, data);
          });
        }, 5000); // Update every 5 seconds
      },

      stopRealtimeSimulation: () => {
        if (simulationInterval) {
          clearInterval(simulationInterval);
          simulationInterval = null;
        }
      },

      initialize: () => {

        // Update initial stats
        get().updateSystemStats();

        // Start real-time simulation
        get().startRealtimeSimulation();
      }
,

      // Alias for App.tsx compatibility
      startStatsUpdates: () => {
        get().startRealtimeSimulation();
        return () => {
          get().stopRealtimeSimulation();
        };
      }
    }))
  )
);

// Helper function to determine if a metric change is an improvement
function determineIfImprovement(metricType: MetricType, changePercentage: number): boolean {
  switch (metricType) {
    case MetricType.RESPONSE_TIME:
    case MetricType.LATENCY:
    case MetricType.ERRORS:
    case MetricType.ERROR_RATE:
      return changePercentage < 0; // Lower is better
    case MetricType.UPTIME:
    case MetricType.THROUGHPUT:
    case MetricType.REQUESTS:
      return changePercentage > 0; // Higher is better
    case MetricType.CPU:
    case MetricType.MEMORY:
      return Math.abs(changePercentage) < 10; // Stable is better
    default:
      return true;
  }
}