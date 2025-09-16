/**
 * PortalListItem component - List view item with compact horizontal layout
 * @module components/portals/PortalListItem
 */

import React from 'react';
import { Portal, PortalStatus } from '@/types/portal.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Star,
  ExternalLink,
  LogIn,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wrench,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Shield,
  Copy,
  Cpu,
  MemoryStick,
  Clock,
  TrendingUp
} from 'lucide-react';

interface PortalListItemProps {
  portal: Portal;
  onClick?: (portal: Portal) => void;
  onFavoriteToggle?: (portalId: number) => void;
  onQuickLogin?: (portal: Portal) => void;
  onOpenInNewWindow?: (portal: Portal) => void;
  onShowDetails?: (portal: Portal) => void;
  onEdit?: (portal: Portal) => void;
  onDelete?: (portal: Portal) => void;
}

// Status icon component
const StatusIcon: React.FC<{ status: PortalStatus; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  switch (status) {
    case PortalStatus.Operational:
      return <CheckCircle className={cn(sizeClass, 'text-green-500')} />;
    case PortalStatus.Degraded:
      return <AlertCircle className={cn(sizeClass, 'text-yellow-500')} />;
    case PortalStatus.Maintenance:
      return <Wrench className={cn(sizeClass, 'text-blue-500')} />;
    case PortalStatus.Outage:
      return <XCircle className={cn(sizeClass, 'text-red-500')} />;
    default:
      return null;
  }
};

// Status badge variant
const getStatusVariant = (status: PortalStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case PortalStatus.Operational:
      return "default";
    case PortalStatus.Degraded:
      return "secondary";
    case PortalStatus.Maintenance:
      return "outline";
    case PortalStatus.Outage:
      return "destructive";
    default:
      return "default";
  }
};

// Metric value color
const getMetricColor = (value: number, threshold: number, inverse: boolean = false) => {
  if (inverse) {
    return value > threshold ? 'text-yellow-500' : 'text-green-500';
  }
  return value < threshold ? 'text-yellow-500' : 'text-green-500';
};

export const PortalListItem: React.FC<PortalListItemProps> = ({
  portal,
  onClick,
  onFavoriteToggle,
  onQuickLogin,
  onOpenInNewWindow,
  onShowDetails,
  onEdit,
  onDelete
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(portal.id);
  };

  const handleCardClick = () => {
    onClick?.(portal);
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 cursor-pointer',
        'hover:shadow-md hover:border-primary/30',
        'bg-card/50 backdrop-blur-sm'
      )}
      onClick={handleCardClick}
      data-testid="portal-list-item"
    >
      <div className="p-4">
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{portal.name}</h3>
                <p className="text-xs text-muted-foreground">{portal.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn('w-8 h-8', portal.isFavorite && 'text-yellow-500')}
                onClick={handleFavoriteClick}
              >
                <Star className={cn('w-4 h-4', portal.isFavorite && 'fill-current')} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onShowDetails?.(portal)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(portal)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Portal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(portal.url)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart Service
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete?.(portal)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Portal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Badge variant={getStatusVariant(portal.status)} className="text-xs w-fit">
            <StatusIcon status={portal.status} />
            <span className="ml-1 capitalize">{portal.status}</span>
          </Badge>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className={getMetricColor(portal.metrics.responseTime, 500, true)}>
                {portal.metrics.responseTime}ms
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className={getMetricColor(portal.metrics.uptime, 99)}>
                {portal.metrics.uptime.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onQuickLogin?.(portal);
              }}
              disabled={portal.status === PortalStatus.Outage || portal.status === PortalStatus.Maintenance}
            >
              <LogIn className="w-4 h-4 mr-1" />
              Login
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInNewWindow?.(portal);
              }}
              disabled={portal.status === PortalStatus.Outage || portal.status === PortalStatus.Maintenance}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
          {/* Portal Info - Col 1-4 */}
          <div className="col-span-4 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={cn('w-8 h-8', portal.isFavorite && 'text-yellow-500')}
              onClick={handleFavoriteClick}
            >
              <Star className={cn('w-4 h-4', portal.isFavorite && 'fill-current')} />
            </Button>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{portal.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{portal.description}</p>
            </div>
          </div>

          {/* Status - Col 5-6 */}
          <div className="col-span-2">
            <Badge variant={getStatusVariant(portal.status)} className="text-xs">
              <StatusIcon status={portal.status} />
              <span className="ml-1 capitalize">{portal.status}</span>
            </Badge>
          </div>

          {/* Response Time - Col 7 */}
          <div className="col-span-1">
            <span className={cn('text-sm font-medium', getMetricColor(portal.metrics.responseTime, 500, true))}>
              {portal.metrics.responseTime}ms
            </span>
          </div>

          {/* Uptime - Col 8 */}
          <div className="col-span-1">
            <span className={cn('text-sm font-medium', getMetricColor(portal.metrics.uptime, 99))}>
              {portal.metrics.uptime.toFixed(2)}%
            </span>
          </div>

          {/* CPU - Col 9 */}
          <div className="col-span-1">
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-muted-foreground" />
              <Progress value={portal.metrics.cpu} className="h-1.5 w-12" />
              <span className="text-xs text-muted-foreground">{portal.metrics.cpu}%</span>
            </div>
          </div>

          {/* Memory - Col 10 */}
          <div className="col-span-1">
            <div className="flex items-center gap-1">
              <MemoryStick className="w-3 h-3 text-muted-foreground" />
              <Progress value={portal.metrics.memory} className="h-1.5 w-12" />
              <span className="text-xs text-muted-foreground">{portal.metrics.memory}%</span>
            </div>
          </div>

          {/* Actions - Col 11-12 */}
          <div className="col-span-2 flex items-center justify-end gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onQuickLogin?.(portal);
              }}
              disabled={portal.status === PortalStatus.Outage || portal.status === PortalStatus.Maintenance}
            >
              <LogIn className="w-4 h-4 mr-1" />
              Login
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInNewWindow?.(portal);
              }}
              disabled={portal.status === PortalStatus.Outage || portal.status === PortalStatus.Maintenance}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onShowDetails?.(portal)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(portal)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Portal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(portal.url)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart Service
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete?.(portal)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Portal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
};