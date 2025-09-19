/**
 * Sidebar navigation with quick actions, favorites, and team activity
 */

import React, { useState } from 'react';
import {
  Layout,
  FileText,
  Shield,
  Activity,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Users,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Portal, ActivityType } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  favorites: Portal[];
  isMobile: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  onClick: () => void;
}

interface TeamActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: ActivityType;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onClose,
  favorites,
  isMobile
}) => {
  const [expandedSections, setExpandedSections] = useState({
    quickActions: true,
    favorites: true,
    teamActivity: true
  });

  const quickActions: QuickAction[] = [
    {
      id: 'incidents',
      label: 'View Incidents',
      icon: AlertTriangle,
      onClick: () => console.log('View Incidents')
    },
    {
      id: 'deploy',
      label: 'Deploy All Services',
      icon: Rocket,
      onClick: () => console.log('Deploy All')
    },
    {
      id: 'health',
      label: 'Run Health Check',
      icon: Activity,
      onClick: () => console.log('Health Check')
    },
    {
      id: 'maintenance',
      label: 'Schedule Maintenance',
      icon: Calendar,
      onClick: () => console.log('Schedule Maintenance')
    },
    {
      id: 'emergency',
      label: 'Emergency Shutdown',
      icon: Shield,
      variant: 'destructive',
      onClick: () => console.log('Emergency Shutdown')
    }
  ];

  const teamActivities: TeamActivity[] = [
    {
      id: '1',
      user: 'Alice Chen',
      action: 'deployed',
      target: 'Finance Portal',
      time: '5 min ago',
      type: ActivityType.DEPLOYMENT
    },
    {
      id: '2',
      user: 'Bob Smith',
      action: 'updated',
      target: 'API Gateway config',
      time: '12 min ago',
      type: ActivityType.CONFIG_CHANGE
    },
    {
      id: '3',
      user: 'Charlie Davis',
      action: 'resolved incident',
      target: 'Database Connection',
      time: '1 hour ago',
      type: ActivityType.INCIDENT_RESOLVED
    },
    {
      id: '4',
      user: 'Diana Prince',
      action: 'created alert',
      target: 'High CPU Usage',
      time: '2 hours ago',
      type: ActivityType.ALERT_CREATED
    }
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.DEPLOYMENT:
        return <Rocket className="h-3 w-3 text-blue-500" />;
      case ActivityType.CONFIG_CHANGE:
        return <Settings className="h-3 w-3 text-yellow-500" />;
      case ActivityType.INCIDENT_RESOLVED:
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case ActivityType.ALERT_CREATED:
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'maintenance':
        return 'bg-orange-500';
      case 'outage':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!isOpen && isMobile) return null;

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-64px)] border-r bg-card/95 backdrop-blur transition-all duration-300 z-40",
        isCollapsed && !isMobile ? "w-16" : "w-64",
        !isOpen && !isMobile && "-translate-x-full"
      )}
    >
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Mobile Close Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-2 right-2 md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Quick Actions */}
          <div>
            <button
              onClick={() => toggleSection('quickActions')}
              className={cn(
                "flex items-center justify-between w-full text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3",
                isCollapsed && !isMobile && "justify-center"
              )}
            >
              {!isCollapsed || isMobile ? (
                <>
                  <span>Quick Actions</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.quickActions && "rotate-90"
                    )}
                  />
                </>
              ) : (
                <Rocket className="h-4 w-4" />
              )}
            </button>

            {expandedSections.quickActions && (!isCollapsed || isMobile) && (
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    className={cn(
                      "w-full justify-start gap-2",
                      action.variant === 'destructive' && "hover:bg-destructive/90"
                    )}
                    onClick={action.onClick}
                  >
                    <action.icon className="h-4 w-4" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Favorites */}
          <div>
            <button
              onClick={() => toggleSection('favorites')}
              className={cn(
                "flex items-center justify-between w-full text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3",
                isCollapsed && !isMobile && "justify-center"
              )}
            >
              {!isCollapsed || isMobile ? (
                <>
                  <span>Favorites</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.favorites && "rotate-90"
                    )}
                  />
                </>
              ) : (
                <Star className="h-4 w-4" />
              )}
            </button>

            {expandedSections.favorites && (!isCollapsed || isMobile) && (
              <div className="space-y-2">
                {favorites.length > 0 ? (
                  favorites.map((portal) => (
                    <button
                      key={portal.id}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors group"
                      onClick={() => window.open(portal.url, '_blank')}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(portal.status))} />
                        <span className="text-sm truncate">{portal.name}</span>
                      </div>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No favorites yet. Star portals to add them here.
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Team Activity */}
          <div>
            <button
              onClick={() => toggleSection('teamActivity')}
              className={cn(
                "flex items-center justify-between w-full text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3",
                isCollapsed && !isMobile && "justify-center"
              )}
            >
              {!isCollapsed || isMobile ? (
                <>
                  <span>Team Activity</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedSections.teamActivity && "rotate-90"
                    )}
                  />
                </>
              ) : (
                <Users className="h-4 w-4" />
              )}
            </button>

            {expandedSections.teamActivity && (!isCollapsed || isMobile) && (
              <div className="space-y-3">
                {teamActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 text-xs">
                    <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 space-y-0.5">
                      <div className="text-foreground">
                        <span className="font-medium">{activity.user}</span>
                        {' '}
                        <span className="text-muted-foreground">{activity.action}</span>
                        {' '}
                        <span className="font-medium">{activity.target}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {(!isCollapsed || isMobile) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">System Uptime</span>
                  <span className="font-mono text-green-500">99.98%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active Portals</span>
                  <span className="font-mono">42/45</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Avg Response</span>
                  <span className="font-mono">142ms</span>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};