/**
 * Dashboard page with full API integration
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppLayout, MainContent } from '@/components/layout'
import { PortalCard } from '@/components/portals/PortalCard'
import { PortalGrid } from '@/components/portals/PortalGrid'
import { PortalList } from '@/components/portals/PortalList'
import { AddPortalModal } from '@/components/portals/AddPortalModal'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIncidentStore } from '@/stores/useIncidentStore'
import { useUIStore } from '@/stores/useUIStore'
import { useNotificationContext } from '@/components/notifications/NotificationProvider'
import { useCommandPalette } from '@/components/command-palette/CommandPaletteProvider'
import { portalsService } from '@/lib/api/services/portals.service'
import { incidentsService } from '@/lib/api/services/incidents.service'
import { Portal, PortalStatus, PortalCategory } from '@/types/portal.types'
import { IncidentSeverity } from '@/types/incident.types'
import { ViewMode } from '@/types'
import { AlertTriangle, Plus, RefreshCw, Download } from 'lucide-react'

export const DashboardPageWithAPI: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { viewMode, setViewMode } = useUIStore()
  const { showWarning, showSuccess, showInfo, showError } = useNotificationContext()
  const { openCommandPalette } = useCommandPalette()
  const [addPortalOpen, setAddPortalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Fetch portals from API
  const {
    data: portalsResponse,
    isLoading: portalsLoading,
    error: portalsError,
    refetch: refetchPortals
  } = useQuery({
    queryKey: ['portals', selectedCategory, searchTerm],
    queryFn: () => portalsService.getPortals({
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchTerm || undefined,
      page: 1,
      pageSize: 50
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch incidents from API
  const {
    data: incidentsResponse,
    isLoading: incidentsLoading,
    error: incidentsError
  } = useQuery({
    queryKey: ['incidents', 'active'],
    queryFn: () => incidentsService.getIncidents({
      status: 'active',
      page: 1,
      pageSize: 100
    }),
    refetchInterval: 30000,
  })

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (portalId: string) => portalsService.toggleFavorite(portalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portals'] })
      showSuccess('Success', 'Favorite status updated')
    },
    onError: () => {
      showError('Error', 'Failed to update favorite status')
    }
  })

  const portals = portalsResponse?.data || []
  const incidents = incidentsResponse?.data || []

  // Filter portals based on search and category (client-side filtering as backup)
  const filteredPortals = React.useMemo(() => {
    let filtered = [...portals]

    if (searchTerm) {
      filtered = filtered.filter(portal =>
        portal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        portal.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(portal =>
        portal.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    return filtered
  }, [portals, searchTerm, selectedCategory])

  // Check for critical incidents
  const criticalIncidents = incidents.filter(
    i => i.severity === IncidentSeverity.Critical && i.status !== 'resolved'
  )

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
      // Cmd/Ctrl + G for grid view
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault()
        setViewMode(ViewMode.GRID)
        showInfo('View Changed', 'Switched to grid view')
      }
      // Cmd/Ctrl + L for list view
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        setViewMode(ViewMode.LIST)
        showInfo('View Changed', 'Switched to list view')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openCommandPalette, setViewMode, showInfo])

  // Show notifications for critical issues
  useEffect(() => {
    if (criticalIncidents.length > 0) {
      showWarning(
        'Critical Incidents',
        `There are ${criticalIncidents.length} critical incidents requiring attention`,
        {
          action: {
            label: 'View Incidents',
            onClick: () => navigate('/incidents')
          }
        }
      )
    }
  }, [criticalIncidents.length])

  const handleRefreshAll = async () => {
    showInfo('Refreshing', 'Updating all portal statuses...')
    await refetchPortals()
    showSuccess('Refresh Complete', 'All portals have been updated')
  }

  const handleExportData = async () => {
    try {
      const exportData = await portalsService.exportPortals('json')
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

  const handleToggleFavorite = (portalId: string) => {
    toggleFavoriteMutation.mutate(portalId)
  }

  // Handle loading state
  if (portalsLoading || incidentsLoading) {
    return (
      <AppLayout>
        <MainContent
          portals={[]}
          viewMode={viewMode}
          selectedCategory={selectedCategory}
          onViewModeChange={setViewMode}
          onCategoryChange={setSelectedCategory}
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

  // Handle error state
  if (portalsError || incidentsError) {
    return (
      <AppLayout>
        <MainContent
          portals={[]}
          viewMode={viewMode}
          selectedCategory={selectedCategory}
          onViewModeChange={setViewMode}
          onCategoryChange={setSelectedCategory}
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
        portals={filteredPortals}
        viewMode={viewMode}
        selectedCategory={selectedCategory}
        onViewModeChange={setViewMode}
        onCategoryChange={setSelectedCategory}
      >
        <div className="space-y-6">
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
                  {problematicPortals.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCategory('all')}
                    >
                      Show All Portals
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddPortalOpen(true)}
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
                Refresh All
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
            <div className="text-sm text-muted-foreground">
              Showing {filteredPortals.length} of {portals.length} portals
            </div>
          </div>

          {/* Portal Grid/List */}
          {filteredPortals.length === 0 ? (
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
            <PortalGrid
              portals={filteredPortals}
              onPortalClick={(portal) => navigate(`/portal/${portal.id}`)}
              onFavoriteClick={handleToggleFavorite}
            />
          ) : (
            <PortalList
              portals={filteredPortals}
              onPortalClick={(portal) => navigate(`/portal/${portal.id}`)}
              onFavoriteClick={handleToggleFavorite}
            />
          )}
        </div>
      </MainContent>

      {/* Add Portal Modal */}
      <AddPortalModal
        open={addPortalOpen}
        onClose={() => setAddPortalOpen(false)}
      />
    </AppLayout>
  )
}