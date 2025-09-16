import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Filter,
  Activity,
  TrendingUp,
  Shield,
  Database,
  Server,
  Wifi,
  Lock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Incident, IncidentSeverity, IncidentStatus, IncidentType } from '../../types/incident.types';
import { cn } from '../../lib/utils';
import { useIncidentStore } from '../../stores/useIncidentStore';

interface IncidentTimelineProps {
  incidents?: Incident[];
  onIncidentClick?: (incident: Incident) => void;
  maxHeight?: string;
  showFilters?: boolean;
  className?: string;
}

type FilterType = 'all' | 'critical' | 'resolved' | 'pending';

const severityIcons = {
  [IncidentSeverity.Critical]: AlertCircle,
  [IncidentSeverity.High]: AlertTriangle,
  [IncidentSeverity.Medium]: AlertTriangle,
  [IncidentSeverity.Low]: Info
};

const severityColors = {
  [IncidentSeverity.Critical]: 'text-red-500 dark:text-red-400',
  [IncidentSeverity.High]: 'text-orange-500 dark:text-orange-400',
  [IncidentSeverity.Medium]: 'text-yellow-500 dark:text-yellow-400',
  [IncidentSeverity.Low]: 'text-blue-500 dark:text-blue-400'
};

const typeIcons = {
  [IncidentType.Outage]: Activity,
  [IncidentType.Performance]: TrendingUp,
  [IncidentType.Maintenance]: Clock,
  [IncidentType.Security]: Lock,
  [IncidentType.Database]: Database,
  [IncidentType.Service]: Server,
  [IncidentType.Infrastructure]: Shield,
  [IncidentType.Network]: Wifi,
  [IncidentType.Configuration]: Server
};

const statusColors = {
  [IncidentStatus.Open]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [IncidentStatus.InProgress]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [IncidentStatus.Acknowledged]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [IncidentStatus.Resolved]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [IncidentStatus.Closed]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  incidents: propIncidents,
  onIncidentClick,
  maxHeight = '600px',
  showFilters = true,
  className
}) => {
  const { filteredIncidents } = useIncidentStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const incidents = propIncidents || filteredIncidents;

  const getFilteredIncidents = () => {
    switch (activeFilter) {
      case 'critical':
        return incidents.filter(i => i.severity === IncidentSeverity.Critical);
      case 'resolved':
        return incidents.filter(i => i.status === IncidentStatus.Resolved || i.status === IncidentStatus.Closed);
      case 'pending':
        return incidents.filter(i => i.status !== IncidentStatus.Resolved && i.status !== IncidentStatus.Closed);
      default:
        return incidents;
    }
  };

  const displayIncidents = getFilteredIncidents();

  const filterButtons = [
    { id: 'all' as FilterType, label: 'All', count: incidents.length },
    { id: 'critical' as FilterType, label: 'Critical', count: incidents.filter(i => i.severity === IncidentSeverity.Critical).length },
    { id: 'resolved' as FilterType, label: 'Resolved', count: incidents.filter(i => i.status === IncidentStatus.Resolved || i.status === IncidentStatus.Closed).length },
    { id: 'pending' as FilterType, label: 'Pending', count: incidents.filter(i => i.status !== IncidentStatus.Resolved && i.status !== IncidentStatus.Closed).length }
  ];

  return (
    <div className={cn('flex flex-col', className)}>
      {showFilters && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Incident Timeline
            </h3>
            <Filter className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex gap-2 mb-4">
            {filterButtons.map(button => (
              <Button
                key={button.id}
                size="sm"
                variant={activeFilter === button.id ? 'default' : 'outline'}
                onClick={() => setActiveFilter(button.id)}
                className="h-7 text-xs"
              >
                {button.label}
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 px-1 min-w-[20px] text-xs"
                >
                  {button.count}
                </Badge>
              </Button>
            ))}
          </div>
        </>
      )}

      <ScrollArea className="flex-1" style={{ maxHeight }}>
        <div className="space-y-4 pr-4">
          {displayIncidents.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No incidents found</p>
            </div>
          ) : (
            displayIncidents.map((incident, index) => {
              const SeverityIcon = severityIcons[incident.severity];
              const TypeIcon = typeIcons[incident.type];
              const isResolved = incident.status === IncidentStatus.Resolved || incident.status === IncidentStatus.Closed;

              return (
                <div key={incident.id} className="relative">
                  {/* Timeline connector */}
                  {index < displayIncidents.length - 1 && (
                    <div
                      className="absolute left-4 top-8 w-0.5 h-full bg-border"
                      style={{ height: 'calc(100% + 16px)' }}
                    />
                  )}

                  <div
                    className={cn(
                      'flex gap-3 group cursor-pointer rounded-lg p-3 transition-colors',
                      'hover:bg-accent/50',
                      isResolved && 'opacity-60'
                    )}
                    onClick={() => onIncidentClick?.(incident)}
                  >
                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        'bg-background border-2 border-border',
                        !isResolved && 'border-primary'
                      )}>
                        <SeverityIcon className={cn('w-4 h-4', severityColors[incident.severity])} />
                      </div>
                      {!isResolved && (
                        <div className="absolute -inset-1 rounded-full bg-primary/20 animate-pulse" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {incident.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={cn('text-xs flex-shrink-0', statusColors[incident.status])}
                        >
                          {incident.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {incident.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDistanceToNow(incident.createdAt, { addSuffix: true })}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <TypeIcon className="w-3 h-3" />
                          <span className="capitalize">{incident.type}</span>
                        </div>

                        {incident.affectedPortals.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            <span>{incident.affectedPortals.length} portal{incident.affectedPortals.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      {incident.resolvedAt && (
                        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                          Resolved {formatDistanceToNow(incident.resolvedAt, { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>

                  {index < displayIncidents.length - 1 && <Separator className="ml-12 mt-2 mb-2" />}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default IncidentTimeline;