import { useState } from 'react'
import { AppLayout } from '@/components/layout'
import { useIncidentStore } from '@/stores/useIncidentStore'
import { IncidentSeverity, IncidentStatus } from '@/types'
import { IncidentCard, IncidentDetailsModal, CreateIncidentModal, IncidentStats, IncidentTimeline } from '@/components/incidents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react'

export const IncidentsPage = () => {
  const { incidents, stats, filterBySeverity, filterByStatus, searchIncidents } = useIncidentStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | 'all'>('all')
  const [selectedIncident, setSelectedIncident] = useState<number | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Filter incidents based on search and filters
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = searchTerm === '' ||
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSeverity = selectedSeverity === 'all' || incident.severity === selectedSeverity
    const matchesStatus = selectedStatus === 'all' || incident.status === selectedStatus

    return matchesSearch && matchesSeverity && matchesStatus
  })

  const getSeverityIcon = (severity: IncidentSeverity) => {
    switch (severity) {
      case IncidentSeverity.CRITICAL:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case IncidentSeverity.HIGH:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case IncidentSeverity.MEDIUM:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case IncidentSeverity.LOW:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case IncidentStatus.OPEN:
        return <Clock className="h-4 w-4 text-blue-500" />
      case IncidentStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-yellow-500" />
      case IncidentStatus.RESOLVED:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case IncidentStatus.CLOSED:
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Incidents</h1>
            <p className="text-muted-foreground">Manage and track system incidents</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </div>

        {/* Stats */}
        <IncidentStats />

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSeverity} onValueChange={(value) => setSelectedSeverity(value as IncidentSeverity | 'all')}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value={IncidentSeverity.CRITICAL}>Critical</SelectItem>
              <SelectItem value={IncidentSeverity.HIGH}>High</SelectItem>
              <SelectItem value={IncidentSeverity.MEDIUM}>Medium</SelectItem>
              <SelectItem value={IncidentSeverity.LOW}>Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as IncidentStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={IncidentStatus.OPEN}>Open</SelectItem>
              <SelectItem value={IncidentStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={IncidentStatus.RESOLVED}>Resolved</SelectItem>
              <SelectItem value={IncidentStatus.CLOSED}>Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              All Incidents
              <Badge variant="secondary" className="ml-2">
                {incidents.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge variant="destructive" className="ml-2">
                {incidents.filter(i => i.status === IncidentStatus.OPEN || i.status === IncidentStatus.IN_PROGRESS).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved
              <Badge variant="secondary" className="ml-2">
                {incidents.filter(i => i.status === IncidentStatus.RESOLVED).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIncidents.map(incident => (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident.id)}
                  className="cursor-pointer"
                >
                  <IncidentCard incident={incident} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIncidents
                .filter(i => i.status === IncidentStatus.OPEN || i.status === IncidentStatus.IN_PROGRESS)
                .map(incident => (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident.id)}
                    className="cursor-pointer"
                  >
                    <IncidentCard incident={incident} />
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIncidents
                .filter(i => i.status === IncidentStatus.RESOLVED)
                .map(incident => (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident.id)}
                    className="cursor-pointer"
                  >
                    <IncidentCard incident={incident} />
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <IncidentTimeline incidents={filteredIncidents} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {selectedIncident && (
          <IncidentDetailsModal
            incidentId={selectedIncident}
            open={!!selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        )}

        <CreateIncidentModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />
      </div>
    </AppLayout>
  )
}