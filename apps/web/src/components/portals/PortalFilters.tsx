/**
 * PortalFilters component - Filter tabs with category counts and status indicators
 * @module components/portals/PortalFilters
 */

import React, { useRef, useEffect, useState } from 'react';
import { Portal, PortalCategory, PortalStatus } from '@/types/portal.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code,
  FileText,
  Gauge,
  Globe,
  HelpCircle,
  Layers,
  Lock,
  Megaphone,
  Settings,
  Shield,
  Users,
  Wrench,
  XCircle
} from 'lucide-react';

interface PortalFiltersProps {
  portals: Portal[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

interface CategoryData {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
  operational: number;
  degraded: number;
  maintenance: number;
  outage: number;
}

// Category icon mapping
const getCategoryIcon = (category: string): React.ElementType => {
  const iconMap: Record<string, React.ElementType> = {
    'all': Layers,
    'Business': Building2,
    'Human Resources': Users,
    'Support': HelpCircle,
    'Engineering': Code,
    'Operations': Settings,
    'Marketing': Megaphone,
    'Security': Shield,
    'Resources': FileText,
  };
  return iconMap[category] || Globe;
};

// Status indicator component
const StatusIndicator: React.FC<{
  operational: number;
  degraded: number;
  maintenance: number;
  outage: number;
}> = ({ operational, degraded, maintenance, outage }) => {
  const total = operational + degraded + maintenance + outage;

  if (total === 0) return null;

  const getPercentage = (value: number) => (value / total) * 100;

  return (
    <div className="flex gap-0.5 h-1 w-full max-w-[60px] rounded-full overflow-hidden bg-muted">
      {operational > 0 && (
        <div
          className="bg-green-500 h-full"
          style={{ width: `${getPercentage(operational)}%` }}
        />
      )}
      {degraded > 0 && (
        <div
          className="bg-yellow-500 h-full"
          style={{ width: `${getPercentage(degraded)}%` }}
        />
      )}
      {maintenance > 0 && (
        <div
          className="bg-blue-500 h-full"
          style={{ width: `${getPercentage(maintenance)}%` }}
        />
      )}
      {outage > 0 && (
        <div
          className="bg-red-500 h-full"
          style={{ width: `${getPercentage(outage)}%` }}
        />
      )}
    </div>
  );
};

// Category tab component
const CategoryTab: React.FC<{
  category: CategoryData;
  isSelected: boolean;
  onClick: () => void;
}> = ({ category, isSelected, onClick }) => {
  const Icon = category.icon;
  const hasIssues = category.degraded > 0 || category.maintenance > 0 || category.outage > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'whitespace-nowrap min-w-fit',
        isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
        !isSelected && 'text-muted-foreground'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{category.label}</span>
      <Badge
        variant={isSelected ? 'secondary' : 'outline'}
        className={cn(
          'ml-1 text-xs',
          isSelected && 'bg-primary-foreground/20 text-primary-foreground border-0'
        )}
      >
        {category.count}
      </Badge>

      {/* Issue indicator dot */}
      {hasIssues && !isSelected && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        </div>
      )}

      {/* Status bar */}
      {category.count > 0 && (
        <div className="absolute bottom-0 left-4 right-4">
          <StatusIndicator
            operational={category.operational}
            degraded={category.degraded}
            maintenance={category.maintenance}
            outage={category.outage}
          />
        </div>
      )}
    </button>
  );
};

// Quick stats component
const QuickStats: React.FC<{ portals: Portal[] }> = ({ portals }) => {
  const stats = {
    operational: portals.filter(p => p.status === PortalStatus.OPERATIONAL).length,
    degraded: portals.filter(p => p.status === PortalStatus.DEGRADED).length,
    maintenance: portals.filter(p => p.status === PortalStatus.MAINTENANCE).length,
    outage: portals.filter(p => p.status === PortalStatus.OUTAGE).length,
  };

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3 text-green-500" />
        <span className="text-muted-foreground">{stats.operational}</span>
      </div>
      <div className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3 text-yellow-500" />
        <span className="text-muted-foreground">{stats.degraded}</span>
      </div>
      <div className="flex items-center gap-1">
        <Wrench className="w-3 h-3 text-blue-500" />
        <span className="text-muted-foreground">{stats.maintenance}</span>
      </div>
      <div className="flex items-center gap-1">
        <XCircle className="w-3 h-3 text-red-500" />
        <span className="text-muted-foreground">{stats.outage}</span>
      </div>
    </div>
  );
};

export const PortalFilters: React.FC<PortalFiltersProps> = ({
  portals,
  selectedCategory,
  onCategoryChange,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  // Calculate category data
  const categories: CategoryData[] = [
    {
      id: 'all',
      label: 'All Portals',
      icon: Layers,
      count: portals.length,
      operational: portals.filter(p => p.status === PortalStatus.OPERATIONAL).length,
      degraded: portals.filter(p => p.status === PortalStatus.DEGRADED).length,
      maintenance: portals.filter(p => p.status === PortalStatus.MAINTENANCE).length,
      outage: portals.filter(p => p.status === PortalStatus.OUTAGE).length,
    }
  ];

  // Get unique categories from portals
  const uniqueCategories = [...new Set(portals.map(p => p.category))].filter(c => c !== PortalCategory.ALL);

  uniqueCategories.forEach(category => {
    const categoryPortals = portals.filter(p => p.category === category);
    categories.push({
      id: category,
      label: category,
      icon: getCategoryIcon(category),
      count: categoryPortals.length,
      operational: categoryPortals.filter(p => p.status === PortalStatus.OPERATIONAL).length,
      degraded: categoryPortals.filter(p => p.status === PortalStatus.DEGRADED).length,
      maintenance: categoryPortals.filter(p => p.status === PortalStatus.MAINTENANCE).length,
      outage: categoryPortals.filter(p => p.status === PortalStatus.OUTAGE).length,
    });
  });

  // Check scroll position
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      return () => {
        scrollElement.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [portals]);

  const scrollTo = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      const currentScroll = scrollRef.current.scrollLeft;
      const newScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with quick stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Filter by Category</h3>
        <QuickStats portals={portals} />
      </div>

      {/* Filter tabs with scroll */}
      <div className="relative group">
        {/* Left scroll button */}
        <div className={cn(
          'absolute left-0 top-0 bottom-0 z-10 flex items-center',
          'bg-gradient-to-r from-background via-background to-transparent',
          'pr-4 transition-opacity duration-200',
          showLeftButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scrollTo('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Right scroll button */}
        <div className={cn(
          'absolute right-0 top-0 bottom-0 z-10 flex items-center',
          'bg-gradient-to-l from-background via-background to-transparent',
          'pl-4 transition-opacity duration-200',
          showRightButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scrollTo('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable tabs container */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-3"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' }
          }}
        >
          {categories.map((category) => (
            <CategoryTab
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => onCategoryChange(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Active filters indicator */}
      {selectedCategory !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filter:</span>
          <Badge variant="secondary" className="gap-1">
            {getCategoryIcon(selectedCategory)({ className: 'w-3 h-3' })}
            {selectedCategory}
            <button
              onClick={() => onCategoryChange('all')}
              className="ml-1 hover:text-destructive"
            >
              <XCircle className="w-3 h-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
};