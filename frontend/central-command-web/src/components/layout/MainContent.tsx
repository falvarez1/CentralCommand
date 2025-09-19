/**
 * Main content wrapper with alert banner, system overview, filters, and portal container
 */

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Server,
  AlertCircle,
  X,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Portal, SystemStats } from '@/types';
import { ViewMode, PortalCategory, PortalStatus } from '@/types';

interface MainContentProps {
  children: React.ReactNode;
  portals?: Portal[];
  allPortals?: Portal[];  // All portals for category counts
  systemStats?: SystemStats;
  onCategoryChange?: (category: string) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onAddPortalClick?: () => void;
  viewMode?: ViewMode;
  selectedCategory?: string;
}

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  portals = [],
  allPortals,
  systemStats,
  onCategoryChange,
  onViewModeChange,
  onAddPortalClick,
  viewMode = ViewMode.GRID,
  selectedCategory = 'all'
}) => {
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState({
    show: true,
    title: 'Documentation Portal Outage',
    description: 'The documentation portal is currently experiencing an outage. Our team is working to resolve the issue.',
    severity: 'critical' as const
  });

  // Calculate statistics from portals
  const stats = useMemo(() => {
    if (systemStats) return systemStats;

    const operational = portals.filter(p => p.status === PortalStatus.Operational).length;
    const totalRequests = portals.reduce((sum, p) => sum + (p.metrics?.requests || 0), 0);
    const totalErrors = portals.reduce((sum, p) => sum + (p.metrics?.errors || 0), 0);
    const avgResponseTime = portals.length > 0
      ? Math.round(portals.reduce((sum, p) => sum + (p.metrics?.responseTime || 0), 0) / portals.length)
      : 0;
    const avgUptime = portals.length > 0
      ? parseFloat((portals.reduce((sum, p) => sum + (p.metrics?.uptime || 0), 0) / portals.length).toFixed(2))
      : 0;

    return {
      totalPortals: portals.length,
      operationalPortals: operational,
      activePortals: operational,
      inactivePortals: portals.length - operational,
      healthScore: avgUptime,
      systemUptime: avgUptime,
      averageResponseTime: avgResponseTime,
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      throughput: 0,
      latency: avgResponseTime,
      timestamp: new Date(),
      trend: [],
      alerts: [],
      incidents: []
    } as SystemStats;
  }, [portals, systemStats]);
  const statCards: StatCard[] = [
    {
      title: 'Total Portals',
      value: stats.totalPortals,
      change: 2,
      changeLabel: 'from last month',
      icon: Server,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Operational',
      value: `${stats.operationalPortals}/${stats.totalPortals}`,
      change: stats.totalPortals > 0 ? ((stats.operationalPortals / stats.totalPortals) * 100) : 0,
      changeLabel: 'uptime',
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Avg Response',
      value: `${isNaN(stats.averageResponseTime) ? 0 : stats.averageResponseTime}ms`,
      change: -12,
      changeLabel: 'vs last hour',
      icon: TrendingDown,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Total Requests',
      value: isNaN(stats.totalRequests) ? '0' : stats.totalRequests.toLocaleString(),
      change: 15,
      changeLabel: 'vs yesterday',
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];

  // Use allPortals for counts if provided, otherwise fall back to portals
  const portalSource = allPortals || portals;

  const categories = [
    { id: 'all', label: 'All Portals', count: portalSource.length },
    { id: PortalCategory.Business, label: 'Business', count: portalSource.filter(p => p.category === PortalCategory.Business).length },
    { id: PortalCategory.Engineering, label: 'Engineering', count: portalSource.filter(p => p.category === PortalCategory.Engineering).length },
    { id: PortalCategory.Operations, label: 'Operations', count: portalSource.filter(p => p.category === PortalCategory.Operations).length },
    { id: PortalCategory.Security, label: 'Security', count: portalSource.filter(p => p.category === PortalCategory.Security).length },
    { id: PortalCategory.Support, label: 'Support', count: portalSource.filter(p => p.category === PortalCategory.Support).length }
  ];

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner */}
      {criticalAlert.show && !alertDismissed && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            {criticalAlert.title}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-red-500/20"
              onClick={() => setAlertDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription className="mt-2">
            {criticalAlert.description}
          </AlertDescription>
        </Alert>
      )}

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                {stat.change !== undefined && (
                  <div className="flex items-center gap-1">
                    {stat.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      stat.change > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {Math.abs(stat.change).toFixed(stat.change % 1 !== 0 ? 1 : 0)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                {stat.changeLabel && (
                  <p className="text-xs text-muted-foreground">{stat.changeLabel}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and View Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={onCategoryChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:flex sm:w-auto bg-muted/50">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="relative data-[state=active]:bg-background"
              >
                <>
                  <span>{category.label}</span>
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 px-1.5 text-xs"
                  >
                    {category.count}
                  </Badge>
                </>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>

          <div className="flex items-center border rounded-lg p-1 bg-muted/50">
            <Button
              variant={viewMode === ViewMode.GRID ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange?.(ViewMode.GRID)}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === ViewMode.LIST ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange?.(ViewMode.LIST)}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Portal Container */}
      <div className="relative">
        {/* Loading State */}
        {portals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Portals Found</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              There are no portals matching your current filters. Try adjusting your search criteria or add a new portal.
            </p>
            <Button className="mt-4" onClick={onAddPortalClick}>Add New Portal</Button>
          </div>
        )}

        {/* Children (Portal Grid/List) */}
        {portals.length > 0 && children}
      </div>
    </div>
  );
};