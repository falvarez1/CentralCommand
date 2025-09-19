import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ExternalLink,
  MoreVertical,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../types/notification.types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '../ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface NotificationCenterProps {
  onOpenPreferences?: () => void;
}

const typeIcons = {
  [NotificationType.SUCCESS]: CheckCircle2,
  [NotificationType.ERROR]: AlertCircle,
  [NotificationType.WARNING]: AlertTriangle,
  [NotificationType.INFO]: Info
};

const typeColors = {
  [NotificationType.SUCCESS]: 'text-green-500',
  [NotificationType.ERROR]: 'text-red-500',
  [NotificationType.WARNING]: 'text-yellow-500',
  [NotificationType.INFO]: 'text-blue-500'
};

const priorityBadgeVariants = {
  [NotificationPriority.LOW]: 'secondary',
  [NotificationPriority.MEDIUM]: 'default',
  [NotificationPriority.HIGH]: 'warning',
  [NotificationPriority.URGENT]: 'destructive'
} as const;

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onOpenPreferences
}) => {
  const {
    notifications,
    unreadCount,
    hasUnread,
    isOpen,
    togglePanel,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [groupByDate, setGroupByDate] = useState(true);
  const [showActions, setShowActions] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  // Group notifications by date
  const groupedNotifications = groupByDate
    ? filteredNotifications.reduce((groups, notification) => {
        const date = new Date(notification.timestamp);
        const dateKey = date.toDateString();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        let groupKey = dateKey;
        if (dateKey === today) groupKey = 'Today';
        else if (dateKey === yesterday) groupKey = 'Yesterday';

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(notification);
        return groups;
      }, {} as Record<string, typeof notifications>)
    : { All: filteredNotifications };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) togglePanel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, togglePanel]);

  return (
    <div className="relative" ref={dropdownRef}>
      <DropdownMenu open={isOpen} onOpenChange={togglePanel}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute top-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[420px] max-h-[600px] p-0"
          sideOffset={5}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="px-2 py-0.5">
                    {unreadCount} new
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                {hasUnread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 px-2"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilter('all')}>
                      All notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('unread')}>
                      Unread only
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilter(NotificationType.SUCCESS)}>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Success
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter(NotificationType.ERROR)}>
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                      Errors
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter(NotificationType.WARNING)}>
                      <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                      Warnings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter(NotificationType.INFO)}>
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      Info
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={groupByDate}
                      onCheckedChange={setGroupByDate}
                    >
                      Group by date
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={dismissAll}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear all
                    </DropdownMenuItem>
                    {onOpenPreferences && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onOpenPreferences}>
                          <Settings className="h-4 w-4 mr-2" />
                          Notification settings
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Notifications list */}
          <ScrollArea className="h-[480px]">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <BellOff className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">
                  {filter === 'unread' ? 'All caught up!' : 'You have no notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                  <div key={date}>
                    {groupByDate && (
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {date}
                        </p>
                      </div>
                    )}

                    <AnimatePresence>
                      {dateNotifications.map((notification) => {
                        const Icon = typeIcons[notification.type];
                        const iconColor = typeColors[notification.type];

                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={cn(
                              'px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer',
                              'relative group',
                              !notification.read && 'bg-blue-50/50 dark:bg-blue-950/20'
                            )}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                              if (notification.actionUrl) {
                                window.open(notification.actionUrl, '_blank');
                              }
                            }}
                            onMouseEnter={() => setShowActions(notification.id)}
                            onMouseLeave={() => setShowActions(null)}
                          >
                            <div className="flex gap-3">
                              <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
                                <Icon className="h-5 w-5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className={cn(
                                      'text-sm font-medium text-gray-900 dark:text-gray-100',
                                      !notification.read && 'font-semibold'
                                    )}>
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                                      {notification.message}
                                    </p>

                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge
                                        variant={priorityBadgeVariants[notification.priority]}
                                        className="text-xs px-1.5 py-0"
                                      >
                                        {notification.priority}
                                      </Badge>

                                      <span className="text-xs text-gray-400">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {formatDistanceToNow(new Date(notification.timestamp), {
                                          addSuffix: true
                                        })}
                                      </span>

                                      {notification.actionUrl && (
                                        <span className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                                          <ExternalLink className="h-3 w-3" />
                                          {notification.actionLabel || 'View'}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick actions */}
                                  <AnimatePresence>
                                    {showActions === notification.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-1"
                                      >
                                        {!notification.read && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              markAsRead(notification.id);
                                            }}
                                            title="Mark as read"
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            dismissNotification(notification.id);
                                          }}
                                          title="Dismiss"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>

                              {!notification.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {filteredNotifications.length > 5 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  togglePanel();
                  // Navigate to full notifications page if available
                }}
              >
                View all notifications
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Usage example in comments:
/*
// In your Header component:
import { NotificationCenter } from './components/notifications/NotificationCenter';

function Header() {
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 py-2">
      <Logo />
      <div className="flex items-center gap-2">
        <NotificationCenter
          onOpenPreferences={() => setPreferencesOpen(true)}
        />
        <UserMenu />
      </div>
    </header>
  );
}
*/