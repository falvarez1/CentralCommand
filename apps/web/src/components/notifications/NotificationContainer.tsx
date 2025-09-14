import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { NotificationToast } from './NotificationToast';
import { useNotifications, useNotificationSound } from '../../hooks/useNotifications';
import { NotificationType, NotificationPriority } from '../../types/notification.types';
import { cn } from '../../lib/utils';

interface ActiveNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message?: string;
  duration?: number;
  onAction?: () => void;
  actionLabel?: string;
  timestamp: Date;
}

interface NotificationContainerProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  maxVisible?: number;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  position = 'top-right',
  maxVisible = 5
}) => {
  const [activeNotifications, setActiveNotifications] = useState<ActiveNotification[]>([]);
  const [queue, setQueue] = useState<ActiveNotification[]>([]);
  const { playSound } = useNotificationSound();

  // Position classes mapping
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4'
  };

  // Stack direction based on position
  const isBottomPosition = position.includes('bottom');

  // Add notification to active or queue
  const addNotification = (notification: ActiveNotification) => {
    setActiveNotifications(prev => {
      if (prev.length < maxVisible) {
        // Play sound based on notification type
        playSound(notification.type as 'success' | 'error' | 'warning' | 'info');
        return [...prev, notification];
      } else {
        // Add to queue if max visible reached
        setQueue(q => [...q, notification]);
        return prev;
      }
    });
  };

  // Remove notification and process queue
  const removeNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));

    // Process queue if any
    setQueue(prev => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        setTimeout(() => {
          setActiveNotifications(active => [...active, next]);
          playSound(next.type as 'success' | 'error' | 'warning' | 'info');
        }, 100);
        return rest;
      }
      return prev;
    });
  };

  // Create portal container
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.getElementById('notification-portal');
    if (!container) {
      const newContainer = document.createElement('div');
      newContainer.id = 'notification-portal';
      document.body.appendChild(newContainer);
      setPortalContainer(newContainer);
    } else {
      setPortalContainer(container);
    }

    return () => {
      // Cleanup portal container if no notifications
      if (activeNotifications.length === 0 && queue.length === 0) {
        const container = document.getElementById('notification-portal');
        if (container && container.childNodes.length === 0) {
          container.remove();
        }
      }
    };
  }, [activeNotifications.length, queue.length]);

  if (!portalContainer) return null;

  return createPortal(
    <div
      className={cn(
        'fixed z-[9999] pointer-events-none',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="sync">
        <div className={cn(
          'flex flex-col gap-2',
          isBottomPosition ? 'flex-col-reverse' : 'flex-col'
        )}>
          {activeNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: isBottomPosition ? 20 : -20 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1 - (index * 0.02), // Slight scale down for stacked effect
                zIndex: maxVisible - index
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              className="pointer-events-auto"
            >
              <NotificationToast
                id={notification.id}
                type={notification.type}
                priority={notification.priority}
                title={notification.title}
                message={notification.message}
                duration={notification.duration}
                onClose={removeNotification}
                onAction={notification.onAction}
                actionLabel={notification.actionLabel}
                showProgress={true}
                closable={true}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Queue indicator */}
      {queue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'mt-2 px-3 py-1 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800',
            'rounded-full text-xs font-medium pointer-events-auto',
            'shadow-lg'
          )}
        >
          +{queue.length} more in queue
        </motion.div>
      )}
    </div>,
    portalContainer
  );
};

// Global notification manager for programmatic control
class NotificationManager {
  private static instance: NotificationManager;
  private listeners: ((notification: ActiveNotification) => void)[] = [];
  private notificationCounter = 0;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  subscribe(listener: (notification: ActiveNotification) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(
    type: NotificationType,
    title: string,
    message?: string,
    options?: {
      priority?: NotificationPriority;
      duration?: number;
      onAction?: () => void;
      actionLabel?: string;
    }
  ) {
    const notification: ActiveNotification = {
      id: `notification-${++this.notificationCounter}-${Date.now()}`,
      type,
      title,
      message,
      priority: options?.priority || NotificationPriority.MEDIUM,
      duration: options?.duration || 5000,
      onAction: options?.onAction,
      actionLabel: options?.actionLabel,
      timestamp: new Date()
    };

    this.listeners.forEach(listener => listener(notification));
    return notification.id;
  }

  success(title: string, message?: string, options?: any) {
    return this.show(NotificationType.SUCCESS, title, message, options);
  }

  error(title: string, message?: string, options?: any) {
    return this.show(NotificationType.ERROR, title, message, options);
  }

  warning(title: string, message?: string, options?: any) {
    return this.show(NotificationType.WARNING, title, message, options);
  }

  info(title: string, message?: string, options?: any) {
    return this.show(NotificationType.INFO, title, message, options);
  }
}

export const notificationManager = NotificationManager.getInstance();

// Hook to use with the container
export const useNotificationContainer = () => {
  const [notifications, setNotifications] = useState<ActiveNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    return unsubscribe;
  }, []);

  return { notifications };
};

// Usage example in comments:
/*
// In your App.tsx:
import { NotificationContainer } from './components/notifications/NotificationContainer';

function App() {
  return (
    <>
      <YourAppContent />
      <NotificationContainer position="top-right" maxVisible={5} />
    </>
  );
}

// To show notifications programmatically:
import { notificationManager } from './components/notifications/NotificationContainer';

// Show different types
notificationManager.success('Success!', 'Operation completed successfully');
notificationManager.error('Error!', 'Something went wrong', { priority: NotificationPriority.HIGH });
notificationManager.warning('Warning!', 'Please review this action');
notificationManager.info('Info', 'New update available', {
  onAction: () => console.log('Update'),
  actionLabel: 'Update Now',
  duration: 10000
});
*/