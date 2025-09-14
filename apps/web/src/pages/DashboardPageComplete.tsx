/**
 * Complete Dashboard page with full API integration, search, filtering, and real-time updates
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AppLayout, MainContent } from '@/components/layout'
import { PortalCard } from '@/components/portals/PortalCard'
import { PortalGrid } from '@/components/portals/PortalGrid'
import { PortalList } from '@/components/portals/PortalList'
import { AddPortalModalAPI } from '@/components/portals/AddPortalModalAPI'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotificationContext } from '@/components/notifications/NotificationProvider'
import { useCommandPalette } from '@/components/command-palette/CommandPaletteProvider'
import { usePortals, useDeletePortal, useTogglePortalFavorite, usePortalStats } from '@/hooks/queries/usePortalQueries'
import { useIncidents, useIncidentStats } from '@/hooks/queries/useIncidentQueries'
import { useDashboardStats, useSparklineData } from '@/hooks/queries/useStatisticsQueries'
import { useSignalR } from '@/hooks/useSignalR'
import { Portal, PortalStatus, PortalCategory } from '@/types/portal.types'
import { IncidentSeverity } from '@/types/incident.types'
import { ViewMode } from '@/types'
import {
  AlertTriangle, Plus, RefreshCw, Download, Search, Filter,
  MoreVertical, Edit, Trash2, Eye, Activity, TrendingUp,
  TrendingDown, Users, Server, AlertCircle, CheckCircle
} from 'lucide-react'
import { debounce } from 'lodash'

export const DashboardPageComplete: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showWarning, showSuccess, showInfo, showError } = useNotificationContext()
  const { openCommandPalette } = useCommandPalette()

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID)
  const [addPortalOpen, setAddPortalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // SignalR connection for real-time updates
  const { isConnected, connectionStatus } = useSignalR({
    onPortalUpdate: (portalId, data) => {
      // Update portal data in cache
      queryClient.setQueryData(['portals'], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          data: oldData.data.map((p: Portal) =>
            p.id === portalId ? { ...p, ...data } : p
          )
        }
      })
      showInfo('Portal Updated', `${data.name} metrics have been updated`)
    },
    onIncidentCreated: (incident) => {
      // Invalidate incident queries
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      if (incident.severity === IncidentSeverity.CRITICAL) {
        showWarning('Critical Incident', incident.title, {
          action: {
            label: 'View Details',
            onClick: () => navigate(`/incidents/${incident.id}`)
          }
        })
      }
    },
    onMetricsUpdate: (metrics) => {
      // Update dashboard metrics
      queryClient.setQueryData(['statistics', 'dashboard'], metrics)
    }
  })

  // Debounce search input
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearchTerm(value)
    }, 500),
    []
  )

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  // API Queries
  const {
    data: portalsResponse,
    isLoading: portalsLoading,
    error: portalsError,
    refetch: refetchPortals
  } = usePortals({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: debouncedSearchTerm || undefined,
    page: 1,
    pageSize: 50
  })

  const {
    data: incidentsResponse,
    isLoading: incidentsLoading
  } = useIncidents({
    status: 'active',
    page: 1,
    pageSize: 100
  })

  const { data: portalStats } = usePortalStats()
  const { data: incidentStats } = useIncidentStats()
  const { data: dashboardStats } = useDashboardStats()

  // Sparkline data for metrics
  const { data: uptimeSparkline } = useSparklineData('uptime', '24h')
  const { data: responseTimeSparkline } = useSparklineData('responseTime', '24h')
  const { data: errorRateSparkline } = useSparklineData('errorRate', '24h')

  // Mutations
  const deletePortalMutation = useDeletePortal()
  const toggleFavoriteMutation = useTogglePortalFavorite()

  const portals = portalsResponse?.data || []
  const incidents = incidentsResponse?.data || []

  // Filter and analysis
  const criticalIncidents = incidents.filter(
    i => i.severity === IncidentSeverity.CRITICAL && i.status !== 'resolved'
  )

  const problematicPortals = portals.filter(
    p => p.status === PortalStatus.DEGRADED || p.status === PortalStatus.OUTAGE
  )

  // Portal actions
  const handleToggleFavorite = useCallback((portalId: string) => {
    toggleFavoriteMutation.mutate(portalId)
  }, [toggleFavoriteMutation])

  const handleDeletePortal = useCallback((portal: Portal) => {
    setSelectedPortal(portal)
    setDeleteConfirmOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (selectedPortal) {
      deletePortalMutation.mutate(selectedPortal.id, {
        onSuccess: () => {
          setDeleteConfirmOpen(false)
          setSelectedPortal(null)
        }
      })
    }
  }, [selectedPortal, deletePortalMutation])

  const handleEditPortal = useCallback((portal: Portal) => {
    navigate(`/portal/${portal.id}/edit`)
  }, [navigate])

  const handleViewPortal = useCallback((portal: Portal) => {
    navigate(`/portal/${portal.id}`)
  }, [navigate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey)) {
        switch(e.key) {
          case 'k':
            e.preventDefault()
            openCommandPalette()
            break
          case 'n':
            e.preventDefault()
            setAddPortalOpen(true)
            break
          case 'g':
            e.preventDefault()
            setViewMode(ViewMode.GRID)
            showInfo('View Changed', 'Switched to grid view')
            break
          case 'l':
            e.preventDefault()
            setViewMode(ViewMode.LIST)
            showInfo('View Changed', 'Switched to list view')
            break
          case '/':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openCommandPalette, setViewMode, showInfo])

  const handleRefreshAll = async () => {
    showInfo('Refreshing', 'Updating all portal statuses...')
    await refetchPortals()
    queryClient.invalidateQueries({ queryKey: ['incidents'] })
    queryClient.invalidateQueries({ queryKey: ['statistics'] })
    showSuccess('Refresh Complete', 'All data has been updated')
  }

  const handleExportData = async () => {
    try {
      const { exportPortals } = await import('@/lib/api/services/portals.service')
      const exportData = await exportPortals('json')
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const exportFileDefaultName = `portals-export-${new Date().toISOString()}.json`

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()

      showSuccess('Export Complete', 'Portal data has been exported successfully')
    } catch (error) {
      showError('Export Failed', 'Failed to export portal data')
    }
  }

  // Portal action menu
  const PortalActionMenu = ({ portal }: { portal: Portal }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleViewPortal(portal)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEditPortal(portal)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Portal
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleDeletePortal(portal)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Portal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Loading state
  if (portalsLoading || incidentsLoading) {
    return (
      <AppLayout>
        <MainContent
          portals={[]}
          viewMode={viewMode}
          selectedCategory={selectedCategory}
          onViewModeChange={setViewMode}
          onCategoryChange={setSelectedCategory}
          onAddPortalClick={() => setAddPortalOpen(true)}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </MainContent>
      </AppLayout>
    )
  }

  // Error state
  if (portalsError) {
    return (
      <AppLayout>
        <MainContent
          portals={[]}
          viewMode={viewMode}
          selectedCategory={selectedCategory}
          onViewModeChange={setViewMode}
          onCategoryChange={setSelectedCategory}
          onAddPortalClick={() => setAddPortalOpen(true)}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              <p>Failed to load portal data. Please check your connection and try again.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </AlertDescription>
          </Alert>
        </MainContent>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <MainContent
        portals={portals}
        viewMode={viewMode}
        selectedCategory={selectedCategory}
        onViewModeChange={setViewMode}
        onCategoryChange={setSelectedCategory}
        onAddPortalClick={() => setAddPortalOpen(true)}
      >
        <div className="space-y-6">
          {/* Connection Status */}
          {!isConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Status</AlertTitle>
              <AlertDescription>
                Real-time updates are currently {connectionStatus}. Data will still refresh periodically.
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics Cards */}
          {dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Portals</p>
                    <p className="text-2xl font-bold">{portalStats?.total || 0}</p>
                  </div>
                  <Server className="h-8 w-8 text-muted-foreground" />
                </div>
                {portalStats?.operational && (
                  <div className="mt-2 flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500">{portalStats.operational} operational</span>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Incidents</p>
                    <p className="text-2xl font-bold">{incidentStats?.activeCount || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
                {criticalIncidents.length > 0 && (
                  <div className="mt-2 flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500">{criticalIncidents.length} critical</span>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{dashboardStats.avgResponseTime}ms</p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                {responseTimeSparkline && (
                  <div className="mt-2 h-8">
                    {/* Sparkline chart would go here */}
                  </div>
                )}
              </div>

              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                    <p className="text-2xl font-bold">{dashboardStats.systemUptime}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                {uptimeSparkline && (
                  <div className="mt-2 h-8">
                    {/* Sparkline chart would go here */}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Critical Alert Banner */}
          {(criticalIncidents.length > 0 || problematicPortals.length > 0) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>System Issues Detected</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  {criticalIncidents.length > 0 && (
                    <p>{criticalIncidents.length} critical incident(s) require immediate attention</p>
                  )}
                  {problematicPortals.length > 0 && (
                    <p>{problematicPortals.length} portal(s) experiencing issues</p>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/incidents')}
                  >
                    View Incidents
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Search and Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Search portals... (Ctrl+/)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddPortalOpen(true)}
                data-testid="add-portal-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Portal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('all')}
            >
              All ({portals.length})
            </Badge>
            {Object.values(PortalCategory).filter(cat => cat !== PortalCategory.ALL).map(category => {
              const count = portals.filter(p => p.category === category).length
              return (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category} ({count})
                </Badge>
              )
            })}
          </div>

          {/* Portal Grid/List with Actions */}
          {portals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No portals found matching your criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : viewMode === ViewMode.GRID ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portals.map(portal => (
                <div key={portal.id} className="relative">
                  <PortalCard
                    portal={portal}
                    onClick={() => handleViewPortal(portal)}
                    onFavoriteClick={() => handleToggleFavorite(portal.id)}
                  />
                  <div className="absolute top-2 right-2">
                    <PortalActionMenu portal={portal} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PortalList
              portals={portals}
              onPortalClick={handleViewPortal}
              onFavoriteClick={handleToggleFavorite}
              renderActions={(portal) => <PortalActionMenu portal={portal} />}
            />
          )}
        </div>
      </MainContent>

      {/* Add Portal Modal */}
      <AddPortalModalAPI
        open={addPortalOpen}
        onClose={() => setAddPortalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && selectedPortal && (
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Portal</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedPortal.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deletePortalMutation.isPending}
              >
                {deletePortalMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  )
}