import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Clock, Users, ChevronRight, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Incident, IncidentSeverity, IncidentStatus } from '../../types/incident.types';
import { cn } from '../../lib/utils';
import { useIncidentStore } from '../../stores/useIncidentStore';
import { toast } from 'sonner';

interface IncidentCardProps {
  incident: Incident;
  onViewDetails?: (incident: Incident) => void;
  onInvestigate?: (incident: Incident) => void;
  onResolve?: (incident: Incident) => void;
  onEscalate?: (incident: Incident) => void;
  className?: string;
}

const severityConfig = {
  [IncidentSeverity.Critical]: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    barColor: 'bg-red-500',
    badge: 'destructive' as const
  },
  [IncidentSeverity.High]: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
    barColor: 'bg-orange-500',
    badge: 'warning' as const
  },
  [IncidentSeverity.Medium]: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    barColor: 'bg-yellow-500',
    badge: 'warning' as const
  },
  [IncidentSeverity.Low]: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    barColor: 'bg-blue-500',
    badge: 'default' as const
  }
};

const statusConfig = {
  [IncidentStatus.Open]: { label: 'Open', color: 'text-red-600 dark:text-red-400' },
  [IncidentStatus.InProgress]: { label: 'In Progress', color: 'text-yellow-600 dark:text-yellow-400' },
  [IncidentStatus.Acknowledged]: { label: 'Acknowledged', color: 'text-blue-600 dark:text-blue-400' },
  [IncidentStatus.Resolved]: { label: 'Resolved', color: 'text-green-600 dark:text-green-400' },
  [IncidentStatus.Closed]: { label: 'Closed', color: 'text-gray-600 dark:text-gray-400' }
};

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onViewDetails,
  onInvestigate,
  onResolve,
  onEscalate,
  className
}) => {
  const { acknowledgeIncident, resolveIncident, escalateIncident } = useIncidentStore();
  const config = severityConfig[incident.severity] || severityConfig[IncidentSeverity.Low];
  const StatusIcon = config.icon;
  const statusInfo = statusConfig[incident.status] || { label: incident.status, color: 'text-gray-600 dark:text-gray-400' };

  const handleInvestigate = () => {
    if (incident.status === IncidentStatus.Open) {
      acknowledgeIncident(incident.id);
      toast.success('Incident acknowledged', {
        description: 'Investigation has begun'
      });
    }
    onInvestigate?.(incident);
  };

  const handleResolve = () => {
    if (incident.status !== IncidentStatus.Resolved) {
      // In a real app, would open a modal to get resolution details
      resolveIncident(incident.id, 'Issue has been resolved', 'Root cause identified and fixed');
      toast.success('Incident resolved', {
        description: incident.title
      });
    }
    onResolve?.(incident);
  };

  const handleEscalate = () => {
    escalateIncident(incident.id);
    toast.warning('Incident escalated', {
      description: `Severity increased for: ${incident.title}`
    });
    onEscalate?.(incident);
  };

  const timeElapsed = formatDistanceToNow(incident.createdAt, { addSuffix: true });

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200 hover:shadow-lg',
      config.borderColor,
      className
    )}>
      {/* Severity indicator bar */}
      <div className={cn('absolute top-0 left-0 w-1 h-full', config.barColor)} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <StatusIcon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.color)} />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                {incident.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {incident.description}
              </p>
            </div>
          </div>
          <Badge variant={config.badge} className="flex-shrink-0">
            {incident.severity}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeElapsed}</span>
            </div>
            {incident.impactedUsers && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{incident.impactedUsers.toLocaleString()} users</span>
              </div>
            )}
            <div className={cn('font-medium', statusInfo.color)}>
              {statusInfo.label}
            </div>
          </div>

          {/* Affected services */}
          {incident.affectedServices.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {incident.affectedServices.slice(0, 3).map((service, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
              {incident.affectedServices.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{incident.affectedServices.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Team assignment */}
          {incident.team && (
            <div className="flex items-center gap-2 text-xs">
              <Shield className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Assigned to Team {incident.team}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              {incident.status === IncidentStatus.Open && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleInvestigate}
                  className="h-7 text-xs"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Investigate
                </Button>
              )}
              {incident.status !== IncidentStatus.Resolved && incident.status !== IncidentStatus.Closed && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResolve}
                  className="h-7 text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Resolve
                </Button>
              )}
              {incident.severity !== IncidentSeverity.Critical && incident.status !== IncidentStatus.Resolved && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEscalate}
                  className="h-7 text-xs"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Escalate
                </Button>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewDetails?.(incident)}
              className="h-7 text-xs"
            >
              Details
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentCard;