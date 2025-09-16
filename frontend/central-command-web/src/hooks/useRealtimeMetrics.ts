import { useEffect, useRef, useCallback } from 'react';
import { usePortalStore } from '../stores/usePortalStore';
import { useStatsStore } from '../stores/useStatsStore';
import { useUIStore } from '../stores/useUIStore';
import { MetricType, TimeRange } from '../types/stats.types';

/**
 * Custom hook for simulated real-time metrics updates
 */
export function useRealtimeMetrics(enabled = true) {
  const updateAllMetrics = usePortalStore(state => state.updateAllMetrics);
  const updateSystemStats = useStatsStore(state => state.updateSystemStats);
  const { preferences, selectedTimeRange } = useUIStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/stop real-time updates
  useEffect(() => {
    if (!enabled || !preferences.autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Update immediately
    updateAllMetrics();
    updateSystemStats();

    // Set up interval
    intervalRef.current = setInterval(() => {
      updateAllMetrics();
      updateSystemStats();
    }, preferences.refreshInterval * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, preferences.autoRefresh, preferences.refreshInterval, updateAllMetrics, updateSystemStats]);

  // Force refresh function
  const refresh = useCallback(() => {
    updateAllMetrics();
    updateSystemStats();
  }, [updateAllMetrics, updateSystemStats]);

  return {
    isEnabled: enabled && preferences.autoRefresh,
    refreshInterval: preferences.refreshInterval,
    refresh
  };
}

/**
 * Hook for specific metric data with real-time updates
 */
export function useMetricData(
  metricType: MetricType,
  portalId?: string,
  timeRange?: TimeRange
) {
  const getMetricData = useStatsStore(state => state.getMetricData);
  const selectedTimeRange = useUIStore(state => state.selectedTimeRange);
  const updateMetricData = useStatsStore(state => state.updateMetricData);

  const actualTimeRange = timeRange || selectedTimeRange;
  const metricData = getMetricData(metricType, portalId, actualTimeRange);

  // Simulate real-time updates for this specific metric
  useEffect(() => {
    const preferences = useUIStore.getState().preferences;
    if (!preferences.autoRefresh) return;

    const interval = setInterval(() => {
      // Generate new data point
      const lastPoint = metricData.dataPoints[metricData.dataPoints.length - 1];
      if (!lastPoint) return;

      const newValue = Math.max(0, Math.min(100,
        lastPoint.value + (Math.random() - 0.5) * 10
      ));

      const newDataPoints = [...metricData.dataPoints.slice(1), {
        timestamp: new Date(),
        value: newValue,
        label: new Date().toISOString()
      }];

      const updatedMetricData = {
        ...metricData,
        dataPoints: newDataPoints
      };

      const key = `${metricType}-${portalId || 'system'}-${actualTimeRange}`;
      updateMetricData(key, updatedMetricData);
    }, preferences.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [metricType, portalId, actualTimeRange, metricData, updateMetricData]);

  return metricData;
}

/**
 * Hook for metric comparisons
 */
export function useMetricComparison(
  metricType: MetricType,
  currentRange: TimeRange = TimeRange.TWENTY_FOUR_HOURS,
  previousRange: TimeRange = TimeRange.SEVEN_DAYS
) {
  const compareMetrics = useStatsStore(state => state.compareMetrics);

  const comparison = compareMetrics(metricType, currentRange, previousRange);

  return {
    ...comparison,
    isImproved: comparison.isImprovement,
    changeText: `${comparison.changePercentage > 0 ? '+' : ''}${comparison.changePercentage.toFixed(1)}%`,
    trendIcon: comparison.changeDirection === 'increase' ? '↑' :
                comparison.changeDirection === 'decrease' ? '↓' : '→'
  };
}

/**
 * Hook for performance benchmarks
 */
export function usePerformanceBenchmarks() {
  const benchmarks = useStatsStore(state => state.benchmarks);
  const updateBenchmark = useStatsStore(state => state.updateBenchmark);
  const systemStats = useStatsStore(state => state.systemStats);

  // Auto-update benchmarks based on current stats
  useEffect(() => {
    benchmarks.forEach(benchmark => {
      let currentValue = 0;

      switch (benchmark.metricType) {
        case MetricType.RESPONSE_TIME:
          currentValue = systemStats.averageResponseTime;
          break;
        case MetricType.UPTIME:
          currentValue = systemStats.systemUptime;
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
        case MetricType.THROUGHPUT:
          currentValue = systemStats.throughput;
          break;
      }

      if (currentValue !== benchmark.actual) {
        updateBenchmark(benchmark.metricType, currentValue);
      }
    });
  }, [benchmarks, systemStats, updateBenchmark]);

  const criticalBenchmarks = benchmarks.filter(b => b.status === 'critical');
  const exceedingBenchmarks = benchmarks.filter(b => b.status === 'exceeding');

  return {
    benchmarks,
    criticalBenchmarks,
    exceedingBenchmarks,
    hasCritical: criticalBenchmarks.length > 0,
    overallStatus: criticalBenchmarks.length > 0 ? 'critical' :
                   benchmarks.some(b => b.status === 'below') ? 'warning' :
                   exceedingBenchmarks.length > benchmarks.length / 2 ? 'excellent' : 'good'
  };
}

/**
 * Hook for WebSocket simulation (for demo purposes)
 */
export function useWebSocketSimulation(
  url?: string,
  onMessage?: (data: any) => void
) {
  const connectionRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Simulate WebSocket connection
    console.log(`Simulating WebSocket connection to ${url || 'ws://localhost:8080'}`);

    // Simulate incoming messages
    const messageInterval = setInterval(() => {
      if (onMessage) {
        const mockData = {
          type: 'metric_update',
          timestamp: new Date().toISOString(),
          data: {
            portalId: Math.random().toString(36).substr(2, 9),
            metrics: {
              cpu: Math.random() * 100,
              memory: Math.random() * 100,
              responseTime: Math.random() * 1000,
              errorRate: Math.random() * 5
            }
          }
        };
        onMessage(mockData);
      }
    }, 5000);

    connectionRef.current = { interval: messageInterval };
  }, [url, onMessage]);

  const disconnect = useCallback(() => {
    if (connectionRef.current?.interval) {
      clearInterval(connectionRef.current.interval);
      connectionRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 5000);
  }, [connect, disconnect]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected: !!connectionRef.current,
    reconnect,
    disconnect
  };
}