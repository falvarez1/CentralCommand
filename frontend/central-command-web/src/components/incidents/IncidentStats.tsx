import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Timer,
  Zap
} from 'lucide-react';
import { IncidentStats as IIncidentStats, IncidentSeverity, IncidentType } from '../../types/incident.types';
import { useIncidentStore } from '../../stores/useIncidentStore';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/separator';

interface IncidentStatsProps {
  stats?: IIncidentStats;
  className?: string;
  variant?: 'default' | 'compact';
}

const severityConfig = {
  [IncidentSeverity.Critical]: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-950',
    label: 'Critical'
  },
  [IncidentSeverity.High]: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-950',
    label: 'High'
  },
  [IncidentSeverity.Medium]: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950',
    label: 'Medium'
  },
  [IncidentSeverity.Low]: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    label: 'Low'
  }
};

const typeLabels: Record<IncidentType, string> = {
  [IncidentType.Outage]: 'Outage',
  [IncidentType.Performance]: 'Performance',
  [IncidentType.Maintenance]: 'Maintenance',
  [IncidentType.Security]: 'Security',
  [IncidentType.Database]: 'Database',
  [IncidentType.Service]: 'Service',
  [IncidentType.Infrastructure]: 'Infrastructure',
  [IncidentType.Network]: 'Network',
  [IncidentType.Configuration]: 'Configuration'
};

export const IncidentStats: React.FC<IncidentStatsProps> = ({
  stats: propStats,
  className,
  variant = 'default'
}) => {
  const { incidentStats } = useIncidentStore();
  const stats = propStats || incidentStats;

  const openPercentage = stats.total > 0 ? (stats.open / stats.total) * 100 : 0;
  const resolvedPercentage = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;

  const getTrend = () => {
    if (stats.last24Hours > stats.last7Days / 7) {
      return { icon: TrendingUp, color: 'text-red-500', label: 'Increasing' };
    } else if (stats.last24Hours < stats.last7Days / 7) {
      return { icon: TrendingDown, color: 'text-green-500', label: 'Decreasing' };
    }
    return { icon: Activity, color: 'text-gray-500', label: 'Stable' };
  };

  const trend = getTrend();

  if (variant === 'compact') {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-red-600">{stats.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">MTTR</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageMTTR)}m</p>
              </div>
              <Timer className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Incident Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Incidents</span>
                <span className="text-xl font-bold">{stats.total}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Open</span>
                  <span className="font-medium text-red-600">{stats.open}</span>
                </div>
                <Progress value={openPercentage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="font-medium text-green-600">{stats.resolved}</span>
                </div>
                <Progress value={resolvedPercentage} className="h-2 [&>div]:bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm">Open</span>
                </div>
                <Badge variant="outline">{stats.open}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">In Progress</span>
                </div>
                <Badge variant="outline">{stats.inProgress || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Acknowledged</span>
                </div>
                <Badge variant="outline">{stats.acknowledgedIncidents || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Resolved</span>
                </div>
                <Badge variant="outline">{stats.resolved}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg MTTR</span>
                </div>
                <span className="text-xl font-bold">{Math.round(stats.averageMTTR)}m</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg MTBF</span>
                </div>
                <span className="text-xl font-bold">{Math.round(stats.averageMTBF / 60)}h</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <trend.icon className={cn('w-4 h-4', trend.color)} />
                  <span className="text-sm text-muted-foreground">Trend</span>
                </div>
                <Badge variant="outline" className={cn('text-xs', trend.color)}>
                  {trend.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Severity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(severityConfig).map(([severity, config]) => {
              const count = stats.bySeverity[severity as IncidentSeverity] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

              return (
                <div key={severity} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <config.icon className={cn('w-4 h-4', config.color)} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                  <Progress
                    value={percentage}
                    className={cn('h-2', `[&>div]:${config.bgColor}`)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Incident Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-2 bg-accent rounded-lg">
                <span className="text-sm">{typeLabels[type as IncidentType]}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Last 24 Hours</p>
                <p className="text-2xl font-bold">{stats.last24Hours}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.last24Hours > 0 ? 'incidents reported' : 'No new incidents'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Last 7 Days</p>
                <p className="text-2xl font-bold">{stats.last7Days}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {(stats.last7Days / 7).toFixed(1)}/day
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncidentStats;