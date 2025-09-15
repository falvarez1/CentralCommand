import React from 'react'
import { Portal, PortalStatus } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, ExternalLink, MoreVertical, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PortalCardProps {
  portal: Portal
  onClick?: () => void
  onFavoriteClick?: (id: string) => void
  onOpenPortal?: () => void
  className?: string
}

export const PortalCard: React.FC<PortalCardProps> = ({
  portal,
  onClick,
  onFavoriteClick,
  onOpenPortal,
  className = ''
}) => {
  const getStatusColor = (status: PortalStatus) => {
    switch (status) {
      case PortalStatus.OPERATIONAL: return 'bg-green-500'
      case PortalStatus.DEGRADED: return 'bg-yellow-500'
      case PortalStatus.MAINTENANCE: return 'bg-orange-500'
      case PortalStatus.OUTAGE: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: PortalStatus) => {
    switch (status) {
      case PortalStatus.OPERATIONAL: return <CheckCircle className="h-4 w-4 text-green-500" />
      case PortalStatus.DEGRADED: return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case PortalStatus.MAINTENANCE: return <Clock className="h-4 w-4 text-orange-500" />
      case PortalStatus.OUTAGE: return <XCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavoriteClick?.(portal.id)
  }

  const handleOpenPortal = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(portal.url, '_blank')
    onOpenPortal?.()
  }

  return (
    <Card
      className={`group hover:shadow-lg transition-all duration-300 cursor-pointer ${className}`}
      onClick={onClick}
      data-testid="portal-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(portal.status)} animate-pulse`} />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{portal.name}</CardTitle>
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {portal.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleFavoriteClick}
            >
              <Heart className={`h-4 w-4 ${portal.isFavorite ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenPortal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Portal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClick}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleFavoriteClick}>
                  <Heart className="h-4 w-4 mr-2" />
                  {portal.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {getStatusIcon(portal.status)}
          <Badge variant={portal.status === PortalStatus.OPERATIONAL ? 'default' : 'secondary'}>
            {portal.status}
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Response</span>
            <p className="font-mono font-medium">{portal.metrics?.responseTime || 0}ms</p>
          </div>
          <div>
            <span className="text-muted-foreground">Uptime</span>
            <p className="font-mono font-medium">{portal.metrics?.uptime?.toFixed(2) || 0}%</p>
          </div>
          <div>
            <span className="text-muted-foreground">CPU</span>
            <p className="font-mono font-medium">{portal.metrics?.cpu?.toFixed(1) || 0}%</p>
          </div>
          <div>
            <span className="text-muted-foreground">Memory</span>
            <p className="font-mono font-medium">{portal.metrics?.memory?.toFixed(1) || 0}%</p>
          </div>
        </div>

        {/* Tags */}
        {portal.tags && portal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {portal.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {portal.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{portal.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}