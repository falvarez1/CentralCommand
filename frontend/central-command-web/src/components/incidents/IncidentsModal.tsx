import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,

} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import {
  Search,
  Plus,
  Download,

  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  BarChart3,
  FileText
} from 'lucide-react';
import { Incident, IncidentStatus, IncidentSeverity } from '../../types/incident.types';
import { useIncidentFilters } from '../../hooks/useIncidentFilters';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import IncidentCard from './IncidentCard';
import CreateIncidentModal from './CreateIncidentModal';
import IncidentDetailsModal from './IncidentDetailsModal';

interface IncidentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncidentsModal: React.FC<IncidentsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    incidents,
    incidentStats
  } = useIncidentFilters();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'all'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<IncidentSeverity | null>(null);

  // Filter incidents based on tab and search
  const displayIncidents = useMemo(() => {
    let filtered = [...incidents];

    // Apply tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(i =>
        i.status !== IncidentStatus.Resolved && i.status !== IncidentStatus.Closed
      );
    } else if (activeTab === 'resolved') {
      filtered = filtered.filter(i =>
        i.status === IncidentStatus.Resolved || i.status === IncidentStatus.Closed
      );
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.title.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term) ||
        i.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply severity filter
    if (selectedSeverityFilter) {
      filtered = filtered.filter(i => i.severity === selectedSeverityFilter);
    }

    // Sort by creation date (newest first)
    return [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [incidents, activeTab, searchTerm, selectedSeverityFilter]);

  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      statistics: incidentStats,
      incidents: displayIncidents.map(incident => ({
        id: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        type: incident.type,
        createdAt: incident.createdAt,
        resolvedAt: incident.resolvedAt,
        affectedServices: incident.affectedServices,
        impactedUsers: incident.impactedUsers,
        team: incident.team,
        assignee: incident.assignee,
        resolution: incident.resolution,
        rootCause: incident.rootCause
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Report exported', {
      description: 'Incidents report has been downloaded'
    });
  };

  const handleBulkResolve = () => {
    const unresolvedCount = displayIncidents.filter(i =>
      i.status !== IncidentStatus.Resolved && i.status !== IncidentStatus.Closed
    ).length;

    if (unresolvedCount === 0) {
      toast.error('No active incidents to resolve');
      return;
    }

    // In a real app, this would show a confirmation dialog
    toast.success(`${unresolvedCount} incidents marked for resolution`, {
      description: 'Bulk resolution process initiated'
    });
  };

  const severityFilters = [
    { value: IncidentSeverity.Critical, label: 'Critical', color: 'bg-red-500' },
    { value: IncidentSeverity.High, label: 'High', color: 'bg-orange-500' },
    { value: IncidentSeverity.Medium, label: 'Medium', color: 'bg-yellow-500' },
    { value: IncidentSeverity.Low, label: 'Low', color: 'bg-blue-500' }
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">Incident Management</DialogTitle>
                <DialogDescription>
                  Monitor and manage system incidents
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Incident
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4 h-full">
            {/* Statistics Summary */}
            <div className="grid grid-cols-6 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{incidentStats.total}</p>
                    </div>
                    <Activity className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Open</p>
                      <p className="text-xl font-bold text-red-600">{incidentStats.open}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Investigating</p>
                      <p className="text-xl font-bold text-yellow-600">{incidentStats.investigating}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Resolved</p>
                      <p className="text-xl font-bold text-green-600">{incidentStats.resolved}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg MTTR</p>
                      <p className="text-xl font-bold">{Math.round(incidentStats.averageMTTR)}m</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Last 24h</p>
                      <p className="text-xl font-bold">{incidentStats.last24Hours}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search incidents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {severityFilters.map(filter => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={selectedSeverityFilter === filter.value ? 'default' : 'outline'}
                    onClick={() => setSelectedSeverityFilter(
                      selectedSeverityFilter === filter.value ? null : filter.value
                    )}
                  >
                    <div className={cn('w-2 h-2 rounded-full mr-2', filter.color)} />
                    {filter.label}
                  </Button>
                ))}
              </div>
              {displayIncidents.filter(i =>
                i.status !== IncidentStatus.Resolved && i.status !== IncidentStatus.Closed
              ).length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkResolve}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Bulk Resolve
                </Button>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active">
                  Active
                  <Badge variant="secondary" className="ml-2">
                    {incidents.filter(i =>
                      i.status !== IncidentStatus.Resolved && i.status !== IncidentStatus.Closed
                    ).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved
                  <Badge variant="secondary" className="ml-2">
                    {incidents.filter(i =>
                      i.status === IncidentStatus.Resolved || i.status === IncidentStatus.Closed
                    ).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="all">
                  All
                  <Badge variant="secondary" className="ml-2">
                    {incidents.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value={activeTab} className="mt-0">
                  <div className="grid gap-3">
                    {displayIncidents.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          {searchTerm ? 'No incidents found matching your search' : 'No incidents in this category'}
                        </p>
                      </div>
                    ) : (
                      displayIncidents.map(incident => (
                        <IncidentCard
                          key={incident.id}
                          incident={incident}
                          onViewDetails={() => setSelectedIncident(incident)}
                        />
                      ))
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-modals */}
      {showCreateModal && (
        <CreateIncidentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </>
  );
};

export default IncidentsModal;