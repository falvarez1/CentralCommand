/**
 * Dashboard page with full API integration
 * This version uses the real API instead of mock data
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout, MainContent } from '@/components/layout'
import { PortalCard } from '@/components/portals/PortalCard'
import { PortalGrid } from '@/components/portals/PortalGrid'
import { PortalList } from '@/components/portals/PortalList'
import { AddPortalModal } from '@/components/portals/AddPortalModal'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePortalData } from '@/hooks/usePortalData'
import { useDashboardStats } from '@/hooks/queries/useStatisticsQueries'
import { useIncidents } from '@/hooks/queries/useIncidentQueries'
import { useDashboardSignalR } from '@/hooks/useSignalR'
import { useUIStore } from '@/stores/useUIStore'
import { useNotificationContext } from '@/components/notifications/NotificationProvider'
import { useCommandPalette } from '@/components/command-palette/CommandPaletteProvider'
import { PortalStatus, PortalCategory } from '@/types/portal.types'
import { IncidentSeverity } from '@/types/incident.types'
import { ViewMode } from '@/types'
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Download,
  Loader2,
  WifiOff,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'

export const DashboardPageApi: React.FC = () => {
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useUIStore()
  const { showWarning, showSuccess, showInfo, showError } = useNotificationContext()
  const { openCommandPalette } = useCommandPalette()
  const [addPortalOpen, setAddPortalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<PortalCategory | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // API Data Hooks
  const {
    portals,
    stats,
    isLoading,
    error,
    isRefetching,
    lastSync,
    refresh,
    setFilter,
    clearFilter,
    createPortal,
    updatePortal,
    deletePortal,
    toggleFavorite,
    selectedPortals,
    selectPortal,
    deselectPortal,
    clearSelection,
  } = usePortalData({
    category: selectedCategory || undefined,
    search: searchTerm || undefined,
    pageSize: 50,
  })

  // Dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats()

  // Incidents data
  const { data: incidentsData, isLoading: incidentsLoading } = useIncidents({
    status: 'active',
    pageSize: 10,
  })

  // Real-time updates
  const { lastUpdate } = useDashboardSignalR()

  // Check for critical incidents
  const criticalIncidents = incidentsData?.data.filter(
    i => i.severity === IncidentSeverity.Critical && i.status !== 'resolved'
  ) || []

  // Check for degraded or down portals
  const problematicPortals = portals.filter(
    p => p.status === PortalStatus.DEGRADED || p.status === PortalStatus.OUTAGE
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openCommandPalette()
      }
      // Cmd/Ctrl + N for new portal
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setAddPortalOpen(true)
      }
      // Cmd/Ctrl + R for refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault()
        handleRefresh()
      }
      // 1, 2, 3 for view modes
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '1') setViewMode(ViewMode.GRID)
        if (e.key === '2') setViewMode(ViewMode.LIST)
        if (e.key === '3') setViewMode(ViewMode.COMPACT)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openCommandPalette, setViewMode])

  // Handle refresh
  const handleRefresh = async () => {
    showInfo('Refreshing data...', { duration: 2000 })
    await refresh()
    showSuccess('Data refreshed successfully', { duration: 2000 })
  }

  // Handle export
  const handleExport = () => {
    const dataStr = JSON.stringify({ portals, stats, incidents: incidentsData?.data }, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `central-command-export-${Date.now()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    showSuccess('Data exported successfully')
  }

  // Handle portal actions
  const handlePortalClick = (portalId: string) => {
    navigate(`/portal/${portalId}`)
  }

  const handleToggleFavorite = async (portalId: string) => {
    try {
      await toggleFavorite(portalId)
    } catch (error) {
      showError('Failed to update favorite status')
    }
  }

  const handleCreatePortal = async (data: any) => {
    try {
      const newPortal = await createPortal(data)
      if (newPortal) {
        showSuccess(`Portal "${newPortal.name}" created successfully`)
        setAddPortalOpen(false)
      }
    } catch (error) {
      showError('Failed to create portal')
    }
  }

  // Loading state
  if (isLoading && !portals.length) {
    return (
      <AppLayout>
        <MainContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </MainContent>
      </AppLayout>
    )
  }

  // Error state
  if (error && !portals.length) {
    return (
      <AppLayout>
        <MainContent>
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Failed to load portal data. Please check your connection and try again.
            </AlertDescription>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </Alert>
        </MainContent>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <MainContent>
        <div className="space-y-6">
          {/* Header with stats */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitoring {stats.total} portals across {Object.keys(stats.byCategory).length} categories
              </p>
              {lastSync && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last synced: {format(lastSync, 'PPpp')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setAddPortalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Portal
              </Button>
            </div>
          </div>

          {/* Status Overview Cards */}
          {dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">System Health</p>
                    <p className="text-2xl font-bold">{dashboardStats.systemHealth}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Incidents</p>
                    <p className="text-2xl font-bold">{dashboardStats.activeIncidents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{dashboardStats.avgResponseTime}ms</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold">{dashboardStats.uptime}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>
          )}

          {/* Critical Alerts */}
          {criticalIncidents.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Incidents Active</AlertTitle>
              <AlertDescription>
                There are {criticalIncidents.length} critical incidents requiring immediate attention.
                <Button
                  variant="link"
                  className="px-2"
                  onClick={() => navigate('/incidents')}
                >
                  View Incidents →
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Degraded/Down Portals Alert */}
          {problematicPortals.length > 0 && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Portal Issues Detected</AlertTitle>
              <AlertDescription>
                {problematicPortals.length} portal(s) are experiencing issues:
                <ul className="mt-2 ml-4 list-disc">
                  {problematicPortals.slice(0, 3).map(portal => (
                    <li key={portal.id}>
                      <button
                        onClick={() => handlePortalClick(portal.id)}
                        className="text-primary hover:underline"
                      >
                        {portal.name}
                      </button>
                      {' - '}
                      <span className={
                        portal.status === PortalStatus.OUTAGE
                          ? 'text-destructive'
                          : 'text-warning'
                      }>
                        {portal.status}
                      </span>
                    </li>
                  ))}
                  {problematicPortals.length > 3 && (
                    <li>...and {problematicPortals.length - 3} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Real-time update indicator */}
          {lastUpdate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Real-time updates active • Last update: {format(lastUpdate, 'p')}
            </div>
          )}

          {/* Portals Display */}
          {viewMode === ViewMode.GRID && (
            <PortalGrid
              portals={portals}
              onPortalClick={handlePortalClick}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {viewMode === ViewMode.LIST && (
            <PortalList
              portals={portals}
              onPortalClick={handlePortalClick}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {viewMode === ViewMode.COMPACT && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {portals.map(portal => (
                <PortalCard
                  key={portal.id}
                  portal={portal}
                  onClick={() => handlePortalClick(portal.id)}
                  onToggleFavorite={() => handleToggleFavorite(portal.id)}
                  compact
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && portals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No portals found matching your criteria.
              </p>
              <Button onClick={() => setAddPortalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Portal
              </Button>
            </div>
          )}
        </div>

        {/* Add Portal Modal */}
        <AddPortalModal
          open={addPortalOpen}
          onOpenChange={setAddPortalOpen}
          onSubmit={handleCreatePortal}
        />
      </MainContent>
    </AppLayout>
  )
}