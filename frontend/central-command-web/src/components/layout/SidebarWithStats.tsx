import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStats, useSparklineData } from '@/hooks/queries/useStatisticsQueries'
import { useIncidentStats } from '@/hooks/queries/useIncidentQueries'
import { usePortalStats } from '@/hooks/queries/usePortalQueries'
import {
  Home,
  LayoutGrid,
  Server,
  AlertTriangle,
  Activity,
  Settings,
  HelpCircle,
  TrendingDown,
  XCircle,
  Zap
} from 'lucide-react'

interface SidebarItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number | string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export const SidebarWithStats: React.FC = () => {
  const location = useLocation()
  const { data: dashboardStats, isLoading: dashboardLoading } = useDashboardStats()
    const { data: portalStats, isLoading: portalLoading } = usePortalStats()
    
  const navigationItems: SidebarItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Home
    },
    {
      label: 'Portals',
      href: '/portals',
      icon: LayoutGrid,
      badge: portalStats?.total,
      badgeVariant: 'secondary'
    },
    {
      label: 'Incidents',
      href: '/incidents',
      icon: AlertTriangle,
      badge: incidentStats?.activeCount,
      badgeVariant: incidentStats?.criticalCount > 0 ? 'destructive' : 'default'
    },
    {
      label: 'Monitoring',
      href: '/monitoring',
      icon: Activity
    },
    {
      label: 'Infrastructure',
      href: '/infrastructure',
      icon: Server
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ]

  const StatCard = ({
    label,
    value,
    icon: Icon,
    trend,
    loading = false
  }: {
    label: string
    value: string | number
    icon: React.ElementType
    trend?: 'up' | 'down' | 'neutral'
    loading?: boolean
  }) => {
    if (loading) {
      return (
        <div className="p-3 rounded-lg border bg-card">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-6 w-16" />
        </div>
      )
    }

    return (
      <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{value}</span>
          {trend && (
            <>
              {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
            </>
          )}
        </div>
      </div>
    )
  }

  const SystemHealthIndicator = () => {
    const healthScore = dashboardStats?.systemHealth || 0
    let healthColor = 'text-green-500'
    let healthIcon = CheckCircle
    let healthText = 'Healthy'

    if (healthScore < 50) {
      healthColor = 'text-red-500'
      healthIcon = XCircle
      healthText = 'Critical'
    } else if (healthScore < 80) {
      healthColor = 'text-yellow-500'
      healthIcon = AlertCircle
      healthText = 'Degraded'
    }

    return (
      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">System Health</h3>
          <Badge variant={healthScore >= 80 ? 'default' : healthScore >= 50 ? 'secondary' : 'destructive'}>
            {healthScore}%
          </Badge>
        </div>
        <div className={cn('flex items-center gap-2', healthColor)}>
          {React.createElement(healthIcon, { className: 'h-5 w-5' })}
          <span className="font-medium">{healthText}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Central Command</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                  {item.badge !== undefined && (
                    <Badge
                      variant={item.badgeVariant}
                      className="ml-auto"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        <Separator className="my-4" />

        {/* System Health */}
        <div className="px-3">
          <SystemHealthIndicator />
        </div>

        <Separator className="my-4" />

        {/* Quick Stats */}
        <div className="space-y-4 px-3">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Stats</h3>

          <div className="space-y-3">
            <StatCard
              label="Uptime"
              value={`${dashboardStats?.systemUptime || 0}%`}
              icon={Clock}
              trend={dashboardStats?.uptimeTrend}
              loading={dashboardLoading}
            />

            <StatCard
              label="Response Time"
              value={`${dashboardStats?.avgResponseTime || 0}ms`}
              icon={Zap}
              trend={dashboardStats?.responseTimeTrend}
              loading={dashboardLoading}
            />

            <StatCard
              label="Active Portals"
              value={portalStats?.operational || 0}
              icon={CheckCircle}
              loading={portalLoading}
            />

            <StatCard
              label="Issues"
              value={portalStats?.outage || 0}
              icon={AlertTriangle}
              loading={portalLoading}
            />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Recent Activity */}
        <div className="space-y-4 px-3">
          <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>

          {incidentStats?.recentIncidents ? (
            <div className="space-y-2">
              {incidentStats.recentIncidents.slice(0, 3).map((incident: any) => (
                <div key={incident.id} className="text-xs space-y-1">
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      incident.severity === 'critical' ? 'bg-red-500' :
                      incident.severity === 'high' ? 'bg-orange-500' :
                      incident.severity === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    )} />
                    <span className="truncate">{incident.title}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(incident.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No recent activity</p>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Support
        </Button>
      </div>
    </div>
  )
}