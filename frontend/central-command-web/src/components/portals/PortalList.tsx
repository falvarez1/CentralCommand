import React from 'react'
import { Portal, PortalStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ExternalLink, MoreVertical, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PortalListProps {
  portals: Portal[]
  onPortalClick?: (portal: Portal) => void
  onFavoriteClick?: (id: number) => void
  className?: string
}

export const PortalList: React.FC<PortalListProps> = ({
  portals,
  onPortalClick,
  onFavoriteClick,
  className = ''
}) => {
  const getStatusColor = (status: PortalStatus) => {
    switch (status) {
      case PortalStatus.Operational: return 'bg-green-500'
      case PortalStatus.Degraded: return 'bg-yellow-500'
      case PortalStatus.Maintenance: return 'bg-orange-500'
      case PortalStatus.Outage: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: PortalStatus) => {
    switch (status) {
      case PortalStatus.Operational: return <CheckCircle className="h-4 w-4 text-green-500" />
      case PortalStatus.Degraded: return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case PortalStatus.Maintenance: return <Clock className="h-4 w-4 text-orange-500" />
      case PortalStatus.Outage: return <XCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {portals.map(portal => (
        <div
          key={portal.id}
          className="group flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => onPortalClick?.(portal)}
        >
          {/* Left Section - Status, Name, Description */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(portal.status)} animate-pulse`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{portal.name}</h3>
                {portal.isFavorite && (
                  <Heart className="h-3 w-3 fill-current text-red-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{portal.description}</p>
            </div>
          </div>

          {/* Middle Section - Metrics */}
          <div className="hidden md:flex items-center gap-6 px-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Response: </span>
              <span className="font-mono font-medium">{portal.responseTime}ms</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Uptime: </span>
              <span className="font-mono font-medium">{portal.uptime}%</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">CPU: </span>
              <span className="font-mono font-medium">{portal.cpu}%</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Memory: </span>
              <span className="font-mono font-medium">{portal.memory}%</span>
            </div>
          </div>

          {/* Right Section - Status Badge and Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(portal.status)}
              <Badge variant={portal.status === PortalStatus.Operational ? 'default' : 'secondary'}>
                {portal.status}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onFavoriteClick?.(portal.id)
              }}
            >
              <Heart className={`h-4 w-4 ${portal.isFavorite ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                window.open(portal.url, '_blank')
              }}
            >
              <ExternalLink className="h-4 w-4" />
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
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  window.open(portal.url, '_blank')
                }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Portal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onPortalClick?.(portal)
                }}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onFavoriteClick?.(portal.id)
                }}>
                  <Heart className="h-4 w-4 mr-2" />
                  {portal.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  )
}