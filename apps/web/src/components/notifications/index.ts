// Core components
export { NotificationToast } from './NotificationToast';
export { NotificationContainer, notificationManager, useNotificationContainer } from './NotificationContainer';
export { NotificationProvider, useNotificationContext } from './NotificationProvider';
export { NotificationCenter } from './NotificationCenter';
export { NotificationPreferences } from './NotificationPreferences';

// Re-export types
export {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationActionType,
  type Notification,
  type NotificationAction,
  type NotificationPreferences as NotificationPreferencesType,
  type ToastNotification
} from '../../types/notification.types';

// Re-export hooks
export {
  useNotifications,
  useBrowserNotifications,
  useNotificationPreferences,
  useNotificationSound
} from '../../hooks/useNotifications';