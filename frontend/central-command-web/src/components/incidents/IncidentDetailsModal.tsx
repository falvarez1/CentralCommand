import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Server,
  MessageSquare,
  Activity,
  TrendingUp,
  FileText,
  Zap,
  Shield,
  Database,
  Wifi,
  Lock,
  ChevronRight,
  Edit
} from 'lucide-react';
import { Incident, IncidentSeverity, IncidentStatus, IncidentType } from '../../types/incident.types';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface IncidentDetailsModalProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onUpdateIncident?: (incident: Incident) => void;
  onAcknowledgeIncident?: (incidentId: string) => void;
  onResolveIncident?: (incidentId: string, resolution: string, rootCause?: string) => void;
  onEscalateIncident?: (incidentId: string) => void;
  onReopenIncident?: (incidentId: string) => void;
  onAddTimelineEntry?: (incidentId: string, action: string, description: string) => void;
  relatedIncidents?: Incident[];
  affectedPortalDetails?: Array<{ id: string; name: string; url: string; status: string; }>;
}

const severityConfig = {
  [IncidentSeverity.Critical]: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    badge: 'destructive' as const
  },
  [IncidentSeverity.High]: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badge: 'destructive' as const
  },
  [IncidentSeverity.Medium]: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    badge: 'secondary' as const
  },
  [IncidentSeverity.Low]: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badge: 'default' as const
  }
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

const statusConfig = {
  [IncidentStatus.Open]: { label: 'Open', color: 'text-red-600 dark:text-red-400' },
  [IncidentStatus.InProgress]: { label: 'In Progress', color: 'text-yellow-600 dark:text-yellow-400' },
  [IncidentStatus.Resolved]: { label: 'Resolved', color: 'text-green-600 dark:text-green-400' },
  [IncidentStatus.Closed]: { label: 'Closed', color: 'text-gray-600 dark:text-gray-400' },
  [IncidentStatus.Acknowledged]: { label: 'Acknowledged', color: 'text-blue-600 dark:text-blue-400' }
};

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
  incident,
  isOpen,
  onClose,
  onUpdateIncident,
  onAcknowledgeIncident,
  onResolveIncident,
  onEscalateIncident,
  onReopenIncident,
  onAddTimelineEntry,
  relatedIncidents = [],
  affectedPortalDetails = []
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [comment, setComment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rootCauseNotes, setRootCauseNotes] = useState('');
  const [isEditingResolution, setIsEditingResolution] = useState(false);

  if (!incident || !isOpen) {
    return null;
  }

  const config = severityConfig[incident.severity];
  const SeverityIcon = config.icon;
  const TypeIcon = typeIcons[incident.type];
  const statusInfo = statusConfig[incident.status];

  const handleAddComment = () => {
    if (comment.trim() && onAddTimelineEntry) {
      onAddTimelineEntry(incident.id, 'Comment added', comment);
      setComment('');
      toast.success('Comment added to timeline');
    }
  };

  const handleResolve = () => {
    if (resolutionNotes.trim() && onResolveIncident) {
      onResolveIncident(incident.id, resolutionNotes, rootCauseNotes || undefined);
      setIsEditingResolution(false);
      setResolutionNotes('');
      setRootCauseNotes('');
      toast.success('Incident resolved', {
        description: incident.title
      });
    } else {
      toast.error('Please provide resolution notes');
    }
  };

  const handleAcknowledge = () => {
    if (onAcknowledgeIncident) {
      onAcknowledgeIncident(incident.id);
      toast.success('Incident acknowledged');
    }
  };

  const handleEscalate = () => {
    if (onEscalateIncident) {
      onEscalateIncident(incident.id);
      toast.warning('Incident escalated', {
        description: `Severity increased for: ${incident.title}`
      });
    }
  };

  const handleReopen = () => {
    if (onReopenIncident) {
      onReopenIncident(incident.id);
      toast.info('Incident reopened', {
        description: incident.title
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <SeverityIcon className={cn('w-6 h-6 mt-1', config.color)} />
              <div>
                <DialogTitle className="text-xl mb-2">{incident.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-4">
                  <Badge variant={config.badge}>{incident.severity}</Badge>
                  <span className={cn('font-medium', statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                  <span className="text-muted-foreground">
                    ID: {incident.id.slice(0, 8)}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="affected">Affected Systems</TabsTrigger>
            <TabsTrigger value="related">Related</TabsTrigger>
            <TabsTrigger value="resolution">Resolution</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4" style={{ height: 'calc(85vh - 200px)' }}>
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Incident Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {incident.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{incident.type}</span>
                      </div>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(incident.createdAt, 'PPP p')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Impacted Users</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {incident.impactedUsers?.toLocaleString() || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <Label>Team Assignment</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {incident.team || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  {incident.tags.length > 0 && (
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {incident.tags.map(tag => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {incident.metrics && (
                    <div>
                      <Label>Metrics</Label>
                      <div className="grid grid-cols-3 gap-4 mt-2">
                        {incident.metrics.mttr && (
                          <div className="text-center p-3 bg-accent rounded-lg">
                            <p className="text-2xl font-bold">{incident.metrics.mttr}m</p>
                            <p className="text-xs text-muted-foreground">MTTR</p>
                          </div>
                        )}
                        {incident.metrics.impactDuration && (
                          <div className="text-center p-3 bg-accent rounded-lg">
                            <p className="text-2xl font-bold">{incident.metrics.impactDuration}m</p>
                            <p className="text-xs text-muted-foreground">Impact Duration</p>
                          </div>
                        )}
                        <div className="text-center p-3 bg-accent rounded-lg">
                          <p className="text-2xl font-bold">{incident.metrics.severityChanges}</p>
                          <p className="text-xs text-muted-foreground">Severity Changes</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex gap-2">
                {incident.status === IncidentStatus.Open && (
                  <Button onClick={handleAcknowledge} variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Acknowledge
                  </Button>
                )}
                {incident.status !== IncidentStatus.Resolved && incident.status !== IncidentStatus.Closed && (
                  <>
                    <Button onClick={() => setIsEditingResolution(true)} variant="outline">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                    {incident.severity !== IncidentSeverity.Critical && (
                      <Button onClick={handleEscalate} variant="outline">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Escalate
                      </Button>
                    )}
                  </>
                )}
                {(incident.status === IncidentStatus.Resolved || incident.status === IncidentStatus.Closed) && (
                  <Button onClick={handleReopen} variant="outline">
                    <Activity className="w-4 h-4 mr-2" />
                    Reopen
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incident.timeline.map((entry, index) => (
                      <div key={entry.id} className="flex gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          </div>
                          {index < incident.timeline.length - 1 && (
                            <div className="absolute left-4 top-8 w-0.5 h-full bg-border" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{entry.eventType}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {entry.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <Label>Add Comment</Label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment to the timeline..."
                      rows={3}
                    />
                    <Button onClick={handleAddComment} size="sm">
                      Add Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Affected Systems Tab */}
            <TabsContent value="affected" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Affected Portals</CardTitle>
                </CardHeader>
                <CardContent>
                  {affectedPortalDetails.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No portals affected</p>
                  ) : (
                    <div className="space-y-2">
                      {affectedPortalDetails.map(portal => (
                        <div key={portal.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div>
                            <p className="font-medium">{portal.name}</p>
                            <p className="text-sm text-muted-foreground">{portal.url}</p>
                          </div>
                          <Badge variant={portal.status === 'Operational' ? 'default' : 'destructive'}>
                            {portal.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Affected Services</CardTitle>
                </CardHeader>
                <CardContent>
                  {incident.affectedServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No services specified</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {incident.affectedServices.map(service => (
                        <Badge key={service} variant="outline">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Related Tab */}
            <TabsContent value="related" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Related Incidents</CardTitle>
                </CardHeader>
                <CardContent>
                  {relatedIncidents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No related incidents</p>
                  ) : (
                    <div className="space-y-2">
                      {relatedIncidents.map(related => (
                        <div key={related.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={severityConfig[related.severity].color}>
                              {React.createElement(severityConfig[related.severity].icon, {
                                className: 'w-4 h-4'
                              })}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{related.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(related.createdAt, { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{related.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {incident.postmortemUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle>Post-Mortem</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={incident.postmortemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      View Post-Mortem Document
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Resolution Tab */}
            <TabsContent value="resolution" className="space-y-4">
              {incident.status === IncidentStatus.Resolved || incident.status === IncidentStatus.Closed ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Resolution Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Resolution</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {incident.resolution || 'No resolution notes provided'}
                        </p>
                      </div>
                      <div>
                        <Label>Root Cause</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {incident.rootCause || 'Root cause not identified'}
                        </p>
                      </div>
                      <div>
                        <Label>Resolved At</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {incident.resolvedAt ? format(incident.resolvedAt, 'PPP p') : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : isEditingResolution ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Resolve Incident</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Resolution Notes *</Label>
                      <Textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Describe how the incident was resolved..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Root Cause Analysis</Label>
                      <Textarea
                        value={rootCauseNotes}
                        onChange={(e) => setRootCauseNotes(e.target.value)}
                        placeholder="Describe the root cause of the incident..."
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleResolve}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve Incident
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingResolution(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      This incident has not been resolved yet
                    </p>
                    <Button onClick={() => setIsEditingResolution(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Add Resolution
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentDetailsModal;