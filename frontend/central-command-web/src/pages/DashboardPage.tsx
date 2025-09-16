/**
 * Main dashboard page with full integration
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
import { usePortalStore } from '@/stores/usePortalStore'
import { usePortalFilters } from '@/hooks/usePortalFilters'
import { useIncidentStore } from '@/stores/useIncidentStore'
import { useUIStore } from '@/stores/useUIStore'
import { useNotificationContext } from '@/components/notifications/NotificationProvider'
import { useCommandPalette } from '@/components/command-palette/CommandPaletteProvider'
import { PortalStatus } from '@/types/portal.types';
import { IncidentSeverity } from '@/types/incident.types';
import { ViewMode } from '@/types';
import { AlertTriangle, Plus, RefreshCw, Download } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { portals, filteredPortals, searchTerm, selectedCategory, setSearchTerm, setSelectedCategory } = usePortalFilters()
  const { toggleFavorite } = usePortalStore()
  const { incidents } = useIncidentStore()
  const { currentView, setView } = useUIStore()
  const viewMode = currentView === 'dashboard' ? ViewMode.GRID : currentView === 'list' ? ViewMode.LIST : ViewMode.GRID
  const { showWarning, showSuccess, showInfo } = useNotificationContext()
  const { openCommandPalette } = useCommandPalette()
  const [addPortalOpen, setAddPortalOpen] = useState(false)

  // Check for critical incidents
  const criticalIncidents = incidents.filter(
    i => i.severity === IncidentSeverity.Critical && i.status !== 'resolved'
  )

  // Check for degraded or down portals
  const problematicPortals = portals.filter(
    p => p.status === PortalStatus.Degraded || p.status === PortalStatus.Outage
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
        setView('grid')
        showInfo('View Changed', 'Switched to grid view')
      }
      // Cmd/Ctrl + L for list view
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        setView('list')
        showInfo('View Changed', 'Switched to list view')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openCommandPalette, setView, showInfo])

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

  const handleRefreshAll = () => {
    // Trigger refresh for all portals
    showInfo('Refreshing', 'Updating all portal statuses...')
    // In a real app, this would trigger API calls
    setTimeout(() => {
      showSuccess('Refresh Complete', 'All portals have been updated')
    }, 2000)
  }

  const handleExportData = () => {
    // Export portal data
    const dataStr = JSON.stringify(filteredPortals, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `portals-export-${new Date().toISOString()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    showSuccess('Export Complete', 'Portal data has been exported successfully')
  }

  return (
    <AppLayout>
      <MainContent
        portals={filteredPortals}
        allPortals={portals}
        viewMode={viewMode}
        selectedCategory={selectedCategory}
        onViewModeChange={(mode) => setView(mode === ViewMode.GRID ? 'grid' : 'list')}
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
              onFavoriteClick={toggleFavorite}
            />
          ) : (
            <PortalList
              portals={filteredPortals}
              onPortalClick={(portal) => navigate(`/portal/${portal.id}`)}
              onFavoriteClick={toggleFavorite}
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