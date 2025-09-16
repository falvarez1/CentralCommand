import React from 'react'
import { useIncidents } from '@/hooks/queries/useIncidentQueries'
import { IncidentCard } from './IncidentCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Incident, IncidentSeverity, IncidentStatus } from '@/types/incident.types'

interface IncidentListWithAPIProps {
  portalId?: string
  severity?: IncidentSeverity
  status?: IncidentStatus
  limit?: number
  onIncidentClick?: (incident: Incident) => void
  showEmpty?: boolean
}

export const IncidentListWithAPI: React.FC<IncidentListWithAPIProps> = ({
  portalId,
  severity,
  status,
  limit = 10,
  onIncidentClick,
  showEmpty = true
}) => {
  const {
    data: incidentsResponse,
    isLoading,
    error,
    refetch
  } = useIncidents({
    portalId,
    severity: severity?.toString(),
    status: status?.toString(),
    pageSize: limit,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const incidents = incidentsResponse?.data || []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Incidents</AlertTitle>
        <AlertDescription>
          <p>Failed to load incident data.</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (incidents.length === 0) {
    if (!showEmpty) return null

    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No incidents found</p>
        {(status === IncidentStatus.Open || status === IncidentStatus.InProgress) && (
          <p className="text-sm mt-2">All systems operational</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {incidents.map(incident => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          onClick={() => onIncidentClick?.(incident)}
        />
      ))}
    </div>
  )
}