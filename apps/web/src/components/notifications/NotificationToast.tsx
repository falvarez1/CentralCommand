import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { NotificationType, NotificationPriority } from '../../types/notification.types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

interface NotificationToastProps {
  id: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message?: string;
  duration?: number;
  showProgress?: boolean;
  closable?: boolean;
  onClose: (id: string) => void;
  onAction?: () => void;
  actionLabel?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'destructive';
  }>;
}

const typeConfig = {
  [NotificationType.SUCCESS]: {
    icon: CheckCircle2,
    className: 'border-green-500 bg-green-50 dark:bg-green-950/30',
    iconColor: 'text-green-600 dark:text-green-400',
    progressColor: 'bg-green-500'
  },
  [NotificationType.ERROR]: {
    icon: AlertCircle,
    className: 'border-red-500 bg-red-50 dark:bg-red-950/30',
    iconColor: 'text-red-600 dark:text-red-400',
    progressColor: 'bg-red-500'
  },
  [NotificationType.WARNING]: {
    icon: AlertTriangle,
    className: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    progressColor: 'bg-yellow-500'
  },
  [NotificationType.INFO]: {
    icon: Info,
    className: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    progressColor: 'bg-blue-500'
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  priority = NotificationPriority.MEDIUM,
  title,
  message,
  duration = 5000,
  showProgress = true,
  closable = true,
  onClose,
  onAction,
  actionLabel,
  actions = []
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (!duration || duration === 0 || isPaused) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);

      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onClose(id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, id, onClose, isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm',
          'min-w-[320px] max-w-[420px]',
          config.className,
          priority === NotificationPriority.URGENT && 'ring-2 ring-offset-2 ring-red-500'
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {title}
                </h4>
                {closable && (
                  <button
                    onClick={() => onClose(id)}
                    className="flex-shrink-0 rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close notification"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>

              {message && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 break-words">
                  {message}
                </p>
              )}

              {(onAction || actions.length > 0) && (
                <div className="mt-3 flex items-center gap-2">
                  {onAction && actionLabel && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onAction}
                      className="h-7 text-xs"
                    >
                      {actionLabel}
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}

                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'secondary'}
                      size="sm"
                      onClick={action.onClick}
                      className="h-7 text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showProgress && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
            <motion.div
              className={cn('h-full transition-all duration-100', config.progressColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {priority === NotificationPriority.URGENT && (
          <div className="absolute top-0 right-0 mt-2 mr-2">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Usage example in comments:
/*
const ExampleUsage = () => {
  const handleClose = (id: string) => {
    console.log(`Closing notification ${id}`);
  };

  return (
    <NotificationToast
      id="1"
      type={NotificationType.SUCCESS}
      priority={NotificationPriority.HIGH}
      title="Deployment Successful"
      message="Your application has been deployed to production."
      duration={5000}
      showProgress={true}
      closable={true}
      onClose={handleClose}
      onAction={() => console.log('View deployment')}
      actionLabel="View Deployment"
      actions={[
        {
          label: 'Rollback',
          onClick: () => console.log('Rollback'),
          variant: 'destructive'
        }
      ]}
    />
  );
};
*/