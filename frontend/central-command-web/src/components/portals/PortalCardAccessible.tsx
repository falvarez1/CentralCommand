/**
 * Accessible Portal Card Component
 * Includes proper ARIA labels, keyboard navigation, and screen reader support
 */

import React, { KeyboardEvent, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Portal, PortalStatus } from '@/types/portal.types';
import {
  Heart,
  ExternalLink,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalCardAccessibleProps {
  portal: Portal;
  onPortalClick?: (portal: Portal) => void;
  onFavoriteClick?: (id: string) => void;
  onOpenExternal?: (url: string) => void;
  className?: string;
}

const statusConfig = {
  [PortalStatus.Operational]: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Operational',
    ariaLabel: 'Portal is operational'
  },
  [PortalStatus.Degraded]: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'Degraded',
    ariaLabel: 'Portal is experiencing degraded performance'
  },
  [PortalStatus.Outage]: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Outage',
    ariaLabel: 'Portal is experiencing an outage'
  },
  [PortalStatus.Maintenance]: {
    icon: Wrench,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Maintenance',
    ariaLabel: 'Portal is under maintenance'
  }
};

export const PortalCardAccessible: React.FC<PortalCardAccessibleProps> = ({
  portal,
  onPortalClick,
  onFavoriteClick,
  onOpenExternal,
  className
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const status = statusConfig[portal.status];
  const StatusIcon = status.icon;

  // Calculate health score for progress bar
  const healthScore = Math.round(
    (portal.metrics.uptime * 0.4) +
    ((100 - portal.metrics.errorRate) * 0.3) +
    ((200 - Math.min(portal.metrics.responseTime, 200)) / 2 * 0.3)
  );

  // Keyboard navigation handler
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPortalClick?.(portal);
    }
  };

  // Favorite keyboard handler
  const handleFavoriteKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      onFavoriteClick?.(portal.id);
    }
  };

  // External link keyboard handler
  const handleExternalKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      onOpenExternal?.(portal.url);
    }
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        className
      )}
      onClick={() => onPortalClick?.(portal)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`Portal: ${portal.name}. Status: ${status.ariaLabel}. Health score: ${healthScore}%`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {portal.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {portal.description || 'No description available'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 transition-colors',
                portal.isFavorite && 'text-red-500'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteClick?.(portal.id);
              }}
              onKeyDown={handleFavoriteKeyDown}
              aria-label={portal.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={portal.isFavorite}
            >
              <Heart
                className={cn('h-4 w-4', portal.isFavorite && 'fill-current')}
              />
            </Button>

            {/* External Link Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onOpenExternal?.(portal.url);
              }}
              onKeyDown={handleExternalKeyDown}
              aria-label={`Open ${portal.name} in new window`}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-3">
          <Badge
            variant="outline"
            className={cn('gap-1.5', status.bgColor, status.color)}
            aria-label={status.ariaLabel}
          >
            <StatusIcon className="h-3 w-3" aria-hidden="true" />
            <span>{status.label}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Metrics */}
        <div className="space-y-3">
          {/* Response Time */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Response</span>
            </div>
            <span
              className="font-medium"
              aria-label={`Response time: ${portal.metrics.responseTime} milliseconds`}
            >
              {portal.metrics.responseTime}ms
            </span>
          </div>

          {/* Uptime */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Uptime</span>
            </div>
            <span
              className="font-medium"
              aria-label={`Uptime: ${portal.metrics.uptime.toFixed(2)} percent`}
            >
              {portal.metrics.uptime.toFixed(2)}%
            </span>
          </div>

          {/* Health Score Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Health Score</span>
              <span
                className="font-medium"
                aria-label={`Health score: ${healthScore} out of 100`}
              >
                {healthScore}/100
              </span>
            </div>
            <Progress
              value={healthScore}
              className="h-2"
              aria-label={`Health score progress: ${healthScore}%`}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span aria-label={`Environment: ${portal.environment}`}>
            {portal.environment}
          </span>
          <span aria-label={`Last checked: ${new Date(portal.lastChecked).toLocaleString()}`}>
            Last checked: {new Date(portal.lastChecked).toLocaleTimeString()}
          </span>
        </div>
      </CardFooter>

      {/* Screen reader only content */}
      <div className="sr-only">
        <p>Portal category: {portal.category}</p>
        <p>Priority: {portal.priority}</p>
        <p>Total requests: {portal.metrics.requests}</p>
        <p>Error rate: {portal.metrics.errorRate}%</p>
        {portal.tags.length > 0 && (
          <p>Tags: {portal.tags.join(', ')}</p>
        )}
      </div>
    </Card>
  );
};