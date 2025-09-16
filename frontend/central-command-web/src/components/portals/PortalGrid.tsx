import React from 'react'
import { Portal } from '@/types'
import { PortalCard } from './PortalCard'

interface PortalGridProps {
  portals: Portal[]
  onPortalClick?: (portal: Portal) => void
  onFavoriteClick?: (id: number) => void
  className?: string
}

export const PortalGrid: React.FC<PortalGridProps> = ({
  portals,
  onPortalClick,
  onFavoriteClick,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {portals.map(portal => (
        <PortalCard
          key={portal.id}
          portal={portal}
          onClick={() => onPortalClick?.(portal)}
          onFavoriteClick={onFavoriteClick}
        />
      ))}
    </div>
  )
}