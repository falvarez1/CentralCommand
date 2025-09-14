/**
 * PortalDetailsModal component - Detailed view of a portal with metrics dashboard
 * @module components/portals/PortalDetailsModal
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Portal,
  PortalStatus,
  PortalHealthCheck,
  PortalChartData
} from '@/types/portal.types';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Cpu,
  ExternalLink,
  Globe,
  HardDrive,
  Info,
  Lock,
  MemoryStick,
  RefreshCw,
  Server,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
  XCircle,
  Zap
} from 'lucide-react';

interface PortalDetailsModalProps {
  portal: Portal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  healthChecks?: PortalHealthCheck[];
  chartData?: PortalChartData[];
  incidents?: any[]; // Would import from incident types
}

// Status icon component
const StatusIcon: React.FC<{ status: PortalStatus; size?: 'sm' | 'md' | 'lg' }> = ({ status, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';

  switch (status) {
    case PortalStatus.OPERATIONAL:
      return <CheckCircle className={cn(sizeClass, 'text-green-500')} />;
    case PortalStatus.DEGRADED:
      return <AlertCircle className={cn(sizeClass, 'text-yellow-500')} />;
    case PortalStatus.MAINTENANCE:
      return <Wrench className={cn(sizeClass, 'text-blue-500')} />;
    case PortalStatus.OUTAGE:
      return <XCircle className={cn(sizeClass, 'text-red-500')} />;
    default:
      return null;
  }
};

// Metric card component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'good' | 'warning' | 'critical';
}> = ({ title, value, unit, icon: Icon, trend, trendValue, status }) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Activity className="w-3 h-3" />;
  };

  const getStatusColor = () => {
    if (!status) return '';
    if (status === 'good') return 'text-green-500';
    if (status === 'warning') return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className={cn('text-2xl font-bold', getStatusColor())}>
                {value}
                {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
              </p>
            </div>
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {getTrendIcon()}
              {trendValue}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Simple line chart component
const SimpleLineChart: React.FC<{ data: number[]; height?: number }> = ({ data, height = 100 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 400;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1="0"
          y1={i * (height / 4)}
          x2={width}
          y2={i * (height / 4)}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#gradient)"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 20) - 10;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="3"
            fill="hsl(var(--primary))"
            className="opacity-80"
          />
        );
      })}
    </svg>
  );
};

export const PortalDetailsModal: React.FC<PortalDetailsModalProps> = ({
  portal,
  open,
  onOpenChange,
  healthChecks = [],
  chartData = [],
  incidents = []
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!portal) return null;

  // Mock data for demonstration
  const responseTimeData = [142, 158, 132, 189, 145, 167, 155, 171, 148, 162];
  const uptimeData = [99.98, 99.95, 99.99, 99.92, 99.98, 99.96, 99.99, 99.94, 99.97, 99.95];
  const requestsData = [1250, 1180, 1320, 1410, 1290, 1350, 1280, 1390, 1310, 1420];
  const errorRateData = [0.2, 0.1, 0.3, 0.5, 0.2, 0.1, 0.2, 0.4, 0.3, 0.2];

  const recentHealthChecks = [
    { timestamp: '2024-01-15 14:30:00', status: 'success', responseTime: 142, statusCode: 200 },
    { timestamp: '2024-01-15 14:25:00', status: 'success', responseTime: 158, statusCode: 200 },
    { timestamp: '2024-01-15 14:20:00', status: 'success', responseTime: 132, statusCode: 200 },
    { timestamp: '2024-01-15 14:15:00', status: 'warning', responseTime: 489, statusCode: 200 },
    { timestamp: '2024-01-15 14:10:00', status: 'success', responseTime: 145, statusCode: 200 },
  ];

  const recentIncidents = [
    { id: 1, title: 'High response time detected', severity: 'warning', time: '2 hours ago', resolved: true },
    { id: 2, title: 'Connection timeout', severity: 'critical', time: '1 day ago', resolved: true },
    { id: 3, title: 'SSL certificate expiring soon', severity: 'info', time: '3 days ago', resolved: false },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{portal.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Globe className="w-3 h-3" />
                  {portal.url}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  portal.status === PortalStatus.OPERATIONAL ? 'default' :
                  portal.status === PortalStatus.DEGRADED ? 'secondary' :
                  portal.status === PortalStatus.MAINTENANCE ? 'outline' :
                  'destructive'
                }
                className="gap-1"
              >
                <StatusIcon status={portal.status} size="sm" />
                <span className="capitalize">{portal.status}</span>
              </Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(portal.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="health">Health Checks</TabsTrigger>
              <TabsTrigger value="incidents">Incidents</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(90vh-200px)]">
            <div className="p-6 pt-4">
              <TabsContent value="overview" className="space-y-4 mt-0">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    title="Response Time"
                    value={portal.metrics.responseTime}
                    unit="ms"
                    icon={Clock}
                    trend="down"
                    trendValue="-12%"
                    status={portal.metrics.responseTime > 500 ? 'warning' : 'good'}
                  />
                  <MetricCard
                    title="Uptime"
                    value={portal.metrics.uptime.toFixed(2)}
                    unit="%"
                    icon={TrendingUp}
                    trend="stable"
                    trendValue="0%"
                    status={portal.metrics.uptime < 99 ? 'warning' : 'good'}
                  />
                  <MetricCard
                    title="Requests"
                    value={portal.metrics.requests.toLocaleString()}
                    icon={Activity}
                    trend="up"
                    trendValue="+8%"
                  />
                  <MetricCard
                    title="Error Rate"
                    value={(portal.metrics.errors / portal.metrics.requests * 100).toFixed(2)}
                    unit="%"
                    icon={AlertCircle}
                    trend="down"
                    trendValue="-0.1%"
                    status={portal.metrics.errors > 10 ? 'warning' : 'good'}
                  />
                </div>

                {/* Resource Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resource Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-muted-foreground" />
                          CPU Usage
                        </span>
                        <span className="font-medium">{portal.metrics.cpu}%</span>
                      </div>
                      <Progress value={portal.metrics.cpu} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <MemoryStick className="w-4 h-4 text-muted-foreground" />
                          Memory Usage
                        </span>
                        <span className="font-medium">{portal.metrics.memory}%</span>
                      </div>
                      <Progress value={portal.metrics.memory} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-muted-foreground" />
                          Disk Usage
                        </span>
                        <span className="font-medium">72%</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Portal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Portal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Category</dt>
                        <dd className="font-medium mt-1">{portal.category}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Environment</dt>
                        <dd className="font-medium mt-1 capitalize">{portal.config?.environment || 'production'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Priority</dt>
                        <dd className="font-medium mt-1 capitalize">{portal.config?.priority || 'medium'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Authentication</dt>
                        <dd className="font-medium mt-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {portal.config?.authType?.toUpperCase() || 'SAML'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Owner</dt>
                        <dd className="font-medium mt-1">{portal.owner || 'Not assigned'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Team</dt>
                        <dd className="font-medium mt-1">{portal.team || 'Not assigned'}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">Description</dt>
                        <dd className="font-medium mt-1">{portal.description}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">Last Updated</dt>
                        <dd className="font-medium mt-1">
                          {new Date(portal.metrics.lastChecked).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Response Time (ms)</CardTitle>
                      <CardDescription>Last 10 measurements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SimpleLineChart data={responseTimeData} />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Min: 132ms</span>
                        <span>Avg: 156ms</span>
                        <span>Max: 189ms</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Uptime (%)</CardTitle>
                      <CardDescription>Last 10 measurements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SimpleLineChart data={uptimeData} />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Min: 99.92%</span>
                        <span>Avg: 99.96%</span>
                        <span>Max: 99.99%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Request Volume</CardTitle>
                      <CardDescription>Last 10 measurements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SimpleLineChart data={requestsData} />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Min: 1,180</span>
                        <span>Avg: 1,320</span>
                        <span>Max: 1,420</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Error Rate (%)</CardTitle>
                      <CardDescription>Last 10 measurements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SimpleLineChart data={errorRateData} />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Min: 0.1%</span>
                        <span>Avg: 0.25%</span>
                        <span>Max: 0.5%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="health" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Health Checks</CardTitle>
                    <CardDescription>Last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {recentHealthChecks.map((check, index) => (
                        <div key={index} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            {check.status === 'success' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : check.status === 'warning' ? (
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                Status Code: {check.statusCode}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {check.timestamp}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              'text-sm font-medium',
                              check.responseTime > 300 ? 'text-yellow-500' : 'text-green-500'
                            )}>
                              {check.responseTime}ms
                            </p>
                            <p className="text-xs text-muted-foreground">Response Time</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Health Check Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Check Interval</dt>
                        <dd className="font-medium mt-1">{portal.config?.checkInterval || 60} seconds</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Timeout</dt>
                        <dd className="font-medium mt-1">{portal.config?.timeout || 10} seconds</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Retry Attempts</dt>
                        <dd className="font-medium mt-1">{portal.config?.retryAttempts || 3}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Alert Threshold</dt>
                        <dd className="font-medium mt-1">{portal.config?.alertThreshold || 95}%</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="incidents" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Incidents</CardTitle>
                    <CardDescription>Last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {recentIncidents.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          No incidents reported in the last 7 days
                        </div>
                      ) : (
                        recentIncidents.map((incident) => (
                          <div key={incident.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              {incident.severity === 'critical' ? (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                              ) : incident.severity === 'warning' ? (
                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                              ) : (
                                <Info className="w-5 h-5 text-blue-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{incident.title}</p>
                                <p className="text-xs text-muted-foreground">{incident.time}</p>
                              </div>
                            </div>
                            <Badge variant={incident.resolved ? 'outline' : 'destructive'}>
                              {incident.resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="configuration" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Portal Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground mb-1">Portal URL</dt>
                        <dd className="font-mono text-xs bg-muted p-2 rounded">{portal.url}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-1">Environment Variables</dt>
                        <dd className="font-mono text-xs bg-muted p-2 rounded">
                          NODE_ENV=production<br />
                          API_TIMEOUT=10000<br />
                          MAX_RETRIES=3<br />
                          ENABLE_SSL=true
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-1">Health Check Endpoint</dt>
                        <dd className="font-mono text-xs bg-muted p-2 rounded">{portal.url}/health</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-1">Monitoring Tags</dt>
                        <dd className="flex flex-wrap gap-2 mt-2">
                          {portal.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          )) || <span className="text-muted-foreground">No tags assigned</span>}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Restart Service
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Zap className="w-4 h-4 mr-2" />
                      Run Health Check Now
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Server className="w-4 h-4 mr-2" />
                      View Logs
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Schedule Maintenance
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};